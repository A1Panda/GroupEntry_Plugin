import fs from 'fs'
import path from 'path'
import { Group } from '../model/group.js'

export class Config {
  constructor() {
    this.configPath = path.join(process.cwd(), 'plugins/GroupEntry_Plugin/config/config.json')
    this.config = this.loadConfig()
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
      groups: []
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

  async getPendingRequest() {
    return this.config.pendingRequest
  }

  async setPendingRequest(request) {
    this.config.pendingRequest = request
    this.config.pendingRequestTime = Date.now()
    this.saveConfig()
  }

  async clearPendingRequest() {
    this.config.pendingRequest = null
    this.config.pendingRequestTime = null
    this.saveConfig()
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