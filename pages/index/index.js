const { pickPlay } = require('../../utils/recommend')
const { openPlayLocation } = require('../../utils/location')
const { DISTRICTS, MOOD_LABELS, normalizeFilters, filterPlays } = require('../../utils/filters')
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
    selectedMoods: [],
    selectedDistricts: [],
    districtLabel: '全上海',
    districts: [{ id: 'all', label: '全上海' }, ...DISTRICTS.map(id => ({ id, label: id === '浦东' ? '浦东新区' : `${id}区` }))],
    districtsExpanded: false,
    districtRows: [],
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
    const filters = normalizeFilters(saved)
    this.setData({ selectedDistricts: filters.districts.filter(id => DISTRICTS.includes(id)), selectedMoods: filters.moods.filter(id => MOOD_LABELS[id] && id !== 'random') })
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
    const id = event.currentTarget.dataset.id
    if (!MOOD_LABELS[id]) return
    const selectedMoods = id === 'random' ? [] : this.data.selectedMoods.includes(id)
      ? this.data.selectedMoods.filter(value => value !== id) : [...this.data.selectedMoods, id]
    this.setData({ selectedMoods, play: null, isDrawing: false, emptyMessage: '' })
    this.saveFilters()
  },

  selectDistrict(event) {
    if (this.drawTimer) clearTimeout(this.drawTimer)
    const id = event.currentTarget.dataset.id
    if (id !== 'all' && !DISTRICTS.includes(id)) return
    const selectedDistricts = id === 'all' ? [] : this.data.selectedDistricts.includes(id)
      ? this.data.selectedDistricts.filter(value => value !== id) : [...this.data.selectedDistricts, id]
    this.setData({ selectedDistricts, play: null, isDrawing: false, emptyMessage: '' })
    this.saveFilters()
  },

  toggleDistricts() {
    this.setData({ districtsExpanded: !this.data.districtsExpanded })
  },

  saveFilters() {
    wx.setStorageSync(FILTER_KEY, { moods: this.data.selectedMoods, districts: this.data.selectedDistricts })
    this.updateFilterSummary()
  },

  updateFilterSummary() {
    const plays = getApp().getPlays()
    const { selectedMoods, selectedDistricts } = this.data
    const availableCount = filterPlays(plays, { moods: selectedMoods, districts: selectedDistricts }).length
    const descriptions = {
      random: '不设主题，留一点意外。', healing: '安静停留、自然感官，不赶路。',
      thrill: '第一次尝试：攀岩、滑雪、竞速与科学探索。', arts: '展览、作品、历史故事，认真看一点。',
      outdoors: '快走与户外运动，明确时长和运动目标。', night: '仅在夜间开放的街区、滨水空间与夜场。'
    }
    const districtItems = this.data.districts.map(item => ({ ...item, selected: item.id === 'all' ? !selectedDistricts.length : selectedDistricts.includes(item.id) }))
    const districtRows = []
    for (let index = 0; index < districtItems.length; index += 3) {
      districtRows.push({ id: `district-row-${index}`, items: districtItems.slice(index, index + 3) })
    }
    const moodRows = this.data.moodRows.map(row => ({ ...row, items: row.items.map(item => ({ ...item,
      selected: item.id === 'random' ? !selectedMoods.length : selectedMoods.includes(item.id)
    })) }))
    const districtLabel = !selectedDistricts.length ? '全上海' : selectedDistricts.length <= 3
      ? selectedDistricts.join('、') : `${selectedDistricts.slice(0, 2).join('、')}等${selectedDistricts.length}区`
    const moodDescription = !selectedMoods.length ? descriptions.random : selectedMoods.length === 1 ? descriptions[selectedMoods[0]]
      : `已选：${selectedMoods.map(id => MOOD_LABELS[id]).join(' / ')}。抽取其中任一主题。`
    this.setData({ availableCount, districtRows, moodRows, districtLabel, moodDescription,
      emptyMessage: availableCount ? '' : '所选区域暂时没有符合这些主题的玩法。换个区域或主题试试。' })
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
        moods: this.data.selectedMoods,
        districts: this.data.selectedDistricts,
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
