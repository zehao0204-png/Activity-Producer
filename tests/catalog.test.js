const assert = require('assert')
const plays = require('../data/plays')
const seed = require('../cloudfunctions/getPlays/seed.json')
const { isValidPlay, sanitizePlay } = require('../cloudfunctions/getPlays/catalog')
const { wgs84ToGcj02 } = require('../utils/location')

const officialHosts = new Set([
  'whlyj.sh.gov.cn',
  'cmp.whlyj.sh.gov.cn',
  'www.shanghai.gov.cn',
  'english.shanghai.gov.cn',
  'www.meet-in-shanghai.net',
  'www.library.sh.cn',
  'www.jfdaily.com', 'shpt.gov.cn', 'www.shhk.gov.cn', 'www.shbsq.gov.cn',
  'sww.sh.gov.cn', 'www.shqp.gov.cn', 'shcm.gov.cn', 'www.shcm.gov.cn',
  'sh.people.com.cn', 'www.sh-italent.cn', 'touch.shio.gov.cn', 'm.thepaper.cn'
])
const published = plays.filter(play => play.recommendable !== false && play.status === 'published')

assert.ok(published.length >= 500)
const { DISTRICTS, MOOD_LABELS, filterPlays } = require('../utils/filters')
for (const district of DISTRICTS) {
  for (const mood of Object.keys(MOOD_LABELS).filter(key => key !== 'random')) {
    const pool = filterPlays(published, { district, mood })
    assert.ok(new Set(pool.map(play => play.placeId)).size >= 2, `${district}/${mood} needs at least two distinct venues`)
  }
}
assert.ok(new Set(filterPlays(published, { district: '杨浦', mood: 'thrill' }).map(play => play.placeId)).size >= 4)
assert.strictEqual(seed.length, published.length)
assert.ok(new Set(published.map(play => play.placeId)).size >= 400)
assert.strictEqual(new Set(plays.map(play => play.id)).size, plays.length)
assert.deepStrictEqual(seed.map(play => play.id), published.map(play => play.id).sort())

published.forEach(play => {
  assert.ok(isValidPlay(play), play.id)
  assert.strictEqual(sanitizePlay(play).id, play.id)
  assert.ok(officialHosts.has(new URL(play.sourceUrl).host), play.sourceUrl)
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(play.verifiedAt))
  assert.strictEqual(play.catalogVersion, 2)
  assert.strictEqual(play.moods.length, 1, `ambiguous theme: ${play.id}`)
  assert.ok(!/(附近正规|就近匹配|根据当天)/.test(`${play.location}${play.address}`))
})

const converted = wgs84ToGcj02(31.2403094, 121.4919724)
assert.ok(converted.latitude > 31.23 && converted.latitude < 31.25)
assert.ok(converted.longitude > 121.49 && converted.longitude < 121.51)
assert.notStrictEqual(converted.longitude, 121.4919724)

console.log('verified catalog checks passed')
