const { buildProfile } = require('../../utils/recommend')
const { getLevel } = require('../../utils/progress')
const { buildBadges } = require('../../utils/badges')

const faces = ['', '😕', '😐', '🙂', '🤩']

function formatDate(timestamp) {
  const date = new Date(timestamp)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

Page({
  data: {
    completedCount: 0,
    districtCount: 0,
    averageRating: '—',
    levelNumber: 1,
    levelName: '上海城市玩家',
    nextLevelText: '再完成 4 次升级到 LV.2',
    levelProgress: 0,
    profile: { title: '', description: '', topTags: [] },
    badges: [],
    timeline: [],
    hasRecords: false
  },

  onShow() {
    wx.showShareMenu({
      menus: ['shareAppMessage', 'shareTimeline']
    })
    this.refresh()
  },

  onCloudStateReady() {
    this.refresh()
  },

  onCatalogReady() {
    this.refresh()
  },

  onPullDownRefresh() {
    this.refresh()
    wx.stopPullDownRefresh()
  },

  refresh() {
    const app = getApp()
    const state = app.getState()
    const plays = app.getPlays()
    const playMap = Object.fromEntries(plays.map(play => [play.id, play]))
    const records = state.records
    const completed = records.filter(record => record.status === 'completed')
    const completedCount = state.stats.completedCount
    const districts = new Set(completed.map(record => playMap[record.playId]?.district).filter(Boolean))
    const ratingTotal = completed.reduce((sum, record) => sum + record.rating, 0)
    const level = getLevel(completedCount)
    const badges = buildBadges(completed, plays)
    const timeline = records.slice(0, 20).map(record => {
      const play = playMap[record.playId]
      return {
        ...record,
        play,
        dateText: formatDate(record.finishedAt || record.acceptedAt),
        statusText: record.status === 'completed' ? '挑战完成' : '放回盲盒',
        face: record.status === 'completed' ? faces[record.rating] : '↩',
        tagsText: (record.feedbackTags || []).join(' · ')
      }
    }).filter(record => record.play)

    this.setData({
      completedCount,
      districtCount: districts.size,
      averageRating: completed.length ? (ratingTotal / completed.length).toFixed(1) : '—',
      levelNumber: level.level,
      levelName: level.name,
      nextLevelText: level.next,
      levelProgress: level.progress,
      profile: buildProfile(records, plays),
      badges,
      timeline,
      hasRecords: records.length > 0
    })
  },

  goHome() {
    wx.switchTab({ url: '/pages/index/index' })
  },

  onShareAppMessage() {
    const profile = this.data.profile
    return {
      title: profile ? `我的上海人格：${profile.title}` : '来发现你的上海城市人格',
      path: '/pages/index/index'
    }
  },

  onShareTimeline() {
    const profile = this.data.profile
    return {
      title: profile ? `我的上海人格：${profile.title}` : '来发现你的上海城市人格'
    }
  }
})
