import plugin from '../../../lib/plugins/plugin.js'
import { Config } from '../components/config.js'

export class ConfigHandler extends plugin {
  constructor() {
    super({
      name: '群组邀请管理配置',
      dsc: '管理群组邀请管理插件的配置',
      event: 'message',
      priority: 1000,
      rule: [
        {
          reg: '^#?(群组邀请|群组管理)(配置|设置)(查看|列表)$',
          fnc: 'viewConfig',
          permission: 'master'
        },
        {
          reg: '^#?(群组邀请|群组管理)(配置|设置)(通知群组|管理群组)(\\d+)$',
          fnc: 'setNotifyGroup',
          permission: 'master'
        },
        {
          reg: '^#?(群组邀请|群组管理)(配置|设置)(启用|禁用)(\\d+)$',
          fnc: 'setGroupStatus',
          permission: 'master'
        }
      ]
    })
    
    this.config = new Config()
  }

  async viewConfig() {
    const groups = await this.config.getGroups()
    if (!groups || groups.length === 0) {
      await this.e.reply('【群组邀请管理】\n' +
        '❌ 配置为空\n' +
        '━━━━━━━━━━━━━━\n' +
        '📝 请先添加群组配置\n' +
        '使用命令：\n' +
        '#群组邀请配置通知群组 群号')
      return true
    }

    let msg = '【群组邀请管理】\n' +
      '📋 群组配置列表\n' +
      '━━━━━━━━━━━━━━\n'

    for (const group of groups) {
      msg += `📌 群组信息\n` +
        `群号：${group.groupId}\n` +
        `群名：${group.groupName}\n` +
        `状态：${group.isEnabled ? '✅ 启用' : '❌ 禁用'}\n` +
        `类型：${group.isNotifyGroup ? '📢 通知群组' : '👥 普通群组'}\n` +
        `更新：${group.lastUpdate}\n` +
        '━━━━━━━━━━━━━━\n'
    }

    msg += '📝 配置命令：\n' +
      '1️⃣ #群组邀请配置通知群组 群号\n' +
      '2️⃣ #群组邀请配置启用 群号\n' +
      '3️⃣ #群组邀请配置禁用 群号'

    await this.e.reply(msg)
    return true
  }

  async setNotifyGroup() {
    const groupId = this.e.msg.match(/\d+/)[0]
    
    // 获取群信息
    let groupName = "未知"
    try {
      const groupInfo = await this.e.bot.sendApi('get_group_info', {
        group_id: groupId
      })
      if (groupInfo && groupInfo.data) {
        groupName = groupInfo.data.group_name
      }
    } catch (err) {
      logger.error('[群组邀请管理] 获取群信息失败:', err)
      await this.e.reply('【群组邀请管理】\n' +
        '❌ 操作失败\n' +
        '━━━━━━━━━━━━━━\n' +
        '⚠️ 获取群信息失败\n' +
        '📝 请确认：\n' +
        '1️⃣ 群号是否正确\n' +
        '2️⃣ 机器人是否在群内\n' +
        '3️⃣ 机器人是否有权限')
      return true
    }

    // 更新配置
    try {
      await this.config.setNotifyGroup(groupId, groupName)
      await this.e.reply('【群组邀请管理】\n' +
        '✅ 操作成功\n' +
        '━━━━━━━━━━━━━━\n' +
        '📢 已设置通知群组\n' +
        '📝 群组信息：\n' +
        `群号：${groupId}\n` +
        `群名：${groupName}\n` +
        '━━━━━━━━━━━━━━\n' +
        '🤖 加群请求将发送到此群')
    } catch (err) {
      logger.error('[群组邀请管理] 设置通知群组失败:', err)
      await this.e.reply('【群组邀请管理】\n' +
        '❌ 操作失败\n' +
        '━━━━━━━━━━━━━━\n' +
        '⚠️ 设置通知群组失败\n' +
        '📝 请稍后重试')
    }
    return true
  }

  async setGroupStatus() {
    const groupId = this.e.msg.match(/\d+/)[0]
    const isEnable = this.e.msg.includes('启用')
    
    // 获取群信息
    let groupName = "未知"
    try {
      const groupInfo = await this.e.bot.sendApi('get_group_info', {
        group_id: groupId
      })
      if (groupInfo && groupInfo.data) {
        groupName = groupInfo.data.group_name
      }
    } catch (err) {
      logger.error('[群组邀请管理] 获取群信息失败:', err)
      await this.e.reply('【群组邀请管理】\n' +
        '❌ 操作失败\n' +
        '━━━━━━━━━━━━━━\n' +
        '⚠️ 获取群信息失败\n' +
        '📝 请确认：\n' +
        '1️⃣ 群号是否正确\n' +
        '2️⃣ 机器人是否在群内\n' +
        '3️⃣ 机器人是否有权限')
      return true
    }

    // 更新配置
    try {
      await this.config.setGroupStatus(groupId, groupName, isEnable)
      await this.e.reply('【群组邀请管理】\n' +
        '✅ 操作成功\n' +
        '━━━━━━━━━━━━━━\n' +
        `📢 已${isEnable ? '启用' : '禁用'}群组\n` +
        '📝 群组信息：\n' +
        `群号：${groupId}\n` +
        `群名：${groupName}\n` +
        `状态：${isEnable ? '✅ 启用' : '❌ 禁用'}\n` +
        '━━━━━━━━━━━━━━\n' +
        `🤖 群组${isEnable ? '已启用' : '已禁用'}加群请求功能`)
    } catch (err) {
      logger.error('[群组邀请管理] 设置群组状态失败:', err)
      await this.e.reply('【群组邀请管理】\n' +
        '❌ 操作失败\n' +
        '━━━━━━━━━━━━━━\n' +
        '⚠️ 设置群组状态失败\n' +
        '📝 请稍后重试')
    }
    return true
  }
} 