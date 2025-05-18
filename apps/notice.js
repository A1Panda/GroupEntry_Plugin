import plugin from '../../../lib/plugins/plugin.js'
import { Config } from '../components/config.js'

export class NoticeHandler extends plugin {
  constructor() {
    super({
      name: '群组邀请通知',
      dsc: '处理群组邀请通知',
      event: 'request.group.invite',
      priority: 1000
    })
    
    this.config = new Config()
  }

  async accept() {
    // 获取群信息
    let groupName = "未知"
    try {
      const groupInfo = await this.e.bot.sendApi('get_group_info', {
        group_id: this.e.group_id
      })
      if (groupInfo && groupInfo.data) {
        groupName = groupInfo.data.group_name
      }
    } catch (err) {
      logger.error('[群组邀请管理] 获取群信息失败:', err)
    }

    // 获取用户信息
    let nickname = "未知"
    try {
      const userInfo = await this.e.bot.sendApi('get_stranger_info', {
        user_id: this.e.user_id
      })
      if (userInfo && userInfo.data) {
        nickname = userInfo.data.nickname
      }
    } catch (err) {
      logger.error('[群组邀请管理] 获取用户信息失败:', err)
    }

    // 构建通知消息
    const msg = [
      segment.image(`https://p.qlogo.cn/gh/${this.e.group_id}/${this.e.group_id}/0`),
      `【群组邀请管理】\n`,
      `📢 新的加群请求\n`,
      `━━━━━━━━━━━━━━\n`,
      `📌 群组信息\n`,
      `群号：${this.e.group_id}\n`,
      `群名：${groupName}\n`,
      `━━━━━━━━━━━━━━\n`,
      `👤 邀请人信息\n`,
      `账号：${this.e.user_id}\n`,
      `昵称：${nickname}\n`,
      `━━━━━━━━━━━━━━\n`,
      `⚠️ 操作说明\n`,
      `1️⃣ 请邀请者、群主或群管理\n`,
      `2️⃣ 引用回复本条消息\n`,
      `3️⃣ 发送 #确认加群 或 #拒绝加群\n`,
      `━━━━━━━━━━━━━━\n`,
      `⏰ 注意：该请求将在${this.config.config.requestExpireMinutes || 5}分钟后自动取消`
    ]

    // 只向配置中 isEnabled 为 true 的群发送通知
    let hasSend = false
    for (const group of this.config.config.groups || []) {
      if (!group.isEnabled) continue
      try {
        const res = await this.e.bot.pickGroup(group.groupId).sendMsg(msg)
        if (res && res.message_id) {
          // 保存加群请求信息，包括通知消息ID和管理群号
          await this.config.addPendingRequest({
            msgId: res.message_id,
            manageGroupId: group.groupId, // 通知发送到的管理群号
            groupId: this.e.group_id,     // 被邀请的目标群号
            groupName: groupName,
            userId: this.e.user_id,
            nickname: nickname,
            flag: this.e.flag,
            requestTime: Date.now()
          })
          hasSend = true
        } else {
          logger.error('[群组邀请管理] 发送通知失败或未获取到消息ID')
        }
      } catch (err) {
        logger.error(`[群组邀请管理] 向管理群${group.groupId}发送通知失败:`, err)
      }
    }

    if (!hasSend) {
      // 没有任何管理群发送成功，通知邀请人
      try {
        await this.e.bot.pickFriend(this.e.user_id).sendMsg(
          '您的加群请求处理失败，未找到可用的管理群，请联系机器人管理员。'
        )
      } catch (err) {
        logger.error('[群组邀请管理] 发送私聊消息失败:', err)
      }
      return true
    }

    // 发送私聊消息给邀请者
    try {
      await this.e.bot.pickFriend(this.e.user_id).sendMsg(
        '【群组邀请管理】\n' +
        '📢 您的加群请求已收到\n' +
        '━━━━━━━━━━━━━━\n' +
        '⚠️ 请按以下步骤操作：\n' +
        '1️⃣ 进入管理群\n' +
        '2️⃣ 找到机器人发送的加群请求通知\n' +
        '3️⃣ 回复该通知并发送 #确认加群 或 #拒绝加群\n' +
        '━━━━━━━━━━━━━━\n' +
        `⏰ 注意：请求将在${this.config.config.requestExpireMinutes || 5}分钟后自动取消`
      )
    } catch (err) {
      logger.error('[群组邀请管理] 发送私聊消息失败:', err)
    }

    // 不自动处理加群请求，等待确认
    return true
  }
} 