const PUBLIC_FIELDS = [
  'id', 'placeId', 'emoji', 'stamp', 'title', 'kicker', 'district', 'location', 'address',
  'latitude', 'longitude', 'coordinateSystem', 'duration', 'budget', 'bestTime', 'moods',
  'traits', 'mission', 'steps', 'tip', 'sourceTitle', 'sourceUrl', 'verifiedAt', 'status', 'recommendable',
  'districts', 'catalogVersion', 'verificationScope', 'openingHours'
]

function isValidPlay(play) {
  return play
    && typeof play.id === 'string'
    && typeof play.title === 'string'
    && typeof play.location === 'string'
    && typeof play.address === 'string'
    && typeof play.sourceUrl === 'string'
    && play.sourceUrl.startsWith('https://')
    && /^\d{4}-\d{2}-\d{2}$/.test(play.verifiedAt)
    && typeof play.district === 'string' && play.district.length > 0
    && ((play.latitude === undefined && play.longitude === undefined && play.address.trim().length >= 5)
      || (Number.isFinite(play.latitude) && Number.isFinite(play.longitude)
        && play.latitude >= 30.6 && play.latitude <= 31.9
        && play.longitude >= 120.8 && play.longitude <= 122.2))
    && Array.isArray(play.moods) && play.moods.length > 0
    && Array.isArray(play.traits) && play.traits.length > 0
    && Array.isArray(play.steps) && play.steps.length === 3
}

function sanitizePlay(play) {
  if (!isValidPlay(play)) return null
  return Object.fromEntries(PUBLIC_FIELDS.filter(field => play[field] !== undefined).map(field => [field, play[field]]))
}

module.exports = { isValidPlay, sanitizePlay }
