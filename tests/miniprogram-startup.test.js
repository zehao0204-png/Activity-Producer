const assert = require('assert')
const fs = require('fs')
const path = require('path')
const vm = require('vm')
const root = path.resolve(__dirname, '..')
const packIgnore = require('../project.config.json').packOptions.ignore
assert.ok(packIgnore.some(item => item.type === 'folder' && item.value === 'scripts'), 'Node build scripts must not be packaged in the WeChat client')
assert.ok(packIgnore.some(item => item.type === 'folder' && item.value === 'cloudfunctions'), 'Server functions and seeds must not be packaged in the frontend')
assert.ok(packIgnore.some(item => item.type === 'file' && item.value === 'data/official-places.json'), 'The raw directory duplicates the generated client JS and must not be packaged')
function excluded(filename) {
  const relative = path.relative(root, filename).split(path.sep).join('/')
  return packIgnore.some(rule => relative === rule.value || (rule.type === 'folder' && relative.startsWith(rule.value + '/')))
}
function sourceBytes(directory) {
  return fs.readdirSync(directory, {withFileTypes:true}).reduce((total, entry) => {
    const filename = path.join(directory, entry.name)
    if (entry.name === '.git' || excluded(filename)) return total
    return total + (entry.isDirectory() ? sourceBytes(filename) : fs.statSync(filename).size)
  }, 0)
}
// Source-only estimate, not the WeChat compiler's final package size. Keep ample headroom.
const frontendBytes = sourceBytes(root)
assert.ok(frontendBytes < 1536 * 1024, `Frontend sources exceed the 1.5 MiB safety budget: ${frontendBytes}`)
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
  assert.ok(!excluded(filename), `Runtime dependency is excluded from the frontend package: ${filename}`)
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
assert.strictEqual(pages[0].data.availableCount, 659)
assert.ok(pages[0].data.districts.length === 17)
console.log('JS-only client module loading and three-page startup checks passed')
console.log(`Frontend source estimate after pack exclusions: ${(frontendBytes / 1024).toFixed(1)} KiB (compiler output may differ)`)
