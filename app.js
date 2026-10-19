const { applyFeedback } = require('./utils/recommend')
const localPlays = require('./data/plays')

const STORAGE_KEY = 'weekend-unboxed-state-v1'
const CATALOG_STORAGE_KEY = 'weekend-unboxed-catalog-v1'
function emptyState() {
  return {
    challenges: [],
    records: [],
    tagScores: {},
    seenIds: [],
    stats: { completedCount: 0 },
    updatedAt: 0
  }
}

App({
  onLaunch() {
    this.catalog = wx.getStorageSync(CATALOG_STORAGE_KEY) || null
    if (!wx.cloud) return
    const options = { traceUser: true }
    if (wx.cloud.DYNAMIC_CURRENT_ENV) options.env = wx.cloud.DYNAMIC_CURRENT_ENV
    wx.cloud.init(options)
    this.cloudEnabled = true
    this.cloudReady = Promise.all([this.syncFromCloud(), this.syncCatalog()])
  },

  getPlays() {
    if (!Array.isArray(this.catalog) || !this.catalog.length) return localPlays
    const localById = new Map(localPlays.map(play => [play.id, play]))
    const merged = this.catalog.map(play => {
      const local = localById.get(play.id)
      // Bundled migration rules also override obsolete cached/cloud activities.
      return local && (local.status === 'legacy' || (local.catalogVersion || 0) > (play.catalogVersion || 0)) ? local : play
    })
    const cloudIds = new Set(merged.map(play => play.id))
    return [...merged, ...localPlays.filter(play => !cloudIds.has(play.id))]
  },

  async syncCatalog() {
    try {
      const response = await wx.cloud.callFunction({ name: 'getPlays', data: { catalogVersion: 2 } })
      const plays = response.result?.plays
      if (!Array.isArray(plays) || plays.length < 20) throw new Error('Invalid cloud catalog')
      this.catalog = plays
      wx.setStorageSync(CATALOG_STORAGE_KEY, plays)
      this.notifyCatalogReady()
    } catch (error) {
      console.warn('云端活动库暂不可用，继续使用已核验的本地活动', error)
    }
  },

  getState() {
    const saved = wx.getStorageSync(STORAGE_KEY)
    if (!saved || !saved.records) return emptyState()
    const challenges = Array.isArray(saved.challenges)
      ? saved.challenges
      : saved.current ? [saved.current] : []
    const { current, ...rest } = saved
    const state = { ...emptyState(), ...rest, challenges: challenges.slice(0, 4) }
    const recordedCompletions = state.records.filter(item => item.status === 'completed').length
    state.stats = {
      completedCount: Math.max(Number(state.stats?.completedCount) || 0, recordedCompletions)
    }
    return state
  },

  saveState(state, options = {}) {
    if (!options.preserveTimestamp) state.updatedAt = Date.now()
    wx.setStorageSync(STORAGE_KEY, state)
    if (!options.skipCloud) this.requestCloudSync()
    return state
  },

  async syncFromCloud() {
    try {
      const response = await wx.cloud.callFunction({
        name: 'syncState',
        data: { action: 'get' }
      })
      const result = response.result || {}
      const local = this.getState()
      if (result.exists && result.state && result.state.updatedAt > local.updatedAt) {
        this.saveState(result.state, { skipCloud: true, preserveTimestamp: true })
      } else if (!result.exists || local.updatedAt > (result.state?.updatedAt || 0)) {
        if (this.hasUserData(local)) await this.pushCloudState()
      }
    } catch (error) {
      console.warn('云端同步暂不可用，继续使用本地数据', error)
    }
    this.notifyStateReady()
  },

  hasUserData(state) {
    return state.challenges.length > 0
      || state.records.length > 0
      || state.seenIds.length > 0
      || Object.keys(state.tagScores).length > 0
  },

  requestCloudSync() {
    if (!this.cloudEnabled) return
    this.cloudSyncQueued = true
    clearTimeout(this.cloudSyncTimer)
    this.cloudSyncTimer = setTimeout(() => this.flushCloudSync(), 400)
  },

  async pushCloudState() {
    this.cloudSyncQueued = true
    return this.flushCloudSync()
  },

  async flushCloudSync() {
    if (!this.cloudEnabled || this.cloudSyncing) return
    this.cloudSyncing = true
    while (this.cloudSyncQueued) {
      this.cloudSyncQueued = false
      try {
        const response = await wx.cloud.callFunction({
          name: 'syncState',
          data: { action: 'save', state: this.getState() }
        })
        const result = response.result || {}
        const local = this.getState()
        if (result.stale && result.state && result.state.updatedAt > local.updatedAt) {
          this.saveState(result.state, { skipCloud: true, preserveTimestamp: true })
          this.notifyStateReady()
        }
      } catch (error) {
        console.warn('云端保存失败，本地数据已保留', error)
      }
    }
    this.cloudSyncing = false
  },

  notifyStateReady() {
    if (typeof getCurrentPages !== 'function') return
    const pages = getCurrentPages()
    const page = pages[pages.length - 1]
    if (page && typeof page.onCloudStateReady === 'function') page.onCloudStateReady()
  },

  notifyCatalogReady() {
    if (typeof getCurrentPages !== 'function') return
    const pages = getCurrentPages()
    const page = pages[pages.length - 1]
    if (page && typeof page.onCatalogReady === 'function') page.onCatalogReady()
  },

  recordSeen(playId) {
    const state = this.getState()
    state.seenIds = [playId, ...state.seenIds.filter(id => id !== playId)].slice(0, 8)
    return this.saveState(state)
  },

  acceptChallenge(playId) {
    const state = this.getState()
    if (state.challenges.some(item => item.playId === playId)) return 'exists'
    if (state.challenges.length >= 4) return 'full'
    state.challenges.push({ playId, acceptedAt: Date.now(), status: 'active' })
    this.saveState(state)
    return 'accepted'
  },

  abandonChallenge(playId) {
    const state = this.getState()
    const challenge = state.challenges.find(item => item.playId === playId)
    if (!challenge) return state
    state.records.unshift({
      ...challenge,
      status: 'abandoned',
      finishedAt: Date.now()
    })
    state.challenges = state.challenges.filter(item => item.playId !== playId)
    return this.saveState(state)
  },

  completeChallenge(playId, feedback, play) {
    const state = this.getState()
    const challenge = state.challenges.find(item => item.playId === playId)
    if (!challenge || playId !== play.id) return state
    const record = {
      ...challenge,
      ...feedback,
      status: 'completed',
      finishedAt: Date.now()
    }
    state.records.unshift(record)
    state.stats.completedCount += 1
    state.tagScores = applyFeedback(state.tagScores, play, feedback.rating)
    state.challenges = state.challenges.filter(item => item.playId !== playId)
    return this.saveState(state)
  }
})
