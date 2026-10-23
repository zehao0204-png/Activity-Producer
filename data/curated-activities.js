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
// Research checked 2026-10-23. These are venue-based ideas, not promises of live availability.
const additions = [
  ['xiyunlou-night', '嘉定', '西云楼夜间商业街区', '嘉定区洪德路220号', 'night', '到水街找一顿晚餐', '先查商业街区及餐厅当晚营业，预约晚饭后在开放的亮灯街面走一段；不预设过去的奇趣花园夜市、免费停车或限时福利仍然存在。', 'https://m.thepaper.cn/newsDetail_forward_7436093', '上海嘉定官方澎湃号：夜间商业街区指南'],
  ['aob-yangpu', '杨浦', 'AOB攀研学院（创智天地）', '杨浦区淞沪路252号地下一层01、02、03室', 'thrill', '用一条抱石线开启周末', climbMission, 'https://www.jfdaily.com/sgh/detail?id=4051320', '上海杨浦：攀岩场馆介绍'],
  ['tashan-yangpu', '杨浦', 'TA山攀岩馆（百联又一城）', '杨浦区淞沪路8号百联又一城8楼南区', 'thrill', '尝试一次商场里的攀岩入门', climbMission, 'https://www.jfdaily.com/sgh/detail?id=4051320', '上海杨浦：攀岩场馆介绍'],
  ['gonghui-yangpu', '杨浦', '共绘攀岩馆', '杨浦区国顺东路800号西楼2楼', 'thrill', '跟教练学习第一次上墙', climbMission, 'https://www.jfdaily.com/sgh/detail?id=4051320', '上海杨浦：攀岩场馆介绍'],
  ['partyday-putuo', '普陀', 'PARTYDAY超星嘉年华（环球港）', '普陀区中山北路3300号上海环球港L4', 'thrill', '试一项没玩过的模拟运动', '先向场馆确认适合成人的新手项目、收费和健康要求，从XR或模拟赛车中选一项实际开放的体验；不把模拟驾驶当作真实赛道。', 'https://shpt.gov.cn/bm-ms/20261013/973655.html', '上海普陀：环球港运动体验介绍'],
  ['diskart-putuo', '普陀', '迪士卡卡丁车（118广场）', '普陀区金沙江路1685号118广场', 'thrill', '在正规场馆完成一节卡丁车入门', '预约前确认场馆营业、入口及身高年龄要求，听完安全说明并戴好头盔后体验基础驾驶，遵守限速和旗语，不竞速追逐。', 'https://www.jfdaily.com/sgh/detail?id=4010486', '东方体育日报：迪士卡卡丁车实地报道'],
  ['smalltree-hongkou', '虹口', '小树攀岩馆', '虹口区东江湾路444号虹口足球场4楼', 'thrill', '到足球场里学一次攀岩', climbMission, 'https://www.shhk.gov.cn/xwzx/002008/002008040/20230416/fe1201ef-a095-42fa-bff8-59724bec1d69.html', '上海虹口：运动场馆指南'],
  ['xiaoyan-hongkou', '虹口', '啸岩馆', '虹口区花园路128号运动LOFT一街区A座1楼', 'thrill', '用一次基础攀爬认识自己的重心', climbMission, 'https://www.shhk.gov.cn/xwzx/002008/002008040/20230416/fe1201ef-a095-42fa-bff8-59724bec1d69.html', '上海虹口：运动场馆指南'],
  ['s10-baoshan', '宝山', 'S10国际潜水运动俱乐部（三邻桥）', '宝山区江杨南路485号三邻桥体育文化园', 'thrill', '预约一堂泳池潜水体验课', '先向俱乐部确认体验课、健康筛查及教练资质，按要求预约，在教练全程指导下学习呼吸和基础装备；不独自下潜，不把体验课当作持证潜水。', 'https://www.shbsq.gov.cn/shbs/bsdt/20220817/345519.html', '上海宝山：三邻桥体育文化园项目介绍'],
  ['muxintang-baoshan', '宝山', '沐心堂射箭馆（云瑞邻里中心）', '宝山区共和新路5219号云瑞邻里中心', 'thrill', '第一次拉弓，先学安全规则', '确认射箭馆当前营业和新手课，预约工作人员指导，先学习护具、站位及统一取箭规则，再完成一轮近距离基础练习；不自行操作陌生装备。', 'https://sww.sh.gov.cn/swdt/20250807/55c891486567464a91538412024b3fe8.html', '上海市商务委：宝山夜间消费场所指南'],
  ['jinwu-qingpu', '青浦', '金坞半岛水上运动基地', '青浦区商周公路988号', 'thrill', '在教练陪同下尝试皮划艇', '出发前确认当季开放、天气、水域许可及教练安排，穿好救生衣，在工作人员指定水域学习上下艇和基础划行；停航或天气不适合时不前往。', 'https://www.shqp.gov.cn/shqp/ggfw/bmts/20240815/1182508.html', '上海青浦：水上运动场所指南'],
  ['weekend-qingpu', '青浦', '周末水上俱乐部', '青浦区朱家角镇西井街300号', 'thrill', '把第一次桨板体验交给教练', '先咨询当前季节是否开课，核对水域、收费及健康要求，预约教练，穿救生衣从跪姿和平衡训练开始；不自行下水，不预设全年开放。', 'https://www.shqp.gov.cn/shqp/ggfw/bmts/20240815/1182508.html', '上海青浦：水上运动场所指南'],
  ['jinsuwan-kart', '金山', '金速湾卡丁车', '金山区沪杭公路7385号', 'thrill', '去金山体验正规卡丁车赛道', '先核对公众开放、天气、身高年龄与收费要求，听完安全说明并佩戴装备，完成适合初学者的一节驾驶体验；包场或停运时不前往。', 'https://english.shanghai.gov.cn/en-SportsEvents/20240412/7066f53ff2e34185b18a3a20bc41cf48.html', '上海市政府：金速湾卡丁车介绍'],
  ['jinshan-water', '金山', '金山城市沙滩水上体验区', '金山区沪杭公路7555号金山城市沙滩', 'thrill', '向海边场馆预约一次水上入门', '提前向景区确认当季实际开放的皮划艇等入门项目、教练和海况；穿救生衣、在指定水域听从指导。只在景区明确接待且天气适合时参加，不承诺全年营业。', 'https://www.shanghai.gov.cn/nw17239/20260323/6284bdeea6bd44319e31050e042812fa.html', '上海市政府：金山水上运动项目介绍'],
  ['changxing-climb', '崇明', '长兴岛郊野公园攀岩乐园', '崇明区长兴镇秋柑路199号长兴岛郊野公园内', 'thrill', '在郊野公园预约一条入门岩道', climbMission + '先向公园确认攀岩乐园当天是否接待、具体入口和天气要求。', 'https://shcm.gov.cn/bmpd/019014/019014002/20250919/6bccad84-aee5-414d-9713-928d02c5c403.html', '上海崇明体育局：攀岩场所许可信息'],
  ['mingzhu-water', '崇明', '明珠湖水上体验区', '崇明区三华公路333号西沙明珠湖景区', 'thrill', '在湖面尝试一次水上卡丁船', '先向景区确认水上卡丁船当季是否开放及年龄健康要求，穿救生衣，听完工作人员说明后按指定路线体验；大风、停航及非开放季不参加。', 'https://www.shcm.gov.cn/xwzx/002003/20260615/6a23ba53-7dcb-4538-bbb8-3aeb83311fcc.html', '上海崇明：明珠湖水上项目实地报道'],
  ['centurystar-minhang', '闵行', '世纪星滑冰俱乐部（万象城）', '闵行区吴中路1551号万象城4楼', 'thrill', '穿上冰鞋学会第一步滑行', '提前确认冰场营业及新手课程，预约教练并佩戴护具，学习安全摔倒、起身和基础滑行；不自行练习旋转跳跃。', 'https://english.shanghai.gov.cn/en-Fitness/20250126/ba13b07ade1941719a78b1a64130fc90.html', '上海市政府：世纪星冰场介绍'],
  ['shuoguo-fengxian', '奉贤', '槊果水上运动中心', '奉贤区海涵路6号', 'thrill', '预约一次水上基础体验', '先确认当前季节是否接待及教练资质，预约适合自己的皮划艇或桨板基础课，穿救生衣并遵守指定水域规则；不独自下水，停航或恶劣天气不参加。', 'https://sh.people.com.cn/n2/2023/0627/c350122-40472580.html', '乐游上海：奉贤水上运动介绍（人民网转载）'],
  ['dahua-night', '宝山', '大华夜巷', '宝山区大华路538号', 'night', '选一份没吃过的街区夜宵', '18点后前往正常营业的街区，先逛再选一份小食，在公共区域休息；只体验常设餐饮，不预设过去的主题市集仍在举办。', 'https://sww.sh.gov.cn/swdt/20250807/55c891486567464a91538412024b3fe8.html', '上海市商务委：宝山夜间消费场所指南'],
  ['zhihuiwan-night', '宝山', '智慧湾夜间商业区', '宝山区蕰川路6号', 'night', '在工业风园区吃一顿晚饭', '确认园区晚间开放区域，选一家当晚营业的餐饮店，饭后沿公共亮灯区域散步；不假设展馆、演出或水上项目夜间开放。', 'https://sww.sh.gov.cn/swdt/20250807/55c891486567464a91538412024b3fe8.html', '上海市商务委：宝山夜间消费场所指南'],
  ['meilan-night', '宝山', '美兰湖小镇夜间街区', '宝山区罗芬路555弄至989弄', 'night', '沿小镇街面安排一顿晚餐', '先查当晚营业餐厅，晚饭后在开放的亮灯街面短途游逛；湖边停留在护栏内，不预设音乐节或市集存在。', 'https://sww.sh.gov.cn/swdt/20250807/55c891486567464a91538412024b3fe8.html', '上海市商务委：宝山夜间消费场所指南'],
  ['yunjian-night', '松江', '云间粮仓夜间商业区', '松江区松汇东路327号', 'night', '在老粮仓建筑里换一种晚餐氛围', '先确认园区及餐饮晚间营业，挑一家营业店铺吃晚饭，观察老粮仓改造后的建筑；演出、展览和啤酒博物馆另查开放与票务。', 'https://english.shanghai.gov.cn/en-Nightlife/20231207/c30ed7bea35a4cbb94a867d29ef8ccb3.html', '上海市政府：云间粮仓夜生活介绍'],
  ['sijing-night', '松江', '泗泾夜市（三湘商业广场）', '松江区泗宝路18号三湘商业广场南侧', 'night', '在泗泾吃一份热乎的夜市小食', '先查夜市当晚营业及具体入口，正常营业时挑选一家摊位现做的小食，带走垃圾；不依赖节庆接驳车或限期演出。', 'https://www.meet-in-shanghai.net/tc/news/lantern-viewing-visiting-markets-playing-intangible-cultural-heritage-come-to-sijing-ancient-town-during-the-new-year-of-the-horse-507110/', '上海市文旅推广网：泗泾夜市介绍'],
  ['panlong-night', '青浦', '蟠龙天地夜间商业街区', '青浦区蟠鼎路123弄8号', 'night', '到水乡商业街吃一顿晚饭', '查好当晚营业餐厅，晚饭后沿开放公共街区短途游逛；不预设灯光秀、夜间游船或特定节庆活动开放。', 'https://www.shanghai.gov.cn/nw17239/20260625/2ba8e6f50fe148bbbddc03c061f68bc6.html', '上海市政府：青浦夜间商业目的地介绍'],
  ['powerlong-qingpu-night', '青浦', '青浦宝龙广场', '青浦区汇金路590号', 'night', '安排一场晚饭后的电影', '先查看影城当晚18点后的真实排片，确认有合适电影后购票，提前在营业餐饮区吃饭；没有合适场次不为了打卡购票。', 'https://www.shqp.gov.cn/shqp/qpzdjcbs/wwgwj/20230727/1127310.html', '上海青浦：夜间消费目的地介绍'],
  ['longfor-fengxian-night', '奉贤', '奉贤天街酒食肆', '奉贤区金海公路3800号奉贤天街', 'night', '晚饭去酒食肆找一家新店', '确认街区和餐饮店当晚营业，在常设餐饮区自选一家店吃晚饭；不依赖旧购物节活动，不强制饮酒，饮酒后不驾车。', 'https://www.sh-italent.cn/article/202306/202306090002.shtml', '上海国际人才网：奉贤夜间消费介绍'],
  ['mermaid-fengxian-night', '奉贤', '美人鱼休闲街', '奉贤区南桥镇南方国际广场美人鱼休闲街', 'night', '去南桥的休闲街找一顿夜宵', '出发前核对美人鱼休闲街入口及餐饮店营业情况，18点后在正常营业区域自选一顿夜宵；不把过去的亮灯季或快闪市集视为常设活动。', 'https://www.sh-italent.cn/article/202306/202306090002.shtml', '上海国际人才网：奉贤夜间消费介绍'],
  ['jinshanzui-night', '金山', '金山嘴渔村夜间餐饮街区', '金山区山阳镇沪杭公路6394号金山嘴渔村', 'night', '给周末留一顿渔村晚餐', '提前咨询渔村餐厅当晚营业和价格，预约一顿适合人数的晚餐；饭后只在亮灯公共街面活动，不预设烟花、市集或海边设施夜间开放。', 'https://touch.shio.gov.cn/jsp/whjljd_detail.jsp?id=201', '上海市政府新闻办：金山嘴渔村介绍'],
  ['fengjing-night', '金山', '枫泾古镇夜间餐饮街区', '金山区亭枫公路8588弄28号枫泾古镇', 'night', '在水乡老街吃晚饭', '先确认古镇公共街面当晚开放及餐厅营业，预约晚餐后走一小段亮灯老街；不进入关闭的收费景点，不承诺夜游船、灯光秀或演出。', 'https://www.shanghai.gov.cn/cmsres/42/423d90ae048c42fdaf0ecf1244283f23/096d445956f30d8831d555a545705741.pdf', '上海市政府：金山夜生活集聚区信息'],
  ['bayilu-night', '崇明', '八一路商业街', '崇明区城桥镇八一路新崇中路至新崇南路段', 'night', '去城桥镇找一家晚间小店', '先查询当晚营业餐饮，18点后在八一路公共商业街面吃晚饭、短途游逛；不预设国庆限定夜市或文艺演出仍在举办。', 'https://www.shcm.gov.cn/ztzl/009002/009002010/009002010004/20260114/2ece6719-46d1-4536-9f37-4a89a7cb0c7f.html', '上海崇明：夜间消费街区信息'],
  ['wanda-chongming-night', '崇明', '万达影城（崇明万达店）', '崇明区崇明大道8388号3楼', 'night', '在岛上看一场晚场电影', '从影院官方渠道核对门店和当晚18点后的实际排片，选好场次再购票，提前安排返程；没有合适场次时不前往等待。', 'https://sww.sh.gov.cn/cmsres/ae/ae6658e3f1e646d5b6b5ac8c248309cc/6c5492862a5bd2d562a54410489fd0f2.pdf', '上海市商务委：影院门店地址名录'],
  ['thousandtrees-night', '普陀', '天安千树', '普陀区莫干山路600号', 'night', '在苏州河边找一顿新晚餐', '核对商场当晚营业，选一家餐饮店吃饭，再到公众开放的滨河区域看建筑夜景；不擅入关闭露台，不预设展览开放。', 'https://www.meet-in-shanghai.net/cn/shopping/cheonan-thousand-trees-010053/', '上海市文旅推广网：天安千树介绍'],
  ['laowaijie-night', '闵行', '老外街', '闵行区虹梅路3338弄', 'night', '用一顿异国料理换个周末口味', '先查街区餐厅当晚营业和菜单，选一种没有尝试过的料理吃晚饭，餐后沿公共街面游逛；不强制饮酒，饮酒后不驾车。', 'https://www.shanghai.gov.cn/nw31406/20250703/293f0cab8d3b4f0393d5b8d976ad5748.html', '上海市政府：老外街餐饮街区介绍']
]
function buildCuratedPlays() {
  return [...venues, ...additions].map(([id, district, location, address, mood, action, mission, sourceUrl, sourceTitle]) => ({
    id: `cur-${id}-v2-${mood}`, placeId: `cur-${id}`, catalogVersion: 2,
    emoji: mood === 'thrill' ? '🧗' : '🌙', stamp: mood === 'thrill' ? '新体验玩家' : '城市夜游者',
    title: `${location}：${action}`, kicker: mood === 'thrill' ? '第一次尝试，让这个周末不一样。' : '晚饭以后，还有一段城市时间。',
    district, districts: [district], location, address, duration: '1～3小时', budget: '以场馆或店铺当前报价为准',
    bestTime: mood === 'night' ? '18点后，以当天开放为准' : '提前核对开放并预约', moods: [mood],
    traits: mood === 'thrill' ? ['curious', 'active'] : ['night', 'social', 'food'], mission,
    steps: ['出发前用官方渠道核对营业、收费及预约要求', `按官方地址前往${location}，先了解现场规则`, mission],
    tip: '官方介绍用于核对地点及项目类型，不代表实时营业；付费体验、教练和装备须提前确认。',
    sourceTitle: sourceTitle || '上海市政府：场馆或夜游目的地介绍', sourceUrl, verifiedAt: sourceTitle ? '2026-10-23' : '2026-10-19',
    verificationScope: '官方地点和项目介绍；玩法为自助任务', status: 'published', recommendable: true
  }))
}
module.exports = { buildCuratedPlays }
