const assert = require('assert')
const { pickPlay } = require('../utils/recommend')
const { DISTRICTS, filterPlays } = require('../utils/filters')
const { parseDirectory } = require('../scripts/import-official-places')
const { getMapLocation, openPlayLocation } = require('../utils/location')
const plays = require('../data/plays')
for (const district of DISTRICTS) {
  assert.ok(filterPlays(plays, { district }).length > 0, district)
  for (const mood of ['random', 'healing', 'thrill', 'arts', 'outdoors', 'night']) {
    for (let i = 0; i < 30; i += 1) {
      const options = { district, mood, tagScores: { culture: 12, calm: 8 }, random: () => i / 30 }
      const { play } = pickPlay(plays, options)
      if (filterPlays(plays, options).length === 0) assert.strictEqual(play, null)
      else {
        assert.ok((play.districts || [play.district]).includes(district))
        if (mood !== 'random') assert.deepStrictEqual(play.moods, [mood])
      }
    }
  }
}
const fixtures = [
  { id: 'old', placeId: 'same', district: '杨浦', moods: ['healing'], traits: [] },
  { id: 'sibling', placeId: 'same', district: '杨浦', moods: ['healing'], traits: [] },
  { id: 'fresh', placeId: 'other', district: '杨浦', moods: ['healing'], traits: [] },
  { id: 'other-theme', district: '长宁', moods: ['arts'], traits: [] }
]
assert.strictEqual(pickPlay(fixtures, { district: '杨浦区', mood: 'healing', seenIds: ['old'], random: () => 0 }).play.id, 'fresh')
const exhausted = pickPlay(fixtures, { district: '长宁', mood: 'arts', seenIds: ['other-theme'], random: () => 0 })
assert.strictEqual(exhausted.play.id, 'other-theme')
assert.strictEqual(pickPlay(fixtures, { district: '长宁', mood: 'healing' }).play, null)
assert.strictEqual(pickPlay([], {}).play, null)
const html = '<table><tr><td>序号</td><td>区县</td><td>馆名</td><td>地址</td></tr><tr><td>1</td><td rowspan="2">杨浦区</td><td>甲馆</td><td>甲路1号</td></tr><tr><td>2</td><td>乙馆</td><td>乙路2号</td></tr></table>'
const parsed = parseDirectory(html, ['museum', '官方名录', 'https://www.shanghai.gov.cn/'], '2026-10-19')
assert.deepStrictEqual(parsed.map(place => [place.district, place.name, place.address]), [['杨浦', '甲馆', '杨浦区甲路1号'], ['杨浦', '乙馆', '杨浦区乙路2号']])
assert.strictEqual(getMapLocation({ address: '杨浦区甲路1号' }), null)
let copied = ''
global.wx = { showModal: options => options.success({ confirm: true }), setClipboardData: options => { copied = options.data } }
openPlayLocation({ location: '甲馆', address: '杨浦区甲路1号' })
assert.strictEqual(copied, '甲馆 杨浦区甲路1号')
console.log('district, strict theme, venue diversity and address checks passed')
