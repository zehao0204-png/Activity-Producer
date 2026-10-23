// Import only normal coordinate-picker UI results with matching venue names and street addresses.
const fs = require('fs')
const path = require('path')
const { canonical } = require('./collect-coordinate-candidates')
const root = path.resolve(__dirname, '..')
// Reviewed shorter names at the same documented street address; never accept arbitrary fuzzy names.
const reviewedAliases = {
  'dir-6867806108da1edb': ['上海（中医药大学）中医药博物馆', '上海中医药博物馆'],
  'dir-719a48e3894d356d': ['上海市历史博物馆（上海革命历史博物馆）', '上海市历史博物馆'],
  'dir-d07db619eb4891f0': ['上海豫园管理处', '上海豫园'],
  'dir-742f0865d0627eda': ['上海三山会馆管理处', '上海三山会馆'],
  'dir-c99d6ea4babc160a': ['国际乒联博物馆（中国乒乓球博物馆）', '国际乒联博物馆'],
  'dir-8881edea9005b773': ['上海周虎臣曹素功笔墨博物馆', '上海笔墨博物馆'],
  'dir-189ebe52be9b34f0': ['上海市外滩历史纪念馆', '黄浦公园-外滩历史纪念馆'],
  'dir-120414586213d99d': ['中共上海地下组织斗争史陈列馆暨刘长胜故居', '中共上海地下组织斗争史陈列馆'],
  'dir-7d8b84e561b2525a': ['上海自然博物馆（上海科技馆分馆）', '上海自然博物馆'],
  'dir-404ad3189921bcc9': ['中央特科机关旧址纪念馆', '中共中央特科机关旧址'],
  'dir-472570e0da365e79': ['《义勇军进行曲》灌制地纪念馆 （百代小楼）', '义勇军进行曲灌制地纪念馆'],
  'dir-321aea7e1da778db': ['上海（东华大学）纺织服饰博物馆', '上海纺织服饰博物馆'],
  'dir-7ed1925a39637bf5': ['上海陈化成纪念馆', '上海淞沪抗战纪念公园-陈化成纪念馆'],
  'dir-e7224d1a7debffc2': ['上海尊木汇木文化博物馆', '上海木文化博物馆'],
  'dir-5366b13ac62e4afb': ['闵行区博物馆', '闵行博物馆'],
  'dir-ab7bf87febee6d28': ['上海虹桥当代美术馆', '上海虹桥当代艺术馆'],
  'dir-2587495b6727bce2': ['上海虹口青藤美术馆', '青藤美术馆'],
  'dir-a52f1c7e21872e80': ['蔡兵美术馆', '上海市闵行区蔡兵美术馆'],
  'dir-d1b4094b8894a467': ['云间会堂美术馆', '云间会堂文化艺术中心'],
  'dir-33378a5864813046': ['上海松江清控人居美术馆', '清控人居美术馆'],
  'dir-5945d625b4807a13': ['上海松江区新桥美术馆', '新桥美术馆'],
  'dir-b31539e6a386843e': ['上海松江区贤禾美术馆', '上海贤禾美术馆'],
  'dir-b5dc79ee6bc1226e': ['山龙绿地', '山龙绿地广场'],
  'dir-ca9bc1b9a3806099': ['南门广场绿地', '南门广场'],
  'dir-c9e3bce3517d6fe0': ['生态走廊（二期）', '新江湾城生态走廊二期绿地'],
  'dir-775aa1eec9769be9': ['金汇达令港公园', '达令港公园'],
  'dir-a1e0ed3362759778': ['湖心岛公园', '上海之鱼湖心岛公园'],
  'dir-3a0f32be1c41cb2c': ['银翔湖公园', '南翔镇银翔湖公园'],
  'dir-4d8c5a8098074042': ['四季生态园', '奉浦四季生态园'],
  'dir-1439e321db780b4d': ['孝亲公园', '高东镇孝亲敬老主题公园'],
  'dir-200ee9b1466af64c': ['莫比乌斯环公园', '莫比乌斯公园'],
  'dir-867da3648919fd86': ['滴水湖樱花岛公园（临港新片区）', '滴水湖樱花岛']
}
function normalizeAddress(value) {
  return String(value).replace(/[（(][^）)]*[）)]/g, '').replace(/[\s，,、·]/g, '')
}
function sameAddress(expected, actual) {
  const left = normalizeAddress(expected), right = normalizeAddress(actual)
  if (!left || !right || right.length < 5) return false
  if (left.includes(right) || right.includes(left)) return true
  // Park directories describe boundaries rather than house numbers. A same-name park may
  // use an entrance on one of those roads; never apply this rule to a precise numbered address.
  if (!/\d+(?:号|弄)/.test(left)) {
    const streets = String(expected).replace(/\s/g, '').split(/[、，,（）()—\-]/).flatMap(part => {
      const cleaned = part.replace(/^.*?[区县]/, '').replace(/^.*?[镇乡]/, '').replace(/^.*(?:东至|西至|南至|北至|东临|西临|南临|北临)/, '')
      return cleaned.match(/[\u4e00-\u9fffA-Za-z0-9]+?(?:大道|公路|路|街)/g) || []
    })
    if (streets.some(street => street.length >= 3 && right.includes(street))) return true
  }
  // Require the same street AND house number; district names or nearby landmarks alone are insufficient.
  const street = right.match(/([\u4e00-\u9fffA-Za-z]+(?:路|街|大道|公路|弄))(\d+)(?:-\d+)?(号|弄)/)
  if (!street) return false
  const road = street[1].replace(/^.*(?:区|县|镇|乡|街道)/, '')
  return road.length >= 2 && left.includes(road + street[2] + street[3])
}
function parseCandidate(row) {
  if (row.error || !row.selectedText || !row.resultHtml) return null
  if (new URL(row.sourceUrl).hostname !== 'ditu.amap.com') return null
  const title = row.match?.title || /title="([^"]+)"/.exec(row.resultHtml)?.[1]
  const match = title && /^(.*?)（(.*)）$/.exec(title)
  if (!match || !sameAddress(row.address, match[2])) return null
  if (/暂停开放|装修中|建设中|施工中|暂停营业|已关闭|已歇业/.test(match[1])) return null
  const alias = reviewedAliases[row.placeId]
  if (canonical(match[1]) !== canonical(row.name) && !(alias && alias[0] === row.name && alias[1] === match[1])) return null
  const coordinates = /\n坐标\n(\d+\.\d{6}),\s*(\d+\.\d{6})\n/.exec(row.selectedText)
  if (!coordinates) return null
  const selectedName = row.selectedText.slice(0, coordinates.index).split('\n').pop()
  if (canonical(selectedName) !== canonical(match[1])) return null
  const longitude = Number(coordinates[1]), latitude = Number(coordinates[2])
  if (longitude < 120.8 || longitude > 122.2 || latitude < 30.6 || latitude > 31.9) return null
  return {
    name: row.name, address: row.address, latitude, longitude, coordinateSystem: 'gcj02',
    coordinateSourceUrl: 'https://ditu.amap.com/ssr/coordinate-picker',
    coordinateCheckedAt: row.checkedAt.slice(0, 10), coordinateRevision: Number(row.checkedAt.slice(0, 10).replace(/-/g, '')),
    coordinateNote: `高德坐标拾取；匹配地点：${match[1]}；匹配地址：${match[2]}；实际入口以现场指引为准`
  }
}
function main() {
  if (!process.argv[2]) throw new Error('Pass the coordinate-picker NDJSON report path')
  const rows = fs.readFileSync(process.argv[2], 'utf8').trim().split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line))
  const registry = { ...require('../data/coordinates') }
  const accepted = new Map()
  for (const row of rows) {
    const coordinate = parseCandidate(row)
    if (coordinate) accepted.set(row.placeId, coordinate)
  }
  // Duplicate points across different venue identities require manual review, not automatic reuse.
  const counts = new Map()
  for (const coordinate of accepted.values()) {
    const key = `${coordinate.longitude},${coordinate.latitude}`
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  let added = 0
  for (const [id, coordinate] of accepted) {
    if (counts.get(`${coordinate.longitude},${coordinate.latitude}`) !== 1 || registry[id]) continue
    registry[id] = coordinate
    added++
  }
  const target = path.join(root, 'data/coordinates.js')
  fs.writeFileSync(target, '// Reviewed venue coordinates with per-point source, address and coordinate system.\nmodule.exports = ' + JSON.stringify(registry, null, 2) + '\n')
  delete require.cache[require.resolve('../data/coordinates')]
  const plays = require('../data/plays').filter(play => play.recommendable !== false)
  const venues = [...new Map(plays.filter(play => !Number.isFinite(play.latitude)).map(play => [play.placeId, play])).values()]
  const attempted = new Set(rows.map(row => row.placeId))
  const latest = new Map(rows.map(row => [row.placeId, row]))
  const pending = venues.map(play => {
    const row = latest.get(play.placeId)
    const history = rows.filter(record => record.placeId === play.placeId)
    const results = history.flatMap(record => {
      const items = (record.queries || []).flatMap(query => query.results)
      const value = /title="([^"]+)"/.exec(record.resultHtml || '')?.[1]
      const title = value && /^(.*?)（(.*)）$/.exec(value)
      if (title) items.push({name:title[1],address:title[2]})
      return items
    })
    const candidates = [...new Map(results.map(result => [`${result.name}|${result.address}`, {name:result.name,address:result.address}])).values()]
    const unavailable = candidates.some(result => /暂停开放|装修中|建设中|施工中|暂停营业|已关闭|已歇业/.test(result.name))
    const reason = unavailable ? '高德候选标注暂停开放、施工或停业，需核实开放状态' : !attempted.has(play.placeId) ? '尚未查询' : row?.error ? `已查高德，待复核：${row.error.split('\n')[0]}` : '已查高德，但名称、地址或点位仍需复核'
    return {placeId:play.placeId,name:play.location,address:play.address,district:play.district,reason,candidates}
  })
  fs.writeFileSync(path.join(root, 'scripts/coordinate-review-pending.json'), JSON.stringify(pending, null, 2) + '\n')
  console.log(JSON.stringify({queried:attempted.size,added,registry:Object.keys(registry).length,pending:pending.length}))
}
if (require.main === module) main()
module.exports = { sameAddress, parseCandidate }
