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
    
    // 只在配置发生变化时才保存
    const mergedConfig = lodash.merge({}, this.defaultConfig, this.config)
    if (!lodash.isEqual(this.config, mergedConfig)) {
      this.config = mergedConfig
      this.saveConfig()
    }
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
    return { 
      groups: [], 
      pendingRequests: [], 
      requestExpireMinutes: 5, 
      maxPendingRequests: 20, 
      minGroupMember: 10, 
      autoQuitEnabled: true,
      blackGroups: [],
      whiteGroups: []
    }
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
      // 记录配置变更日志
      logger.mark('[群组邀请管理] 配置文件发生变更')
      logger.debug('[群组邀请管理] 配置详情:', JSON.stringify(this.config, null, 2))
      
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2))
      logger.info('[群组邀请管理] 配置文件保存成功')
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

  // 获取启用的黑名单群
  getEnabledBlackGroups() {
    if (!Array.isArray(this.config.blackGroups)) return []
    
    return this.config.blackGroups
      .filter(g => g.isEnabled !== false)
      .map(g => {
        // 统一处理groupId和groupIdInput
        let groupIds = []
        
        // 处理groupId（可能是数组或单个值）
        if (Array.isArray(g.groupId)) {
          groupIds = groupIds.concat(g.groupId)
        } else if (g.groupId) {
          groupIds.push(g.groupId)
        }
        
        // 处理groupIdInput（可能是数组或单个值）
        if (Array.isArray(g.groupIdInput)) {
          groupIds = groupIds.concat(g.groupIdInput)
        } else if (g.groupIdInput) {
          groupIds.push(g.groupIdInput)
        }
        
        // 确保所有值都是字符串类型
        groupIds = groupIds.map(String)
        
        return {
          ...g,
          groupIds // 统一使用groupIds数组
        }
      })
  }

  // 获取启用的白名单群
  getEnabledWhiteGroups() {
    return Array.isArray(this.config.whiteGroups)
      ? this.config.whiteGroups.filter(g => g.isEnabled !== false)
      : []
  }

  // 更新黑名单群
  updateBlackGroup(groupId, data) {
    const index = this.config.blackGroups.findIndex(g => {
      let groupIds = []
      if (Array.isArray(g.groupId)) {
        groupIds = groupIds.concat(g.groupId)
      } else if (g.groupId) {
        groupIds.push(g.groupId)
      }
      if (Array.isArray(g.groupIdInput)) {
        groupIds = groupIds.concat(g.groupIdInput)
      } else if (g.groupIdInput) {
        groupIds.push(g.groupIdInput)
      }
      return groupIds.map(String).includes(String(groupId))
    })
    
    if (index >= 0) {
      this.config.blackGroups[index] = { ...this.config.blackGroups[index], ...data }
    } else {
      this.config.blackGroups.push({ 
        groupId: [groupId], // 统一使用数组格式
        isEnabled: true, 
        ...data 
      })
    }
    this.saveConfig()
  }

  // 更新白名单群
  updateWhiteGroup(groupId, data) {
    const index = this.config.whiteGroups.findIndex(g => String(g.groupId) === String(groupId))
    if (index >= 0) {
      this.config.whiteGroups[index] = { ...this.config.whiteGroups[index], ...data }
    } else {
      this.config.whiteGroups.push({ groupId, isEnabled: true, ...data })
    }
    this.saveConfig()
  }
} 