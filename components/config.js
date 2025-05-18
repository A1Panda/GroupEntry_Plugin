import fs from 'node:fs'
import path from 'node:path'
import { Group } from '../model/group.js'
import { formatDate } from '../utils/common.js'

export class Config {
  constructor() {
    this.configPath = path.join(process.cwd(), 'plugins/GroupEntry_Plugin/config/config.json')
    this.defaultConfigPath = path.join(process.cwd(), 'plugins/GroupEntry_Plugin/config/default.json')
    this.ensureConfig()
  }

  // 获取默认配置
  getDefaultConfig() {
    return {
      // 全局设置
      settings: {
        requestTimeout: 300, // 请求超时时间（秒）
        autoCleanInterval: 60, // 自动清理间隔（秒）
        maxPendingRequests: 100, // 最大待处理请求数
        enablePrivateNotice: true, // 是否启用私聊通知
        enableGroupNotice: true, // 是否启用群聊通知
        noticeTemplate: {
          title: "【群组邀请管理】",
          separator: "━━━━━━━━━━━━━━",
          emoji: {
            success: "✅",
            error: "❌",
            info: "📢",
            warning: "⚠️",
            group: "👥",
            notify: "📢",
            time: "⏰",
            step: "📝"
          }
        }
      },
      // 群组列表
      groups: [],
      // 待处理请求
      pendingRequests: []
    }
  }

  // 确保配置文件存在
  ensureConfig() {
    // 确保配置目录存在
    const configDir = path.dirname(this.configPath)
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true })
    }

    // 保存默认配置
    if (!fs.existsSync(this.defaultConfigPath)) {
      fs.writeFileSync(this.defaultConfigPath, JSON.stringify(this.getDefaultConfig(), null, 2))
    }

    // 如果用户配置文件不存在，则创建
    if (!fs.existsSync(this.configPath)) {
      fs.writeFileSync(this.configPath, JSON.stringify(this.getDefaultConfig(), null, 2))
    }
  }

  // 合并配置
  mergeConfig(userConfig, defaultConfig) {
    const merged = { ...defaultConfig }

    // 合并全局设置
    if (userConfig.settings) {
      merged.settings = {
        ...defaultConfig.settings,
        ...userConfig.settings,
        // 合并通知模板
        noticeTemplate: {
          ...defaultConfig.settings.noticeTemplate,
          ...userConfig.settings.noticeTemplate,
          // 合并emoji配置
          emoji: {
            ...defaultConfig.settings.noticeTemplate.emoji,
            ...userConfig.settings.noticeTemplate?.emoji
          }
        }
      }
    }

    // 合并群组列表
    if (userConfig.groups) {
      merged.groups = userConfig.groups.map(userGroup => {
        const defaultGroup = defaultConfig.groups.find(g => g.groupId === userGroup.groupId) || {
          settings: {
            enablePrivateNotice: true,
            enableGroupNotice: true,
            customNoticeTemplate: null
          }
        }
        return {
          ...defaultGroup,
          ...userGroup,
          settings: {
            ...defaultGroup.settings,
            ...userGroup.settings
          }
        }
      })
    }

    // 合并待处理请求
    merged.pendingRequests = userConfig.pendingRequests || []

    return merged
  }

  async getConfig() {
    try {
      // 读取默认配置
      const defaultConfig = JSON.parse(fs.readFileSync(this.defaultConfigPath, 'utf8'))
      
      // 读取用户配置
      const userConfig = JSON.parse(fs.readFileSync(this.configPath, 'utf8'))
      
      // 合并配置
      return this.mergeConfig(userConfig, defaultConfig)
    } catch (err) {
      logger.error('[群组邀请管理] 读取配置文件失败:', err)
      return this.getDefaultConfig()
    }
  }

  async saveConfig(config) {
    try {
      // 只保存用户自定义的配置
      const userConfig = {
        settings: {
          requestTimeout: config.settings.requestTimeout,
          autoCleanInterval: config.settings.autoCleanInterval,
          maxPendingRequests: config.settings.maxPendingRequests,
          enablePrivateNotice: config.settings.enablePrivateNotice,
          enableGroupNotice: config.settings.enableGroupNotice,
          noticeTemplate: {
            title: config.settings.noticeTemplate.title,
            separator: config.settings.noticeTemplate.separator,
            emoji: config.settings.noticeTemplate.emoji
          }
        },
        groups: config.groups.map(group => ({
          groupId: group.groupId,
          groupName: group.groupName,
          isEnabled: group.isEnabled,
          isNotifyGroup: group.isNotifyGroup,
          lastUpdate: group.lastUpdate,
          settings: group.settings
        })),
        pendingRequests: config.pendingRequests
      }
      
      fs.writeFileSync(this.configPath, JSON.stringify(userConfig, null, 2))
      return true
    } catch (err) {
      logger.error('[群组邀请管理] 保存配置文件失败:', err)
      return false
    }
  }

  // 获取全局设置
  async getSettings() {
    const config = await this.getConfig()
    return config?.settings || {}
  }

  // 更新全局设置
  async updateSettings(newSettings) {
    const config = await this.getConfig()
    if (!config) return false

    config.settings = {
      ...config.settings,
      ...newSettings
    }

    return await this.saveConfig(config)
  }

  // 获取群组列表
  async getGroups() {
    const config = await this.getConfig()
    return config?.groups || []
  }

  // 获取通知群组
  async getNotifyGroup() {
    const groups = await this.getGroups()
    return groups.find(group => group.isNotifyGroup)
  }

  // 设置通知群组
  async setNotifyGroup(groupId, groupName) {
    const config = await this.getConfig()
    if (!config) return false

    // 更新所有群组的 isNotifyGroup 状态
    config.groups = config.groups.map(group => ({
      ...group,
      isNotifyGroup: group.groupId === groupId
    }))

    // 如果群组不存在，则添加
    if (!config.groups.find(group => group.groupId === groupId)) {
      config.groups.push({
        groupId,
        groupName,
        isEnabled: true,
        isNotifyGroup: true,
        lastUpdate: formatDate(),
        settings: {
          enablePrivateNotice: true,
          enableGroupNotice: true,
          customNoticeTemplate: null
        }
      })
    }

    return await this.saveConfig(config)
  }

  // 设置群组状态
  async setGroupStatus(groupId, groupName, isEnabled) {
    const config = await this.getConfig()
    if (!config) return false

    const group = config.groups.find(g => g.groupId === groupId)
    if (group) {
      group.isEnabled = isEnabled
      group.lastUpdate = formatDate()
    } else {
      config.groups.push({
        groupId,
        groupName,
        isEnabled,
        isNotifyGroup: false,
        lastUpdate: formatDate(),
        settings: {
          enablePrivateNotice: true,
          enableGroupNotice: true,
          customNoticeTemplate: null
        }
      })
    }

    return await this.saveConfig(config)
  }

  // 更新群组设置
  async updateGroupSettings(groupId, settings) {
    const config = await this.getConfig()
    if (!config) return false

    const group = config.groups.find(g => g.groupId === groupId)
    if (group) {
      group.settings = {
        ...group.settings,
        ...settings
      }
      group.lastUpdate = formatDate()
      return await this.saveConfig(config)
    }
    return false
  }

  // 添加待处理请求
  async addPendingRequest(request) {
    const config = await this.getConfig()
    if (!config) return false

    const settings = await this.getSettings()
    config.pendingRequests = config.pendingRequests || []

    // 检查是否超过最大待处理请求数
    if (config.pendingRequests.length >= settings.maxPendingRequests) {
      // 删除最旧的请求
      config.pendingRequests.shift()
    }

    config.pendingRequests.push({
      ...request,
      requestTime: Date.now()
    })

    return await this.saveConfig(config)
  }

  // 获取待处理请求
  async getPendingRequests() {
    const config = await this.getConfig()
    if (!config) return []

    const settings = await this.getSettings()
    const now = Date.now()
    // 清理过期的请求
    config.pendingRequests = (config.pendingRequests || []).filter(req => 
      now - req.requestTime < settings.requestTimeout * 1000
    )
    await this.saveConfig(config)
    return config.pendingRequests
  }

  // 删除待处理请求
  async removePendingRequestByMsgId(msgId) {
    const config = await this.getConfig()
    if (!config) return false

    config.pendingRequests = (config.pendingRequests || []).filter(req => 
      req.msgId !== msgId
    )

    return await this.saveConfig(config)
  }

  // 获取单个待处理请求
  async getPendingRequestByMsgId(msgId) {
    const config = await this.getConfig()
    if (!config) return null

    const settings = await this.getSettings()
    const requestIndex = config.pendingRequests.findIndex(req => req.msgId === msgId)
    if (requestIndex === -1) return null

    const pendingRequest = config.pendingRequests[requestIndex]

    // 检查请求是否过期
    if (Date.now() - pendingRequest.requestTime > settings.requestTimeout * 1000) {
      config.pendingRequests.splice(requestIndex, 1) // 删除过期请求
      await this.saveConfig(config)
      return null
    }

    return pendingRequest
  }

  // 获取群组信息
  async getGroup(groupId) {
    const config = await this.getGroups()
    const groupData = config.find(g => g.groupId === groupId)
    return groupData ? Group.fromJSON(groupData) : null
  }

  // 保存群组信息
  async saveGroup(group) {
    const config = await this.getConfig()
    if (!config) return false

    const index = config.groups.findIndex(g => g.groupId === group.groupId)
    if (index >= 0) {
      config.groups[index] = group.toJSON()
    } else {
      config.groups.push(group.toJSON())
    }
    return await this.saveConfig(config)
  }
} 