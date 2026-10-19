// Import factual names/addresses from public Shanghai government directories.
// No geocoding guesses: records without official coordinates use address search.
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const sources = [
  ['museum', '上海市文旅局：上海市博物馆名单（2025年度）', 'https://whlyj.sh.gov.cn/bwg/20260106/265b828de4394054bdc2e61e1599ed4c.html'],
  ['art', '上海市文旅局：2025年上海市美术馆名录', 'https://whlyj.sh.gov.cn/msg/20250928/db0cbc0a1edf478f99c4900522a56e3b.html'],
  ['park', '上海市政府：2019年新入册公园名录', 'https://www.shanghai.gov.cn/nw12344/20200813/0001-12344_63177.html'],
  ['park', '上海市政府：2021年新纳入城市公园名录', 'https://www.shanghai.gov.cn/gwk/search/content/aa86b2f7-e0a5-4aee-93e1-aeef8f620600'],
  ['park', '上海市政府：2022年城市公园名录调整', 'https://www.shanghai.gov.cn/gwk/search/content/ef9bf708-749a-4be1-8772-425214f62510'],
  ['park', '上海市绿化市容局：2024年新入册城市公园名录', 'https://www.shanghai.gov.cn/gwk/search/content/a4a0d54e-6a40-4359-abfb-365481f202a3']
]
const districts = ['黄浦', '徐汇', '长宁', '静安', '普陀', '虹口', '杨浦', '闵行', '宝山', '嘉定', '浦东', '金山', '松江', '青浦', '奉贤', '崇明']
function clean(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&nbsp;|&#xA0;/gi, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
}
function parseDirectory(html, source, checkedAt) {
  const [type, sourceTitle, sourceUrl] = source
  const places = []
  let district = ''
  for (const table of html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)) {
    // Expand rowspans explicitly; never carry a district across unrelated tables.
    const spans = []
    for (const row of table[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
      const cells = []
      let column = 0
      const fillSpans = () => {
        while (spans[column]?.left > 0) {
          cells[column] = spans[column].value
          spans[column].left -= 1
          column += 1
        }
      }
      for (const cell of row[1].matchAll(/<t[dh]\b([^>]*)>([\s\S]*?)<\/t[dh]>/gi)) {
        fillSpans()
        const value = clean(cell[2])
        const rowspan = Number(cell[1].match(/rowspan=["']?(\d+)/i)?.[1] || 1)
        cells[column] = value
        if (rowspan > 1) spans[column] = { value, left: rowspan - 1 }
        column += 1
      }
      fillSpans()
      if (!/^\d+$/.test(cells[0] || '')) { district = ''; continue }
      const districtText = (cells[1] || '').replace(/\s/g, '')
      const found = districts.find(item => districtText === item || districtText === `${item}区` || (item === '浦东' && districtText === '浦东新区'))
      // Some source tables omit the merged district cell without an HTML rowspan.
      const offset = found ? 0 : -1
      if (found) district = found
      if (!district) throw new Error(`Missing district: ${cells.join('|')}`)
      const name = (cells[2 + offset] || '').replace(/^[*＊]+/, '').trim()
      let address = cells[(type === 'park' ? 4 : 3) + offset] || ''
      if (!name || !address || /暂停开放|暂未开放|长期闭馆|停业|筹建/.test(cells.join(' '))) continue
      if (!/区|县/.test(address.slice(0, 8))) address = `${district === '浦东' ? '浦东新区' : `${district}区`}${address}`
      places.push({
        id: `dir-${crypto.createHash('sha256').update(`${name}|${address}`).digest('hex').slice(0, 16)}`,
        type, name, district, address,
        openHours: type === 'art' ? cells[4 + offset] : '出发前向场馆或公园确认当天开放及预约安排',
        fee: type === 'art' ? cells[5 + offset] : '门票、预约要求以官方最新公告为准',
        sourceTitle, sourceUrl, verifiedAt: checkedAt,
        verificationScope: '官方名录名称和地址；非当日营业承诺'
      })
    }
  }
  return places
}
async function main() {
  const checkedAt = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' })
  const imported = []
  for (const source of sources) {
    const response = await fetch(source[2], { signal: AbortSignal.timeout(30000) })
    if (!response.ok) throw new Error(`${response.status}: ${source[2]}`)
    const records = parseDirectory(await response.text(), source, checkedAt)
    if (records.length < 15) throw new Error(`Unexpected directory size: ${source[1]}`)
    console.log(`${source[1]}: ${records.length}`)
    imported.push(...records)
  }
  const unique = [...new Map(imported.map(place => [`${place.name.replace(/\s/g, '')}|${place.district}`, place])).values()]
  if (unique.length < 300) throw new Error('Official directory import is incomplete')
  fs.writeFileSync(path.join(__dirname, '../data/official-places.json'), JSON.stringify(unique, null, 2) + '\n')
  console.log(`Imported ${unique.length} distinct venues`)
}
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1 })
module.exports = { parseDirectory }
