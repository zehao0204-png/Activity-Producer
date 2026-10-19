const PI = Math.PI
const A = 6378245
const EE = 0.006693421622965943

function outsideChina(latitude, longitude) {
  return longitude < 72.004 || longitude > 137.8347 || latitude < 0.8293 || latitude > 55.8271
}

function transformLatitude(x, y) {
  return -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x))
    + (20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) * 2 / 3
    + (20 * Math.sin(y * PI) + 40 * Math.sin(y / 3 * PI)) * 2 / 3
    + (160 * Math.sin(y / 12 * PI) + 320 * Math.sin(y * PI / 30)) * 2 / 3
}

function transformLongitude(x, y) {
  return 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))
    + (20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) * 2 / 3
    + (20 * Math.sin(x * PI) + 40 * Math.sin(x / 3 * PI)) * 2 / 3
    + (150 * Math.sin(x / 12 * PI) + 300 * Math.sin(x / 30 * PI)) * 2 / 3
}

function wgs84ToGcj02(latitude, longitude) {
  if (outsideChina(latitude, longitude)) return { latitude, longitude }
  let deltaLatitude = transformLatitude(longitude - 105, latitude - 35)
  let deltaLongitude = transformLongitude(longitude - 105, latitude - 35)
  const radLatitude = latitude / 180 * PI
  let magic = Math.sin(radLatitude)
  magic = 1 - EE * magic * magic
  const sqrtMagic = Math.sqrt(magic)
  deltaLatitude = deltaLatitude * 180 / ((A * (1 - EE)) / (magic * sqrtMagic) * PI)
  deltaLongitude = deltaLongitude * 180 / (A / sqrtMagic * Math.cos(radLatitude) * PI)
  return { latitude: latitude + deltaLatitude, longitude: longitude + deltaLongitude }
}

function getMapLocation(play) {
  if (!Number.isFinite(play.latitude) || !Number.isFinite(play.longitude)) return null
  if (play.coordinateSystem === 'wgs84') return wgs84ToGcj02(play.latitude, play.longitude)
  return { latitude: play.latitude, longitude: play.longitude }
}

function openPlayLocation(play) {
  const location = getMapLocation(play)
  if (location) {
    wx.openLocation({ ...location, name: play.location, address: play.address, scale: 16 })
    return
  }
  wx.showModal({
    title: play.location,
    content: `${play.address}\n复制后可到微信地图或常用地图搜索。`,
    confirmText: '复制地址',
    success: result => {
      if (result.confirm) wx.setClipboardData({ data: `${play.location} ${play.address}` })
    }
  })
}
module.exports = { getMapLocation, openPlayLocation, wgs84ToGcj02 }
