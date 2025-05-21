import plugin from '../../../lib/plugins/plugin.js'
import { Config } from '../components/config.js'

export class BlacklistManager extends plugin {
  constructor() {
    super({
      name: '黑白名单管理',
      dsc: '管理群组黑白名单',
      event: 'message',
      priority: 599,
      rule: [
        {
          reg: '^#(添加|删除)(黑|白)名单群\\s*(\\d+)$',
          fnc: 'manageGroupList'
        },
        {
          reg: '^#查看(黑|白)名单群$',
          fnc: 'viewGroupList'
        }
      ]
    })
    this.config = new Config()
  }

  // 辅助函数：获取群组ID列表
  getGroupIds(group) {
    const ids = []
    if (group.groupId) {
      if (Array.isArray(group.groupId)) {
        ids.push(...group.groupId)
      } else {
        ids.push(group.groupId)
      }
    }
    if (group.groupIdInput) {
      if (Array.isArray(group.groupIdInput)) {
        ids.push(...group.groupIdInput)
      } else {
        ids.push(group.groupIdInput)
      }
    }
    return ids
  }

  async manageGroupList(e) {
    // 检查权限
    if (!e.isMaster) {
      e.reply('只有主人才能管理黑白名单')
      return true
    }

    const [_, action, type, groupId] = e.msg.match(/^#(添加|删除)(黑|白)名单群\s*(\d+)$/)
    const listType = type === '黑' ? 'blackGroups' : 'whiteGroups'
    const list = this.config.config[listType] || []
    
    try {
      if (action === '添加') {
        if (list.some(g => this.getGroupIds(g).includes(groupId))) {
          e.reply(`该群已在${type}名单中`)
          return true
        }
        list.push({
          groupIdInput: groupId,
          isEnabled: true
        })
        e.reply(`已添加群 ${groupId} 到${type}名单`)
      } else {
        const index = list.findIndex(g => this.getGroupIds(g).includes(groupId))
        if (index === -1) {
          e.reply(`该群不在${type}名单中`)
          return true
        }
        list.splice(index, 1)
        e.reply(`已从${type}名单中删除群 ${groupId}`)
      }

      // 保存配置
      this.config.config[listType] = list
      await this.config.saveConfig()
    } catch (err) {
      logger.error(`[黑白名单管理] 操作失败:`, err)
      e.reply('操作失败，请稍后重试')
    }

    return true
  }

  async viewGroupList(e) {
    const type = e.msg.includes('黑') ? '黑' : '白'
    const listType = type === '黑' ? 'blackGroups' : 'whiteGroups'
    const list = this.config.config[listType] || []

    if (list.length === 0) {
      e.reply(`当前没有${type}名单群`)
      return true
    }

    const msg = [
      `【${type}名单群列表】\n`,
      '━━━━━━━━━━━━━━\n'
    ]

    let hasEnabledGroups = false
    for (const group of list) {
      if (!group.isEnabled) continue
      const groupIds = this.getGroupIds(group)
      if (groupIds.length > 0) {
        msg.push(`群号：${groupIds.join('、')}\n`)
        hasEnabledGroups = true
      }
    }

    if (!hasEnabledGroups) {
      e.reply(`当前没有启用的${type}名单群`)
      return true
    }

    msg.push('━━━━━━━━━━━━━━\n')
    msg.push('💡 使用 #添加黑名单群 群号 添加群\n')
    msg.push('💡 使用 #删除黑名单群 群号 删除群')

    e.reply(msg.join(''))
    return true
  }
} 