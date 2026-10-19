const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const plays = require(path.join(root, 'data', 'plays'))
  .filter(play => play.recommendable !== false && play.status === 'published')
  .sort((left, right) => left.id.localeCompare(right.id))
const output = `${JSON.stringify(plays, null, 2)}\n`
const target = path.join(root, 'cloudfunctions', 'getPlays', 'seed.json')

if (process.argv.includes('--check')) {
  if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== output) {
    console.error('Cloud catalog seed is out of date')
    process.exitCode = 1
  }
} else {
  fs.writeFileSync(target, output)
  console.log(`Wrote ${plays.length} verified plays`)
}

const retired = require(path.join(root, 'data', 'plays')).filter(play => play.status === 'legacy').map(play => play.id).sort()
const retiredTarget = path.join(root, 'cloudfunctions', 'getPlays', 'retired.json')
const retiredOutput = `${JSON.stringify(retired, null, 2)}\n`
if (process.argv.includes('--check')) {
  if (!fs.existsSync(retiredTarget) || fs.readFileSync(retiredTarget, 'utf8') !== retiredOutput) {
    console.error('Retired catalog manifest is out of date')
    process.exitCode = 1
  }
} else fs.writeFileSync(retiredTarget, retiredOutput)

// Keep the already released client working while the new frontend awaits review.
const legacy = require(path.join(root, 'data', 'plays'))
  .filter(play => play.status === 'legacy' && play.sourceUrl)
  .map(play => ({ ...play, status: 'published', recommendable: true, catalogVersion: 1 }))
  .sort((left, right) => left.id.localeCompare(right.id))
const legacyTarget = path.join(root, 'cloudfunctions', 'getPlays', 'legacy-seed.json')
const legacyOutput = `${JSON.stringify(legacy, null, 2)}\n`
if (process.argv.includes('--check')) {
  if (!fs.existsSync(legacyTarget) || fs.readFileSync(legacyTarget, 'utf8') !== legacyOutput) {
    console.error('Legacy client catalog is out of date')
    process.exitCode = 1
  }
} else fs.writeFileSync(legacyTarget, legacyOutput)
