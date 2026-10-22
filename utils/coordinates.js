const coordinates = require('../data/coordinates')

function withCoordinates(play) {
  if (Number.isFinite(play.latitude) && Number.isFinite(play.longitude)) return play
  const location = coordinates[play.placeId]
  // A place moving to another address must be reviewed rather than reusing its old point.
  if (!location || location.address !== play.address) return play
  const { name, address, ...navigation } = location
  return { ...play, ...navigation }
}

module.exports = { withCoordinates }
