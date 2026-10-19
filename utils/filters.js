const DISTRICTS = ['杨浦', '长宁', '黄浦', '普陀', '徐汇', '闵行', '嘉定', '虹口', '浦东', '宝山', '静安', '松江', '青浦', '奉贤', '金山', '崇明']
const MOOD_LABELS = { random: '随机盲盒', healing: '放空治愈', thrill: '新鲜刺激', arts: '文艺漫游', outdoors: '户外出汗', night: '夜间出逃' }
function normalizeDistrict(value) {
  return String(value || '').trim().replace(/浦东新区/g, '浦东').replace(/区$/g, '')
}
function normalizeFilters(options = {}) {
  const districtValues = Array.isArray(options.districts) ? options.districts : options.district ? [options.district] : []
  const moodValues = Array.isArray(options.moods) ? options.moods : options.mood ? [options.mood] : []
  return {
    districts: districtValues.includes('all') ? [] : [...new Set(districtValues.map(normalizeDistrict).filter(Boolean))],
    moods: moodValues.includes('random') ? [] : [...new Set(moodValues.filter(Boolean))]
  }
}
function filterPlays(plays, options = {}) {
  const { districts, moods } = normalizeFilters(options)
  return plays.filter(play => play.recommendable !== false && play.status !== 'legacy'
    && (!moods.length || play.moods.some(mood => moods.includes(mood)))
    && (!districts.length || (play.districts || (play.district || '').split(/\s*→\s*/)).map(normalizeDistrict).some(district => districts.includes(district))))
}
module.exports = { DISTRICTS, MOOD_LABELS, normalizeDistrict, normalizeFilters, filterPlays }
