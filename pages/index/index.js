const { pickPlay } = require('../../utils/recommend')
const { openPlayLocation } = require('../../utils/location')
const { DISTRICTS, MOOD_LABELS, filterPlays } = require('../../utils/filters')
const FILTER_KEY = 'weekend-unboxed-filters-v1'

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
    selectedDistrict: 'all',
    districtLabel: '全上海',
    districts: [{ id: 'all', label: '全上海' }, ...DISTRICTS.map(id => ({ id, label: id === '浦东' ? '浦东新区' : `${id}区` }))],
    districtsExpanded: false,
    moodDescription: '不设主题，留一点意外。',
    availableCount: 0,
    emptyMessage: '',
    play: null,
    reason: '',
    wildcard: false,
    isDrawing: false,
    activeCount: 0,
    activeSummary: '',
    loadingText: '正在翻找上海的隐藏玩法…'
  },

  onLoad() {
    const saved = wx.getStorageSync(FILTER_KEY) || {}
    const selectedDistrict = saved.district === 'all' || DISTRICTS.includes(saved.district) ? saved.district : 'all'
    const selectedMood = MOOD_LABELS[saved.mood] ? saved.mood : 'random'
    this.setData({ selectedMood, selectedDistrict, districtLabel: selectedDistrict === 'all' ? '全上海' : `${selectedDistrict}${selectedDistrict === '浦东' ? '新区' : '区'}` })
    this.updateFilterSummary()
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
    this.updateFilterSummary()
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
    if (this.drawTimer) clearTimeout(this.drawTimer)
    this.setData({ selectedMood: event.currentTarget.dataset.id, play: null, isDrawing: false, emptyMessage: '' })
    this.saveFilters()
  },

  selectDistrict(event) {
    if (this.drawTimer) clearTimeout(this.drawTimer)
    const selectedDistrict = event.currentTarget.dataset.id
    this.setData({ selectedDistrict, districtLabel: selectedDistrict === 'all' ? '全上海' : `${selectedDistrict}${selectedDistrict === '浦东' ? '新区' : '区'}`, play: null, isDrawing: false, emptyMessage: '' })
    this.saveFilters()
  },

  toggleDistricts() {
    this.setData({ districtsExpanded: !this.data.districtsExpanded })
  },

  saveFilters() {
    wx.setStorageSync(FILTER_KEY, { mood: this.data.selectedMood, district: this.data.selectedDistrict })
    this.updateFilterSummary()
  },

  updateFilterSummary() {
    const plays = getApp().getPlays()
    const availableCount = filterPlays(plays, { mood: this.data.selectedMood, district: this.data.selectedDistrict }).length
    const descriptions = {
      random: '不设主题，留一点意外。', healing: '安静停留、自然感官，不赶路。',
      thrill: '第一次尝试：攀岩、滑雪、竞速与科学探索。', arts: '展览、作品、历史故事，认真看一点。',
      outdoors: '快走与户外运动，明确时长和运动目标。', night: '仅在夜间开放的街区、滨水空间与夜场。'
    }
    this.setData({ availableCount, moodDescription: descriptions[this.data.selectedMood],
      emptyMessage: availableCount ? '' : '这里暂时没有这个主题的玩法。换个区域，或选择随机盲盒。' })
  },

  draw() {
    if (this.data.isDrawing) return
    this.updateFilterSummary()
    if (!this.data.availableCount) return
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
        district: this.data.selectedDistrict,
        tagScores: state.tagScores,
        seenIds: state.seenIds
      })
      if (!result.play) {
        this.setData({ play: null, emptyMessage: result.reason, isDrawing: false })
        return
      }
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
    openPlayLocation(play)
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
