const DISTRICTS = ['杨浦', '长宁', '黄浦', '普陀', '徐汇', '闵行', '嘉定', '虹口', '浦东', '宝山', '静安', '松江', '青浦', '奉贤', '金山', '崇明']
const MOOD_LABELS = { random: '随机盲盒', healing: '放空治愈', thrill: '新鲜刺激', arts: '文艺漫游', outdoors: '户外出汗', night: '夜间出逃' }
function normalizeDistrict(value) {
  return String(value || '').trim().replace(/浦东新区/g, '浦东').replace(/区$/g, '')
}
function filterPlays(plays, options = {}) {
  const district = normalizeDistrict(options.district)
  return plays.filter(play => play.recommendable !== false && play.status !== 'legacy'
    && (!options.mood || options.mood === 'random' || play.moods.includes(options.mood))
    && (!district || district === 'all' || (play.districts || (play.district || '').split(/\s*→\s*/)).map(normalizeDistrict).includes(district)))
}
module.exports = { DISTRICTS, MOOD_LABELS, normalizeDistrict, filterPlays }
