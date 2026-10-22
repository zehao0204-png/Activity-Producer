const assert = require('assert')
const registry = require('../data/coordinates')
const plays = require('../data/plays').filter(play => play.recommendable !== false)
const { withCoordinates } = require('../utils/coordinates')
const { getMapLocation } = require('../utils/location')
const { canonical, point } = require('../scripts/collect-coordinate-candidates')
assert.strictEqual(canonical('上海市銀行博物館'), canonical('上海市银行博物馆'))
assert.strictEqual(point('Point(121.4 31.2)'), null, 'coarse city-level coordinates must not be imported')
assert.ok(Object.keys(registry).length > 0)
for (const [placeId, coordinate] of Object.entries(registry)) {
  const activity = plays.find(play => play.placeId === placeId)
  assert.ok(activity, placeId)
  assert.strictEqual(activity.address, coordinate.address)
  assert.strictEqual(new URL(coordinate.coordinateSourceUrl).host, 'www.wikidata.org')
  assert.strictEqual(activity.coordinateSystem, 'wgs84')
  const location = getMapLocation(activity)
  assert.ok(location && Number.isFinite(location.latitude) && Number.isFinite(location.longitude))
  assert.notStrictEqual(location.longitude, coordinate.longitude, 'WGS84 point must be converted for WeChat')
  const stale = { ...activity, latitude: undefined, longitude: undefined, coordinateRevision: undefined }
  assert.strictEqual(withCoordinates(stale).latitude, coordinate.latitude)
  const moved = { ...stale, address: '已搬迁至其他地址' }
  assert.strictEqual(withCoordinates(moved).latitude, undefined)
  const manuallyVerified = { ...activity, latitude: 31.1, longitude: 121.4 }
  assert.strictEqual(withCoordinates(manuallyVerified).latitude, 31.1)
}
assert.ok(plays.filter(play => Number.isFinite(play.latitude)).length > 37)
console.log('offline coordinate provenance, address guard, stale data and WGS84 conversion checks passed')
