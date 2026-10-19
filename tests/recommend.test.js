const assert = require('assert')
const { pickPlay, applyFeedback, buildProfile } = require('../utils/recommend')
const { getLevel } = require('../utils/progress')
const shanghaiPlays = require('../data/plays')

const plays = [
  { id: 'quiet', moods: ['healing'], traits: ['calm', 'walk'] },
  { id: 'loud', moods: ['thrill'], traits: ['active', 'social'] }
]

const scores = applyFeedback({}, plays[0], 4)
assert.deepStrictEqual(scores, { calm: 3, walk: 3 })
assert.strictEqual(pickPlay(plays, {
  mood: 'healing',
  tagScores: scores,
  random: () => 0.5
}).play.id, 'quiet')

const profile = buildProfile([
  { status: 'completed', playId: 'quiet', rating: 4 },
  { status: 'completed', playId: 'quiet', rating: 3 },
  { status: 'completed', playId: 'quiet', rating: 4 }
], plays)
assert.strictEqual(profile.title, '安静的城市考古者')

assert.deepStrictEqual(getLevel(0), {
  level: 1,
  name: '上海城市玩家',
  next: '再完成 4 次升级到 LV.2',
  progress: 0
})
assert.strictEqual(getLevel(3).level, 1)
assert.strictEqual(getLevel(3).progress, 75)
assert.strictEqual(getLevel(4).level, 2)
assert.strictEqual(getLevel(400).level, 101)

assert.ok(shanghaiPlays.length >= 18)
assert.strictEqual(new Set(shanghaiPlays.map(play => play.id)).size, shanghaiPlays.length)
shanghaiPlays.forEach(play => {
  assert.ok(play.title && play.mission && play.steps.length === 3)
  if (play.latitude !== undefined || play.longitude !== undefined) {
    assert.ok(play.latitude >= -90 && play.latitude <= 90)
    assert.ok(play.longitude >= -180 && play.longitude <= 180)
  } else assert.ok(play.address.length >= 5)
})

console.log('recommendation checks passed')
