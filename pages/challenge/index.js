const { openPlayLocation } = require('../../utils/location')

function formatDate(timestamp) {
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}月${date.getDate()}日收下`
}

Page({
  data: {
    activeChallenges: [],
    selectedChallenge: null,
    play: null,
    acceptedText: '',
    feedbackOpen: false,
    rating: 0,
    ratingOptions: [
      { value: 4, face: '🙂', label: '满意' },
      { value: 1, face: '😕', label: '不满意' }
    ],
    positiveTags: ['很新鲜', '很放松', '氛围很好', '性价比高', '还想再去', '意外发现'],
    negativeTags: ['太远了', '太贵了', '太累了', '人太多', '不够特别', '信息不准确'],
    visibleTags: [],
    selectedTags: [],
    note: '',
    justCompleted: false,
    completedPlay: null,
    completedCount: 0
  },

  onShow() {
    wx.showShareMenu({
      menus: ['shareAppMessage', 'shareTimeline']
    })
    if (this.data.justCompleted) return
    this.loadChallenges(this.data.play ? this.data.play.id : '')
  },

  onCloudStateReady() {
    if (!this.data.justCompleted) this.loadChallenges(this.data.play ? this.data.play.id : '')
  },

  onCatalogReady() {
    if (!this.data.justCompleted) this.loadChallenges(this.data.play ? this.data.play.id : '')
  },

  loadChallenges(preferredPlayId) {
    const app = getApp()
    const state = app.getState()
    const plays = app.getPlays()
    const activeChallenges = state.challenges.map(challenge => ({
      ...challenge,
      play: plays.find(item => item.id === challenge.playId)
    })).filter(item => item.play)
    const selectedChallenge = activeChallenges.find(item => item.playId === preferredPlayId)
      || activeChallenges[0]
    this.setData({
      activeChallenges,
      selectedChallenge: selectedChallenge || null,
      play: selectedChallenge ? selectedChallenge.play : null,
      acceptedText: selectedChallenge ? formatDate(selectedChallenge.acceptedAt) : '',
      feedbackOpen: false,
      rating: 0,
      selectedTags: [],
      note: ''
    })
  },

  selectChallenge(event) {
    this.loadChallenges(event.currentTarget.dataset.id)
  },

  openMap() {
    const play = this.data.play
    if (!play) return
    openPlayLocation(play)
  },

  openFeedback() {
    this.setData({ feedbackOpen: true })
  },

  closeFeedback() {
    this.setData({ feedbackOpen: false })
  },

  selectRating(event) {
    const rating = Number(event.currentTarget.dataset.value)
    const labels = rating >= 3 ? this.data.positiveTags : this.data.negativeTags
    this.setData({
      rating,
      visibleTags: labels.map(label => ({ label, selected: false })),
      selectedTags: []
    })
  },

  toggleTag(event) {
    const tag = event.currentTarget.dataset.tag
    const visibleTags = this.data.visibleTags.map(item => item.label === tag
      ? { ...item, selected: !item.selected }
      : item)
    this.setData({
      visibleTags,
      selectedTags: visibleTags.filter(item => item.selected).map(item => item.label)
    })
  },

  inputNote(event) {
    this.setData({ note: event.detail.value })
  },

  submitFeedback() {
    if (!this.data.rating) {
      wx.showToast({ title: '先选一个感受', icon: 'none' })
      return
    }
    const app = getApp()
    app.completeChallenge(this.data.play.id, {
      rating: this.data.rating,
      feedbackTags: this.data.selectedTags,
      note: this.data.note.trim()
    }, this.data.play)
    const completedCount = app.getState().records.filter(item => item.status === 'completed').length
    wx.vibrateShort({ type: 'light' })
    this.setData({
      justCompleted: true,
      completedPlay: this.data.play,
      completedCount,
      selectedChallenge: null,
      play: null,
      feedbackOpen: false
    })
  },

  abandon() {
    wx.showModal({
      title: '把挑战放回去？',
      content: '它会留在探索记录里，但不会增加完成进度。',
      confirmText: '放回去',
      success: result => {
        if (!result.confirm) return
        getApp().abandonChallenge(this.data.play.id)
        this.loadChallenges('')
      }
    })
  },

  goHome() {
    this.setData({ justCompleted: false })
    wx.switchTab({ url: '/pages/index/index' })
  },

  goExplore() {
    this.setData({ justCompleted: false })
    wx.switchTab({ url: '/pages/explore/index' })
  },

  onShareAppMessage() {
    const play = this.data.play || this.data.completedPlay
    return {
      title: play ? `我的本周城市挑战：${play.title}` : '来抽一个上海周末玩法',
      path: '/pages/index/index'
    }
  },

  onShareTimeline() {
    const play = this.data.play || this.data.completedPlay
    return {
      title: play ? `我的本周城市挑战：${play.title}` : '来抽一个上海周末玩法'
    }
  }
})
