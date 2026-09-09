const { pickPlay } = require('../../utils/recommend')
const { getMapLocation } = require('../../utils/location')

Page({
  data: {
    moodRows: [
      { id: 'row-1', items: [
        { id: 'random', icon: '🎲', label: '随机盲盒' },
        { id: 'healing', icon: '🌿', label: '放空治愈' }
      ] },
      { id: 'row-2', items: [
        { id: 'thrill', icon: '🧗', label: '新鲜刺激' },
        { id: 'arts', icon: '🎨', label: '文艺漫游' }
      ] },
      { id: 'row-3', items: [
        { id: 'outdoors', icon: '🏃', label: '户外出汗' },
        { id: 'night', icon: '🌙', label: '夜间出逃' }
      ] }
    ],
    selectedMood: 'random',
    play: null,
    reason: '',
    wildcard: false,
    isDrawing: false,
    activeCount: 0,
    activeSummary: '',
    loadingText: '正在翻找上海的隐藏玩法…'
  },

  onShow() {
    wx.showShareMenu({
      menus: ['shareAppMessage', 'shareTimeline']
    })
    const app = getApp()
    const state = app.getState()
    const plays = app.getPlays()
    const activePlays = state.challenges
      .map(challenge => plays.find(play => play.id === challenge.playId))
      .filter(Boolean)
    this.setData({
      activeCount: activePlays.length,
      activeSummary: activePlays.length === 1
        ? activePlays[0].title
        : `${activePlays.length} 个挑战已经排进周末`
    })
  },

  onCloudStateReady() {
    this.onShow()
  },

  onCatalogReady() {
    this.onShow()
  },

  onUnload() {
    if (this.drawTimer) clearTimeout(this.drawTimer)
  },

  selectMood(event) {
    this.setData({ selectedMood: event.currentTarget.dataset.id })
  },

  draw() {
    if (this.data.isDrawing) return
    const messages = [
      '正在避开商场和热门榜单…',
      '正在翻找上海的隐藏玩法…',
      '正在给平常的周末换个方向…'
    ]
    this.setData({
      isDrawing: true,
      play: null,
      loadingText: messages[Math.floor(Math.random() * messages.length)]
    })
    this.drawTimer = setTimeout(() => {
      const app = getApp()
      const state = app.getState()
      const result = pickPlay(app.getPlays(), {
        mood: this.data.selectedMood,
        tagScores: state.tagScores,
        seenIds: state.seenIds
      })
      app.recordSeen(result.play.id)
      this.setData({
        play: result.play,
        reason: result.reason,
        wildcard: result.wildcard,
        isDrawing: false
      })
    }, 700)
  },

  accept() {
    const play = this.data.play
    if (!play) return
    const state = getApp().getState()
    if (state.challenges.some(item => item.playId === play.id)) {
      wx.switchTab({ url: '/pages/challenge/index' })
      return
    }
    if (state.challenges.length >= 4) {
      wx.showToast({ title: '本周挑战已满 4/4', icon: 'none' })
      return
    }
    this.saveChallenge(play)
  },

  saveChallenge(play) {
    const result = getApp().acceptChallenge(play.id)
    if (result === 'full') {
      wx.showToast({ title: '本周挑战已满 4/4', icon: 'none' })
      return
    }
    wx.showToast({ title: '挑战已收下', icon: 'success' })
    setTimeout(() => wx.switchTab({ url: '/pages/challenge/index' }), 450)
  },

  openMap() {
    const play = this.data.play
    if (!play) return
    const location = getMapLocation(play)
    wx.openLocation({
      latitude: location.latitude,
      longitude: location.longitude,
      name: play.location,
      address: play.address,
      scale: 16
    })
  },

  goChallenge() {
    wx.switchTab({ url: '/pages/challenge/index' })
  },

  onShareAppMessage() {
    const play = this.data.play
    return {
      title: play ? `我抽到了：${play.title}` : '周末别想了，抽一个上海城市玩法',
      path: '/pages/index/index'
    }
  },

  onShareTimeline() {
    const play = this.data.play
    return {
      title: play ? `我抽到了：${play.title}` : '周末别想了，抽一个上海城市玩法'
    }
  }
})
