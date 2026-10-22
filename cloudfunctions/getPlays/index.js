const cloud = require('wx-server-sdk')
const seed = require('./seed.json')
const retired = require('./retired.json')
const legacySeed = require('./legacy-seed.json')
const { sanitizePlay } = require('./catalog')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const plays = db.collection('plays')

async function ensureCollection() {
  try {
    await plays.limit(1).get()
  } catch (error) {
    const missing = error.errCode === -502005 || /collection.*(not exist|不存在)/i.test(error.message || '')
    if (!missing) throw error
    try {
      await db.createCollection('plays')
    } catch (createError) {
      if (!/(exist|已存在)/i.test(createError.message || '')) throw createError
    }
  }
}

async function readPublished() {
  const result = []
  const pageSize = 100
  for (let offset = 0; ; offset += pageSize) {
    const page = await plays.where({ status: 'published' }).skip(offset).limit(pageSize).get()
    result.push(...page.data)
    if (page.data.length < pageSize) return result
  }
}

async function seedMissing() {
  const current = await readPublished()
  const currentById = new Map(current.map(play => [play.id, play]))
  const missing = seed.filter(play => !currentById.has(play.id)
    || (currentById.get(play.id).catalogVersion || 0) < play.catalogVersion
    || ((play.coordinateRevision || 0) > (currentById.get(play.id).coordinateRevision || 0)
      && (!Number.isFinite(currentById.get(play.id).latitude) || !Number.isFinite(currentById.get(play.id).longitude))))
  for (let index = 0; index < missing.length; index += 20) {
    const batch = missing.slice(index, index + 20)
    await Promise.all(batch.map(play => plays.doc(play.id).set({ data: play })))
  }
  const retiredIds = new Set(retired)
  const obsolete = current.filter(play => retiredIds.has(play.id))
  for (let index = 0; index < obsolete.length; index += 20) {
    await Promise.all(obsolete.slice(index, index + 20).map(play => plays.doc(play._id || play.id)
      .update({ data: { status: 'legacy', recommendable: false } })))
  }
  return missing.length || obsolete.length ? readPublished() : current
}

exports.main = async (event = {}) => {
  if (event.catalogVersion !== 2) {
    const legacy = legacySeed.map(sanitizePlay).filter(Boolean)
    return { ok: true, catalogVersion: 1, count: legacy.length, plays: legacy }
  }
  await ensureCollection()
  const documents = await seedMissing()
  const published = documents.filter(play => play.recommendable !== false).map(sanitizePlay).filter(Boolean)
  return { ok: true, catalogVersion: 2, count: published.length, plays: published }
}
