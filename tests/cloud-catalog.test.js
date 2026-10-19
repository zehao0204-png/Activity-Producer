const assert = require('assert')
const fs = require('fs')
const path = require('path')
const vm = require('vm')
const seed = require('../cloudfunctions/getPlays/seed.json')
const retired = require('../cloudfunctions/getPlays/retired.json')
const legacy = require('../cloudfunctions/getPlays/legacy-seed.json')
const { sanitizePlay } = require('../cloudfunctions/getPlays/catalog')
const custom = { ...seed[0], id: 'custom-admin-activity', _id: 'custom-doc' }
const oldId = retired[0]
const documents = new Map([
  ['old-doc', { ...seed[0], id: oldId, _id: 'old-doc', catalogVersion: 1 }],
  [seed[0].id, { ...seed[0], _id: seed[0].id, catalogVersion: 1, moods: ['arts', 'healing'] }],
  ['custom-doc', custom]
])
let writes = 0
let failOnce = true
function query(offset = 0, limit = 100) {
  return {
    skip: value => query(value, limit), limit: value => query(offset, value),
    get: async () => ({ data: [...documents.values()].filter(item => item.status === 'published').sort((a, b) => a._id.localeCompare(b._id)).slice(offset, offset + limit) })
  }
}
const collection = {
  limit: value => query(0, value), where: () => query(),
  doc: id => ({
    set: async ({ data }) => {
      writes += 1
      if (failOnce && writes === 25) { failOnce = false; throw new Error('simulated interrupted import') }
      documents.set(id, { ...data, _id: id })
    },
    update: async ({ data }) => { writes += 1; documents.set(id, { ...documents.get(id), ...data }) }
  })
}
const exported = {}
const sdk = { init() {}, DYNAMIC_CURRENT_ENV: 'test', database: () => ({ collection: () => collection }) }
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../cloudfunctions/getPlays/index.js'), 'utf8'), {
  exports: exported,
  require: name => ({ 'wx-server-sdk': sdk, './seed.json': seed, './retired.json': retired, './legacy-seed.json': legacy, './catalog': { sanitizePlay } })[name]
})
async function run() {
  const oldClient = await exported.main()
  assert.strictEqual(oldClient.count, 100)
  assert.ok(oldClient.plays.every(play => Number.isFinite(play.latitude) && Number.isFinite(play.longitude)))
  assert.strictEqual(writes, 0, 'old clients must not trigger the new catalog migration')
  await assert.rejects(exported.main({ catalogVersion: 2 }), /interrupted/)
  const result = await exported.main({ catalogVersion: 2 })
  assert.strictEqual(result.plays.length, seed.length + 1)
  assert.strictEqual(new Set(result.plays.map(play => play.id)).size, result.plays.length)
  assert.strictEqual(documents.get('old-doc').status, 'legacy')
  assert.strictEqual(documents.get(seed[0].id).catalogVersion, 2)
  assert.strictEqual(result.plays.find(play => play.id === seed[0].id).moods.length, 1)
  assert.ok(result.plays.find(play => play.id === custom.id))
  const before = writes
  await exported.main({ catalogVersion: 2 })
  assert.strictEqual(writes, before, 'subsequent reads must not rewrite the database')
  console.log('cloud pagination, interrupted migration, retirement and custom content checks passed')
}
run().catch(error => { console.error(error); process.exitCode = 1 })
