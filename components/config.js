import fs from 'fs'
import path from 'path'
import { Group } from '../model/group.js'

export class Config {
  constructor() {
    this.configPath = path.join(process.cwd(), 'plugins/GroupEntry_Plugin/config/config.json')
    this.config = this.loadConfig()
    // 初始化pendingRequests为数组，如果config中没有则创建
    if (!this.config.pendingRequests) {
      this.config.pendingRequests = []
    }
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        return JSON.parse(fs.readFileSync(this.configPath, 'utf8'))
      }
    } catch (err) {
      logger.error('[群组邀请管理] 加载配置文件失败:', err)
    }
    return {
      groups: [],
      pendingRequests: [] // 初始化为数组
    }
  }

  saveConfig() {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2))
    } catch (err) {
      logger.error('[群组邀请管理] 保存配置文件失败:', err)
    }
  }

  async getSourceGroup() {
    const sourceGroup = this.config.groups.find(g => g.isSourceGroup)
    if (!sourceGroup) return null
    
    return {
      groupId: sourceGroup.groupId,
      setTime: new Date(sourceGroup.lastUpdate).getTime()
    }
  }

  async setSourceGroup(groupId) {
    // 清除其他群的来源群组标记
    this.config.groups.forEach(g => {
      if (g.isSourceGroup) {
        g.isSourceGroup = false
      }
    })

    // 设置新的来源群组
    const group = this.config.groups.find(g => g.groupId === groupId)
    if (group) {
      group.isSourceGroup = true
      group.lastUpdate = new Date().toLocaleString()
    } else {
      this.config.groups.push({
        groupId,
        groupName: '',
        isSourceGroup: true,
        lastUpdate: new Date().toLocaleString()
      })
    }
    
    this.saveConfig()
  }

  async getPendingRequests() {
    // 过滤掉过期的请求
    const now = Date.now()
    this.config.pendingRequests = this.config.pendingRequests.filter(req => 
      now - req.requestTime <= 5 * 60 * 1000
    )
    this.saveConfig()
    return this.config.pendingRequests
  }

  async getPendingRequestByMsgId(msgId) {
    const requestIndex = this.config.pendingRequests.findIndex(req => req.msgId === msgId)
    if (requestIndex === -1) return null

    const pendingRequest = this.config.pendingRequests[requestIndex]

    // 检查请求是否过期（5分钟）
    if (Date.now() - pendingRequest.requestTime > 5 * 60 * 1000) {
      this.config.pendingRequests.splice(requestIndex, 1) // 删除过期请求
      this.saveConfig()
      return null
    }

    return pendingRequest
  }

  async addPendingRequest(request) {
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