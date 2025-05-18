import fs from 'fs'
import path from 'path'
import { Group } from '../model/group.js'
import lodash from 'lodash'

export class Config {
  constructor() {
    this.configPath = path.join(process.cwd(), 'plugins/GroupEntry_Plugin/config/config.json')
    this.defaultConfigPath = path.join(process.cwd(), 'plugins/GroupEntry_Plugin/config/defaultConfig.json')
    this.defaultConfig = this.loadDefaultConfig()
    this.config = this.loadConfig()
    this.config = lodash.merge({}, this.defaultConfig, this.config)
    this.saveConfig()
  }

  loadDefaultConfig() {
    try {
      if (fs.existsSync(this.defaultConfigPath)) {
        return JSON.parse(fs.readFileSync(this.defaultConfigPath, 'utf8'))
      }
    } catch (err) {
      logger.error('[群组邀请管理] 加载默认配置失败:', err)
    }
    // 兜底
    return { groups: [], pendingRequests: [], requestExpireMinutes: 5, maxPendingRequests: 20, minGroupMember: 10, autoQuitEnabled: true }
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const userConfig = JSON.parse(fs.readFileSync(this.configPath, 'utf8'))
        // 合并默认配置，补全新字段
        return lodash.merge({}, this.defaultConfig, userConfig)
      }
    } catch (err) {
      logger.error('[群组邀请管理] 加载配置文件失败:', err)
    }
    // 没有配置文件时返回默认配置
    return lodash.cloneDeep(this.defaultConfig)
  }

  saveConfig() {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2))
    } catch (err) {
      logger.error('[群组邀请管理] 保存配置文件失败:', err)
    }
  }

  getExpireMs() {
    return (this.config.requestExpireMinutes || 5) * 60 * 1000
  }

  getMaxPending() {
    return this.config.maxPendingRequests || 20
  }

  async getPendingRequests() {
    // 过滤掉过期的请求
    const now = Date.now()
    const expireMs = this.getExpireMs()
    this.config.pendingRequests = this.config.pendingRequests.filter(req => 
      now - req.requestTime <= expireMs
    )
    this.saveConfig()
    return this.config.pendingRequests
  }

  async getPendingRequestByMsgId(msgId) {
    const requestIndex = this.config.pendingRequests.findIndex(req => req.msgId === msgId)
    if (requestIndex === -1) return null

    const pendingRequest = this.config.pendingRequests[requestIndex]
    if (Date.now() - pendingRequest.requestTime > this.getExpireMs()) {
      this.config.pendingRequests.splice(requestIndex, 1)
      this.saveConfig()
      return null
    }
    return pendingRequest
  }

  async addPendingRequest(request) {
    // 限制最大待处理数
    if (this.config.pendingRequests.length >= this.getMaxPending()) {
      this.config.pendingRequests.shift()
    }
    this.config.pendingRequests.push(request)
    this.saveConfig()
  }

  async removePendingRequestByMsgId(msgId) {
    const requestIndex = this.config.pendingRequests.findIndex(req => req.msgId === msgId)
    if (requestIndex !== -1) {
      this.config.pendingRequests.splice(requestIndex, 1)
      this.saveConfig()
    }
  }

  async getGroup(groupId) {
    const groupData = this.config.groups.find(g => g.groupId === groupId)
    return groupData ? Group.fromJSON(groupData) : null
  }

  async saveGroup(group) {
    const index = this.config.groups.findIndex(g => g.groupId === group.groupId)
    if (index >= 0) {
      this.config.groups[index] = group.toJSON()
    } else {
      this.config.groups.push(group.toJSON())
    }
    this.saveConfig()
  }
} 