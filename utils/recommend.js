const { filterPlays } = require('./filters')
const TAG_LABELS = {
  calm: '安静漫游',
  curious: '城市猎奇',
  culture: '文艺现场',
  walk: '步行探索',
  nature: '自然呼吸',
  night: '夜间出逃',
  social: '轻社交',
  active: '户外出汗',
  budget: '低预算',
  food: '城市烟火'
}

function scorePlay(play, mood, tagScores) {
  const moodScore = mood === 'random' || play.moods.includes(mood) ? 6 : -3
  return play.traits.reduce((score, tag) => score + (tagScores[tag] || 0), moodScore)
}

function pickPlay(plays, options = {}) {
  const mood = options.mood || 'random'
  const tagScores = options.tagScores || {}
  const seen = new Set(options.seenIds || [])
  const random = options.random || Math.random
  const recommendable = filterPlays(plays, options)
  if (!recommendable.length) return { play: null, reason: '这个区域暂时没有符合主题的玩法，试试其他区域或随机盲盒。', wildcard: false }
  let candidates = recommendable.filter(play => !seen.has(play.id))
  if (!candidates.length) candidates = recommendable
  const seenPlaces = new Set(plays.filter(play => seen.has(play.id)).map(play => play.placeId || play.id))
  const freshPlaces = candidates.filter(play => !seenPlaces.has(play.placeId || play.id))
  if (freshPlaces.length) candidates = freshPlaces

  const wildcard = Object.keys(tagScores).length > 0 && random() < 0.1
  if (wildcard) {
    const play = candidates[Math.floor(random() * candidates.length)]
    return { play, reason: '这次故意不按你的偏好来', wildcard: true }
  }

  const ranked = candidates
    .map(play => ({ play, score: scorePlay(play, mood, tagScores) + random() * 4 }))
    .sort((a, b) => b.score - a.score)
  const pool = ranked.slice(0, Math.min(5, ranked.length))
  const winner = pool[Math.floor(random() * pool.length)]
  const favorite = winner.play.traits
    .slice()
    .sort((a, b) => (tagScores[b] || 0) - (tagScores[a] || 0))[0]
  const reason = tagScores[favorite] > 0
    ? `因为你似乎喜欢${TAG_LABELS[favorite]}`
    : '给平常的周末换一种打开方式'
  return { play: winner.play, reason, wildcard: false }
}

function applyFeedback(scores, play, rating) {
  const next = { ...scores }
  const delta = rating === 4 ? 3 : rating === 3 ? 2 : rating === 2 ? 0 : -2
  play.traits.forEach(tag => {
    next[tag] = Math.max(-8, Math.min(12, (next[tag] || 0) + delta))
  })
  return next
}

function buildProfile(records, plays) {
  const completed = records.filter(record => record.status === 'completed')
  const playMap = Object.fromEntries(plays.map(play => [play.id, play]))
  const counts = {}
  completed.forEach(record => {
    const play = playMap[record.playId]
    if (!play || record.rating < 3) return
    play.traits.forEach(tag => { counts[tag] = (counts[tag] || 0) + 1 })
  })
  const topTags = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 3)
  if (completed.length < 3) {
    return {
      title: '等待被发现的城市玩家',
      description: `再完成 ${3 - completed.length} 次挑战，就能生成你的上海人格。`,
      topTags: topTags.map(tag => TAG_LABELS[tag])
    }
  }
  const lead = topTags[0]
  const profiles = {
    calm: ['安静的城市考古者', '你偏爱不赶时间的街区、旧建筑和被忽略的角落。'],
    curious: ['城市隐藏款猎人', '热门榜单困不住你，你更享受偶遇陌生地点的惊喜。'],
    culture: ['野生文艺观察员', '展览、书店和城市故事，是你理解上海的秘密入口。'],
    walk: ['街区漫游体质', '你习惯用脚步丈量城市，拐错的弯往往才是正解。'],
    nature: ['城市绿洲收藏家', '你会主动寻找水边、树荫和城市里的自然缝隙。'],
    night: ['上海夜行动物', '当城市慢下来，你的探索才刚刚开始。'],
    active: ['周末能量玩家', '流汗和移动让你真正从工作日切换出来。'],
    food: ['城市烟火侦察员', '你擅长从市场、老店和一口陌生味道认识一片街区。']
  }
  const selected = profiles[lead] || profiles.curious
  return {
    title: selected[0],
    description: selected[1],
    topTags: topTags.map(tag => TAG_LABELS[tag])
  }
}

module.exports = { TAG_LABELS, pickPlay, applyFeedback, buildProfile }
