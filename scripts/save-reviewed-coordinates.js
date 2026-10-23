const fs = require('fs')
const path = require('path')
const { canonical, point } = require('./collect-coordinate-candidates')
const reportPath = process.argv[2]
if (!reportPath) throw new Error('Pass the path to a reviewed coordinate research report')
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
// Historical aliases do not prove a present-day museum entrance.
const excluded = new Set(['dir-d3ccae63bdb6f49b', 'dir-139da929ebea6767'])
const acceptedAliases = new Set(['dir-7aec814111d809d2', 'dir-5a0ad662402f655a', 'dir-fa5dab7706181a42'])
const coordinates = { ...require('../data/coordinates') }
for (const row of report) {
  if (coordinates[row.placeId]) continue
  if (excluded.has(row.placeId) || row.candidates.length !== 1) continue
  const candidate = row.candidates[0]
  if (canonical(row.name) !== canonical(candidate.name) && !acceptedAliases.has(row.placeId)) continue
  if (!point(`Point(${candidate.longitude} ${candidate.latitude})`)) continue
  coordinates[row.placeId] = {
    name: row.name, address: row.address, latitude: candidate.latitude, longitude: candidate.longitude,
    coordinateSystem: 'wgs84', coordinateSourceUrl: candidate.sourceUrl,
    coordinateCheckedAt: '2026-10-22', coordinateRevision: 20261022,
    coordinateNote: '公开地图中的场馆或景点点位；实际入口以现场指引为准'
  }
}
if (!Object.keys(coordinates).length) throw new Error('No reviewed coordinates to save')
const root = path.resolve(__dirname, '..')
fs.writeFileSync(path.join(root, 'data/coordinates.js'), '// Reviewed venue coordinates with per-point source, address and coordinate system.\nmodule.exports = ' + JSON.stringify(coordinates, null, 2) + '\n')
const pending = report.filter(row => !coordinates[row.placeId]).map(({ placeId, name, address, district, candidates }) => ({ placeId, name, address, district, reason: excluded.has(placeId) ? '历史别名或入口需人工复核' : candidates.length ? '坐标身份需人工复核' : '暂未找到可确认的公开坐标' }))
fs.writeFileSync(path.join(root, 'scripts/coordinate-review-pending.json'), JSON.stringify(pending, null, 2) + '\n')
console.log(JSON.stringify({ reviewed: Object.keys(coordinates).length, pending: pending.length }))
