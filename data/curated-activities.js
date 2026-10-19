// Only permanent venues/areas from official introductions; no expired festival listings.
const climbingSource = 'https://english.shanghai.gov.cn/en-Fitness/20240723/8d4ed33e90b045f2bc1501a47d916234.html'
const nightSource = 'https://english.shanghai.gov.cn/en-PlanANightOut/20260623/77c5f8ba615140af9c6499c262607846.html'
const autoSource = 'https://english.shanghai.gov.cn/en-CityTour/20250320/ad1d6a13b8c14018ba3cb1798f6bbeb6.html'
const snowSource = 'https://english.shanghai.gov.cn/en-FestivalsCelebrations/20251222/cae73f9283394dc39c24026859b5135f.html'
const climbMission = '向场馆确认新手入门项目并预约，在教练指导下学习装备和落地保护，尝试一条适合自己的基础线路；不自行挑战高难度。'
const venues = [
  ['climbism', '浦东', 'Climbism攀岩馆', '浦东新区耀体路701号东方体育中心', 'thrill', '第一次上墙：攀岩入门', climbMission, climbingSource],
  ['urock', '浦东', 'Urock攀岩馆', '浦东新区金湘路1000号', 'thrill', '用手脚解一道立体难题', climbMission, climbingSource],
  ['new-world-climb', '黄浦', '新世界宇宙攀岩馆', '黄浦区南京西路2—68号新世界城3楼', 'thrill', '在市中心尝试一次攀岩', climbMission, climbingSource],
  ['park-climb', '长宁', '无界攀岩（KING88）', '长宁区长宁路88号KING88商场3楼', 'thrill', '体验有教练指导的基础攀爬', climbMission, climbingSource],
  ['fengxian-climb', '奉贤', '奉贤体育中心攀岩馆', '奉贤区古华路100号', 'thrill', '挑战第一条入门岩道', climbMission, climbingSource],
  ['goat-climb', '徐汇', '山羊攀岩俱乐部', '徐汇区肇嘉浜路1117号TPY中心8楼', 'thrill', '完成一次攀岩新手体验', climbMission, climbingSource],
  ['banana-climb', '长宁', '香蕉攀岩（延安西路店）', '长宁区昭化路658号海粟广场A栋104—105室', 'thrill', '尝试抱石的第一条线路', climbMission, 'https://www.shanghai.gov.cn/nw17239/20260708/51217aacabe94adabad1fe6313f1c1c5.html'],
  ['sic-kart', '嘉定', '上海国际赛车场卡丁车世界', '嘉定区伊宁路2000号', 'thrill', '体验一次正规赛道卡丁车', '提前确认休闲卡丁车的公众开放时段、天气和身高年龄要求，听完安全说明、佩戴装备后完成一节入门驾驶；赛事及包场时不前往。', autoSource],
  ['lsnow', '浦东', '耀雪冰雪世界', '浦东新区沪城环路2088弄1—5号', 'thrill', '在上海尝试真雪入门课', '从场馆官方渠道预约适合新手的真雪体验，确认是否包含教练与装备，按教练安排学习站立和制动，不自行登上高级雪道。', snowSource],
  ['smile-snow', '长宁', '微笑滑雪（虹桥体育公园）', '长宁区绥宁路820号虹桥体育公园1号楼', 'thrill', '在模拟雪道体验第一次滑雪', '确认模拟滑雪设备和新手课程当前开放，预约教练体验，学习基本站姿和重心控制；这里是模拟滑雪训练，不当作真雪雪场。', snowSource],
  ['happy-valley', '松江', '上海欢乐谷', '松江区佘山国家旅游度假区上海欢乐谷', 'thrill', '从一项适合自己的游乐设施开始', '核对乐园当日开放项目与门票，选择符合自身健康、年龄和身高要求的一项设施；先从低强度开始，不追求刷完全部项目。', 'https://english.shanghai.gov.cn/en-ScenicSpots/20240318/e5f11f9f258a4017a024e4fb8c8e19fd.html'],
  ['gongqing-ride', '杨浦', '上海共青森林公园游乐区', '杨浦区军工路2000号', 'thrill', '在森林里尝试一次游乐体验', '先向公园确认卡丁车、海盗船等游乐项目当天实际开放情况，选择一项符合自身条件的项目并按规则体验，项目费用另计。', 'https://www.shanghai.gov.cn/ypwl/20260615/311f83104fb94f08be377409e07eec13.html'],
  ['drive-in-cinema', '嘉定', '安亭汽车影院', '嘉定区安亭镇博园路7575号', 'night', '把电影搬到汽车里的夜晚', '确认影院仍在营业及当晚实际排片，核对是否需要自驾和独立音响，购票后按引导停车看完一部电影；没有汽车先咨询可用观影方式。', autoSource],
  ['daxue-night', '杨浦', '大学路夜间街区', '杨浦区大学路', 'night', '去大学路过一个有烟火气的夜晚', '18点后到公共街区，选一家当晚营业的餐饮小店吃一份小食，再步行逛一段亮灯街面；不预设市集或现场音乐一定存在。', nightSource],
  ['columbia-night', '长宁', '上生·新所夜间街区', '长宁区上生·新所', 'night', '换一个街区吃晚饭', '核对园区当晚公众开放安排，18点后在营业区域选一家餐饮店吃晚饭，再逛一段园区；演出和市集只按当天公告选择。', nightSource],
  ['seoul-night', '闵行', '首尔夜市街区', '闵行区首尔夜市', 'night', '用一顿韩式夜宵认识一片街区', '先在地图核对首尔夜市入口和当晚营业安排，在正常营业的店铺自选一份韩式小食；不承诺季节限定活动。', nightSource],
  ['global-night', '普陀', '环球港夜间消费区域', '普陀区环球港', 'night', '给晚饭留一个新的目的地', '确认商场当晚营业时段，18点后选择餐饮和公共夜景区域游逛；屋顶、演出及付费体验以当日开放公告为准。', nightSource],
  ['xintiandi-night', '黄浦', '新天地—太平湖街区', '黄浦区新天地太平湖周边', 'night', '沿石库门街面开始一个夜晚', '18点后沿开放街面走一段夜路，选一家营业的店铺休息，感受建筑灯光与街区氛围；不进入居民私密空间。', nightSource],
  ['wujiang-night', '静安', '吴江路—丰盛里街区', '静安区吴江路丰盛里周边', 'night', '走一段亮灯后的里弄街面', '确认街区当晚开放，沿公共商业街面步行游逛，选一家营业小店点一份夜宵；不依赖已经结束的节庆表演。', nightSource],
  ['gate-m-night', '徐汇', '西岸梦中心夜间区域', '徐汇区西岸梦中心', 'night', '在江边安排一顿晚饭', '18点后前往当晚开放的商业和公共步道区域，晚饭后散步，水边观景停留在护栏内；电影、演出等另查当日排期。', nightSource],
  ['lujiazui-night', '浦东', '陆家嘴富都滨江—正大区域', '浦东新区陆家嘴滨江正大广场周边', 'night', '在浦东岸看一次亮灯后的外滩', '确认当天公共步道开放，在18至20点沿亮灯主步道步行30分钟，从浦东岸观察对岸夜景，不跨越护栏。', nightSource],
  ['yuyuan-night', '黄浦', '豫园商城街区', '黄浦区豫园商城公共商业街区', 'night', '去老城厢找一份夜间小食', '核对当晚商业街区开放安排，选择营业店铺尝一份小食，逛一段亮灯街面；不把商业街开放等同于豫园园林夜间开放。', nightSource],
  ['joycity-night', '静安', '静安大悦城夜间区域', '静安区静安大悦城', 'night', '在夜间商业空间换个心情', '先确认当晚屋顶与餐饮区域开放安排，按指定夜间通道入场，选择正常营业餐饮或公共观景区；摩天轮等付费项目另查票务。', nightSource]
]
function buildCuratedPlays() {
  return venues.map(([id, district, location, address, mood, action, mission, sourceUrl]) => ({
    id: `cur-${id}-v2-${mood}`, placeId: `cur-${id}`, catalogVersion: 2,
    emoji: mood === 'thrill' ? '🧗' : '🌙', stamp: mood === 'thrill' ? '新体验玩家' : '城市夜游者',
    title: `${location}：${action}`, kicker: mood === 'thrill' ? '第一次尝试，让这个周末不一样。' : '晚饭以后，还有一段城市时间。',
    district, districts: [district], location, address, duration: '1～3小时', budget: '以场馆或店铺当前报价为准',
    bestTime: mood === 'night' ? '18点后，以当天开放为准' : '提前核对开放并预约', moods: [mood],
    traits: mood === 'thrill' ? ['curious', 'active'] : ['night', 'social', 'food'], mission,
    steps: ['出发前用官方渠道核对营业、收费及预约要求', `按官方地址前往${location}，先了解现场规则`, mission],
    tip: '官方介绍用于核对地点及项目类型，不代表实时营业；付费体验、教练和装备须提前确认。',
    sourceTitle: '上海市政府：场馆或夜游目的地介绍', sourceUrl, verifiedAt: '2026-10-19',
    verificationScope: '官方地点和项目介绍；玩法为自助任务', status: 'published', recommendable: true
  }))
}
module.exports = { buildCuratedPlays }
