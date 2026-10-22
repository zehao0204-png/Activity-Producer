const assert = require('assert')
const { normalizeState } = require('../cloudfunctions/syncState/state')

const storage = {}
storage['weekend-unboxed-state-v1'] = {
  challenges: [],
  records: [],
  tagScores: {},
  seenIds: [],
  stats: { completedCount: 0 },
  updatedAt: 1
}
const remoteState = {
  challenges: [{ playId: 'remote-play', acceptedAt: 2, status: 'active' }],
  records: [],
  tagScores: {},
  seenIds: [],
  stats: { completedCount: 8 },
  updatedAt: 2
}
const calls = []
const catalog = require('../data/plays').filter(play => play.recommendable !== false)
let app
let notified = 0

global.wx = {
  getStorageSync: key => storage[key],
  setStorageSync: (key, value) => { storage[key] = value },
  cloud: {
    DYNAMIC_CURRENT_ENV: 'dynamic',
    init: options => calls.push({ init: options }),
    callFunction: async request => {
      calls.push(request)
      if (request.name === 'getPlays') return { result: { plays: catalog } }
      return request.data.action === 'get'
        ? { result: { exists: true, state: remoteState } }
        : { result: { saved: true } }
    }
  }
}
global.getCurrentPages = () => [{
  onCloudStateReady: () => { notified += 1 },
  onCatalogReady: () => { notified += 1 }
}]
global.App = config => { app = config }

require('../app')

async function run() {
  app.onLaunch()
  await app.cloudReady
  const saved = storage['weekend-unboxed-state-v1']
  assert.strictEqual(saved.challenges[0].playId, 'remote-play')
  assert.strictEqual(saved.stats.completedCount, 8)
  assert.strictEqual(app.getPlays().filter(play => play.recommendable !== false).length, catalog.length)
  assert.strictEqual(notified, 2)
  const oldPlay = require('../data/plays').find(play => play.status === 'legacy')
  app.catalog = [{ ...oldPlay, recommendable: true, status: 'published' }]
  assert.strictEqual(app.getPlays().find(play => play.id === oldPlay.id).recommendable, false)
  const newPlay = catalog[0]
  app.catalog = [{ ...newPlay, catalogVersion: 1, moods: ['arts', 'healing'] }]
  assert.deepStrictEqual(app.getPlays().find(play => play.id === newPlay.id).moods, newPlay.moods)
  const mapped = catalog.find(play => play.coordinateRevision)
  app.catalog = [{ ...mapped, latitude: undefined, longitude: undefined, coordinateRevision: undefined }]
  assert.strictEqual(app.getPlays().find(play => play.id === mapped.id).latitude, mapped.latitude)

  app.acceptChallenge('local-play')
  await app.flushCloudSync()
  clearTimeout(app.cloudSyncTimer)
  assert.ok(calls.some(call => call.data && call.data.action === 'save'))

  const normalized = normalizeState({
    challenges: Array.from({ length: 6 }, (_, index) => ({ playId: `p-${index}` })),
    records: [{ playId: 'p-1', status: 'completed', rating: 99, note: 'x'.repeat(250) }],
    tagScores: { calm: 999 },
    seenIds: ['p-1'],
    stats: { completedCount: 9999 },
    updatedAt: 3
  })
  assert.strictEqual(normalized.challenges.length, 4)
  assert.strictEqual(normalized.records[0].rating, 0)
  assert.strictEqual(normalized.records[0].note.length, 200)
  assert.strictEqual(normalized.tagScores.calm, 20)
  assert.strictEqual(normalized.stats.completedCount, 9999)
  console.log('cloud sync checks passed')
}

run().catch(error => {
  console.error(error)
  process.exitCode = 1
})
