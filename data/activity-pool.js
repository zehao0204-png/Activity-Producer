const directory = require('./official-places.json')
const { places: existingPlaces } = require('./catalog')
const CATALOG_VERSION = 2
const rules = {
  healing: [
    ['🌿', '感官休息站', '留出一段不赶路的树荫时间', '找一处允许停留的长椅，静坐20分钟，再记下三种声音；不安排步数或打卡。', ['calm', 'nature']],
    ['🍃', '绿意收藏家', '给自己一场慢下来的绿意休息', '在公共游园区域选一小段安静步道，慢走、停留共30分钟，记录一片叶子的纹理；不采摘。', ['nature', 'calm']],
    ['☁️', '周末留白者', '用半小时给工作日按下暂停', '沿开放步道找到一处舒适休息点，用半小时看树影或水面，结束后写下此刻心情。', ['calm', 'nature']],
    ['🎧', '自然倾听者', '关掉耳机听一次自然现场', '在开放游园范围安静停留30分钟，辨认风声、鸟声和脚步声，画一张自己的声音小图。', ['nature', 'calm']]
  ],
  outdoors: [
    ['🏃', '步行能量站', '完成一场40分钟快走', '在允许步行的开放园路先热身5分钟，快走30分钟，再慢走5分钟；以仍能说完整句子的强度为准。', ['active', 'walk', 'nature']],
    ['👟', '耐力漫游者', '把公园走成一条连续运动路线', '从公开入口出发，在开放园路连续步行45分钟；绕行闭园区域，记录本次运动时间。', ['active', 'walk', 'nature']],
    ['🏅', '周末运动员', '完成三段式步行训练', '在公共园路完成三轮“快走8分钟、慢走2分钟”，加上热身和收尾，不占用机动车道。', ['active', 'walk']],
    ['🚶', '户外补能者', '挑战一次不刷手机的长距离步行', '沿开放步道步行约3公里，量力调整距离；结束后补水并记录用时，不追求速度。', ['active', 'walk', 'nature']]
  ],
  arts: [
    ['🎨', '作品慢读者', '看懂一件作品背后的表达', '选一件现场实际展出的作品或文物，先观察再读说明，记录材料、时代和一个你想追问的问题。', ['culture', 'curious']],
    ['🖼️', '私人策展人', '用三件展品整理一个主题', '从当天可参观的展览里选三件作品或展品，以材料、时代或风格为线索做一页私人观展笔记。', ['culture', 'curious']],
    ['📚', '城市故事读者', '带走一个以前不知道的城市故事', '读完一个展区的说明，选一件有明确史料介绍的展品，用自己的话写下它与上海的关系。', ['culture', 'calm']],
    ['✍️', '展览笔记员', '做一次有主题的观展', '出发前从馆方当前展览中选一个主题，到馆围绕它观察30至60分钟，写下两个发现。', ['culture', 'curious']]
  ],
  thrill: [
    ['🔬', '陌生领域探索者', '第一次走进一个陌生技术领域', '从馆方当前开放展区中选一个你不了解的技术主题，观察现场装置；如有对公众开放的互动项目，按工作人员指引尝试，记录一个新原理。', ['curious', 'active']],
    ['🚀', '科学发现者', '带着一个问题开启科学探索', '先写下一个与场馆主题有关的问题，再到当前开放展区寻找答案；若互动装置未开放，改用实物与说明完成探索。', ['curious', 'active']]
  ],
  night: [
    ['🌙', '夜间观展者', '把一次看展安排在下班以后', '先确认馆方当天确实有夜场并预约购票，18点后入馆，围绕一件作品慢看；在停止入场前到达，不把日间开放当夜场。', ['night', 'culture']],
    ['🌃', '蓝调时刻收藏家', '走进一段有灯光的滨水夜色', '确认当天公共空间晚间开放后，选择18至20点沿亮灯的公共主步道散步30分钟；不进入暗处、封闭地段或临水危险区域。', ['night', 'walk']]
  ]
}
function nameKey(place) { return `${place.district}|${place.name.replace(/上海市|上海|\s/g, '')}` }
function modesFor(place) {
  if (place.type === 'park') return ['healing', 'outdoors']
  if (place.type === 'art') return /(?:20|21|22):[0-5]\d/.test(place.openHours) ? ['arts', 'night'] : ['arts']
  if (place.type === 'museum') return /科技|天文|自然博物|航海|汽车博物|航空|地质|气象|深海|潜艇|航宇|铁路|电信|无线电/.test(place.name) ? ['thrill'] : ['arts']
  if (place.id === 'fuxing-ferry') return ['thrill', 'night']
  if (place.type === 'route') return ['outdoors', 'night']
  return ['arts']
}
function buildCurrentPlays() {
  // One venue may have different modes, but one activity belongs to one theme only.
  const byName = new Map(directory.map(place => [nameKey(place), place]))
  existingPlaces.forEach(place => {
    const previous = byName.get(nameKey(place))
    byName.set(nameKey(place), previous ? { ...place, ...previous, latitude: place.latitude, longitude: place.longitude, coordinateSystem: place.coordinateSystem } : place)
  })
  return [...byName.values()].flatMap((place, index) => modesFor(place).map(mood => {
    const choices = rules[mood]
    let [emoji, stamp, action, mission, traits] = choices[index % choices.length]
    const nightArt = mood === 'night' && place.type === 'art'
    if (mood === 'night') [emoji, stamp, action, mission, traits] = rules.night[nightArt ? 0 : 1]
    if (place.id === 'fuxing-ferry' && mood === 'thrill') {
      action = '完成一次日常通勤以外的轮渡体验'
      mission = '核对官方当日航线与班次，购买正规轮渡船票，按码头规则完成一次过江；在安全区域观察两岸，不越过护栏。'
    }
    if (mood === 'outdoors' && place.type === 'route') {
      action = '沿开放滨水步道完成45分钟快走'
      mission = '核对公共步道的开放范围，先热身，再沿主路快走35分钟、慢走10分钟；遇到封闭段原路折返。'
    }
    return {
      id: `${place.id}-v2-${mood}`, placeId: place.id, catalogVersion: CATALOG_VERSION,
      emoji, stamp, title: `${place.name}：${action}`, kicker: { healing: '坐下来，让周末慢一点。', outdoors: '用一场真正的运动切换状态。', arts: '读作品、看展陈，带走一个新故事。', thrill: '给第一次接触的事物留一个位置。', night: '白天结束后，还有另一种城市节奏。' }[mood],
      district: place.district, districts: place.district.split(/\s*→\s*/), location: place.name, address: place.address,
      ...(Number.isFinite(place.latitude) && Number.isFinite(place.longitude) ? { latitude: place.latitude, longitude: place.longitude, coordinateSystem: place.coordinateSystem } : {}),
      duration: mood === 'outdoors' ? '40～60分钟' : mood === 'healing' ? '30～60分钟' : '1～2小时',
      budget: /免费/.test(place.fee) && !/部分免费/.test(place.fee) ? '公共区域免费，特展另计' : '票价以馆方最新公告为准',
      bestTime: mood === 'night' ? (nightArt ? '仅限夜场开放日，18点后' : '18:00～20:00，须确认开放') : (place.type === 'park' || place.type === 'route' ? '白天，须确认当天开放' : '馆方开放时段，先确认预约'),
      openingHours: place.openHours,
      moods: [mood], traits, mission,
      steps: ['出发前核对官方最新开放、票务及预约要求', `前往${place.name}的对公众开放区域；遇闭馆不进入`, mission],
      tip: `${place.fee}；名录可核对地点，不代表实时营业。请先确认开放；不承诺任何限时展览或互动项目当天存在。`,
      sourceTitle: place.sourceTitle, sourceUrl: place.sourceUrl, verifiedAt: place.verifiedAt,
      verificationScope: '官方名录或官方介绍中的地点；玩法为自助任务', status: 'published', recommendable: true
    }
  }))
}
module.exports = { CATALOG_VERSION, buildCurrentPlays }
