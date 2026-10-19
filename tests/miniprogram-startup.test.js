const assert = require('assert')
const fs = require('fs')
const path = require('path')
const vm = require('vm')
const root = path.resolve(__dirname, '..')
const cache = new Map()
const pages = []
let app
const storage = {}
const wx = {
  getStorageSync: key => storage[key],
  setStorageSync: (key, value) => { storage[key] = value },
  showShareMenu() {}
}
function load(filename) {
  if (cache.has(filename)) return cache.get(filename).exports
  const module = { exports: {} }
  cache.set(filename, module)
  const context = {
    module, exports: module.exports, console, wx, setTimeout, clearTimeout,
    App: config => { app = config }, Page: config => { pages.push(config) }, getApp: () => app,
    require: request => {
      assert.ok(request.startsWith('.'), `client dependency must be local: ${request}`)
      assert.notStrictEqual(path.extname(request), '.json', `WeChat client cannot require JSON as a JS module: ${request}`)
      const target = path.resolve(path.dirname(filename), path.extname(request) ? request : `${request}.js`)
      return load(target)
    }
  }
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), context, { filename })
  return module.exports
}
load(path.join(root, 'app.js'))
assert.ok(app, 'App must register successfully')
for (const page of ['index', 'challenge', 'explore']) load(path.join(root, `pages/${page}/index.js`))
assert.strictEqual(pages.length, 3, 'all three pages must register')
assert.strictEqual(app.getPlays().filter(play => play.recommendable !== false).length, 659)
pages.forEach(page => {
  page.setData = value => Object.assign(page.data, value)
  if (page.onLoad) page.onLoad()
  if (page.onShow) page.onShow()
})
assert.strictEqual(pages[0].data.catalogCount, 659)
assert.ok(pages[0].data.districts.length === 17)
console.log('JS-only client module loading and three-page startup checks passed')
