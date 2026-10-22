// Offline research only. Generates candidates for review, never invents coordinates.
const fs = require('fs')
const path = require('path')
const os = require('os')
const traditional = '館園華國際紀舊學術歷織郵電氣車鐵龍長寧楊寶閔嘉閘灣滬東復興廣場創業會萬體樂畫雲劉顧陸張吳黃陳湯鳥綠濱紀憶樓區觀後號銀'
const simplified = '馆园华国际纪旧学术历织邮电气车铁龙长宁杨宝闵嘉闸湾沪东复兴广场创业会万体乐画云刘顾陆张吴黄陈汤鸟绿滨纪忆楼区观后号银'
function canonical(value) {
  return String(value).replace(/[\s（）()·・—-]/g, '').split('').map(char => {
    const index = traditional.indexOf(char)
    return index < 0 ? char : simplified[index]
  }).join('').replace(/上海市|上海/g, '').toLowerCase()
}
function point(value) {
  const match = /^Point\((-?[\d.]+) (-?[\d.]+)\)$/.exec(value || '')
  if (!match) return null
  const [, lng, lat] = match
  if ((lng.split('.')[1] || '').length < 4 || (lat.split('.')[1] || '').length < 4) return null
  const longitude = Number(lng), latitude = Number(lat)
  if (longitude < 120.8 || longitude > 122.2 || latitude < 30.6 || latitude > 31.9) return null
  return { longitude, latitude }
}
async function main() {
  if (traditional.length !== simplified.length) throw new Error('Invalid name-normalization table')
  const query = `SELECT ?item ?itemLabel ?coord ?alias ?address WHERE {
    SERVICE wikibase:box { ?item wdt:P625 ?coord .
      bd:serviceParam wikibase:cornerWest "Point(120.8 30.6)"^^geo:wktLiteral ;
        wikibase:cornerEast "Point(122.2 31.9)"^^geo:wktLiteral . }
    OPTIONAL { ?item skos:altLabel ?alias . FILTER(LANG(?alias) IN ("zh", "zh-hans", "zh-cn", "en")) }
    OPTIONAL { ?item wdt:P969 ?address }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "zh-hans,zh,en" . }
  }`
  const response = await fetch('https://query.wikidata.org/sparql?' + new URLSearchParams({ query, format: 'json' }), {
    headers: { Accept: 'application/sparql-results+json', 'User-Agent': 'ActivityProducer/1.0 venue-coordinate-research' },
    signal: AbortSignal.timeout(55000)
  })
  if (!response.ok) throw new Error(`Wikidata HTTP ${response.status}: ${(await response.text()).slice(0, 100)}`)
  const data = await response.json()
  const index = new Map()
  for (const row of data.results.bindings) {
    const coordinates = point(row.coord.value)
    if (!coordinates) continue
    const candidate = { name: row.itemLabel.value, ...coordinates, sourceUrl: row.item.value.replace('http:', 'https:'), sourceAddress: row.address?.value || '' }
    for (const value of [row.itemLabel.value, row.alias?.value].filter(Boolean)) {
      const key = canonical(value)
      if (!index.has(key)) index.set(key, new Map())
      index.get(key).set(`${candidate.sourceUrl}|${candidate.latitude}|${candidate.longitude}`, candidate)
    }
  }
  const plays = require('../data/plays').filter(play => play.recommendable !== false)
  const venues = [...new Map(plays.filter(play => !Number.isFinite(play.latitude)).map(play => [play.placeId, play])).values()]
  const report = venues.map(play => ({ placeId: play.placeId, name: play.location, address: play.address, district: play.district,
    candidates: [...(index.get(canonical(play.location))?.values() || [])] }))
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'activity-coordinate-research-'))
  fs.writeFileSync(path.join(directory, 'wikidata.json'), JSON.stringify(data))
  fs.writeFileSync(path.join(directory, 'review.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify({ directory, total: report.length, uniqueMatches: report.filter(row => row.candidates.length === 1).length,
    ambiguous: report.filter(row => row.candidates.length > 1).length }))
}
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1 })
module.exports = { canonical, point }
