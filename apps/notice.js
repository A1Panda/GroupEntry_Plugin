import plugin from '../../../lib/plugins/plugin.js'
import { Config } from '../components/config.js'
import { getBotAdapter } from '../utils/adapter.js'

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
    const botAdapter = getBotAdapter(this.e.bot)
    
    // 黑名单拦截：如果被邀请进的群在黑名单，直接拒绝邀请
    const blackGroups = this.config.getEnabledBlackGroups()
    if (blackGroups.some(g => g.groupIds.includes(String(this.e.group_id)))) {
      logger.mark(`[群组邀请管理] 群${this.e.group_id}在黑名单，自动拒绝邀请`)
      try {
        await botAdapter.setGroupAddRequest(this.e.flag, 'invite', false)
        // 通知邀请人
        try {
          await botAdapter.pickFriend(this.e.user_id).sendMsg(
            '【群组邀请管理】\n' +
            '❌ 加群请求被拒绝\n' +
            '━━━━━━━━━━━━━━\n' +
            '📢 该群已被列入黑名单\n' +
            '📝 群组信息：\n' +
            `群号：${this.e.group_id}\n` +
            '━━━━━━━━━━━━━━\n' +
            '💡 如有疑问请联系机器人管理员'
          )
        } catch (err) {
          logger.error('[群组邀请管理] 发送黑名单拒绝私聊消息失败:', err)
        }
      } catch (err) {
        logger.error('[群组邀请管理] 拒绝黑名单群邀请失败:', err)
      }
      return true
    }

    // 白名单：如果被邀请进的群在白名单，直接同意邀请（兼容groupId/groupIdInput）
    const whiteGroups = Array.isArray(this.config.config.whiteGroups) ? this.config.config.whiteGroups : []
    if (whiteGroups.some(g => {
      let groupIds = Array.isArray(g.groupId) ? g.groupId : [g.groupId]
      let groupIdInputs = Array.isArray(g.groupIdInput) ? g.groupIdInput : [g.groupIdInput]
      return groupIds.map(String).includes(String(this.e.group_id)) ||
             groupIdInputs.map(String).includes(String(this.e.group_id))
    })) {
      logger.mark(`[加群审核] 群${this.e.group_id}在白名单，自动同意邀请`)
      try {
        await botAdapter.setGroupAddRequest(this.e.flag, 'invite', true)
        // 通知邀请人
        const msg = '【群组邀请管理】\n' +
          '✅ 已自动同意加群邀请\n' +
          '━━━━━━━━━━━━━━\n' +
          '机器人已自动加入群聊，无需审核。'
        try {
          await this.e.bot.pickFriend(this.e.user_id).sendMsg(msg)
          await this.notifyExtraUsers(msg, this.e)
        } catch (err) {
          logger.error('[群组邀请管理] 发送自动同意私聊消息失败:', err)
        }
      } catch (err) {
        logger.error('[群组邀请管理] 自动同意加群邀请失败:', err)
      }
      return true
    }

    // 读取审核模式
    const mode = this.config.config.reviewMode ?? 2
    if (mode === 0) {
      // 自动同意加群邀请
      try {
        await botAdapter.setGroupAddRequest(this.e.flag, 'invite', true)
        // 通知邀请人
        const msg = '【群组邀请管理】\n' +
          '✅ 已自动同意加群邀请\n' +
          '━━━━━━━━━━━━━━\n' +
          '机器人已自动加入群聊，无需审核。'
        try {
          await botAdapter.pickFriend(this.e.user_id).sendMsg(msg)
          await this.notifyExtraUsers(msg, this.e)
        } catch (err) {
          logger.error('[群组邀请管理] 发送自动同意私聊消息失败:', err)
        }
      } catch (err) {
        logger.error('[群组邀请管理] 自动同意加群邀请失败:', err)
      }
      return true
    }
    if (mode === 1) {
      // 关闭不处理
      const msg = '【群组邀请管理】\n' +
        '⚠️ 当前加群审核已关闭，机器人不会处理加群邀请。'
      try {
        await botAdapter.pickFriend(this.e.user_id).sendMsg(msg)
        await this.notifyExtraUsers(msg, this.e)
      } catch (err) {
        logger.error('[群组邀请管理] 发送审核关闭私聊消息失败:', err)
      }
      return true
    }
    if (mode === 3) {
      // 自动拒绝加群邀请
      try {
        await botAdapter.setGroupAddRequest(this.e.flag, 'invite', false)
        const msg = '【群组邀请管理】\n' +
          '❌ 已自动拒绝加群邀请\n' +
          '━━━━━━━━━━━━━━\n' +
          '机器人已自动拒绝本次加群邀请。'
        try {
          await botAdapter.pickFriend(this.e.user_id).sendMsg(msg)
          await this.notifyExtraUsers(msg, this.e)
        } catch (err) {
          logger.error('[群组邀请管理] 发送自动拒绝私聊消息失败:', err)
        }
      } catch (err) {
        logger.error('[群组邀请管理] 自动拒绝加群邀请失败:', err)
      }
      return true
    }
    // mode === 2 走原审核逻辑
    // 获取群信息
    let groupName = "未知"
    try {
      const groupInfo = await botAdapter.getGroupInfo(this.e.group_id)
      if (groupInfo && groupInfo.data) {
        groupName = groupInfo.data.group_name
      }
    } catch (err) {
      logger.error('[群组邀请管理] 获取群信息失败:', err)
    }

    // 获取用户信息
    let nickname = "未知"
    try {
      const userInfo = await botAdapter.getStrangerInfo(this.e.user_id)
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
      `👤 群组信息\n`,
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
      // 兼容 groupId 为数组或字符串
      let groupIds = Array.isArray(group.groupId) ? group.groupId : [group.groupId]
      for (const gid of groupIds) {
        if (!gid) continue
        try {
          const res = await botAdapter.pickGroup(gid).sendMsg(msg)
          if (res && res.message_id) {
            // 保存加群请求信息，包括通知消息ID和管理群号
            await this.config.addPendingRequest({
              msgId: res.message_id,
              manageGroupId: gid, // 通知发送到的管理群号
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
          logger.error(`[群组邀请管理] 向管理群${gid}发送通知失败:`, err)
        }
      }
    }

    // 通知额外用户（内容与管理群一致）
    await this.notifyExtraUsers(msg, this.e)

    // 判断是否有有效的notifyUsers
    const notifyUsers = Array.isArray(this.config.config.notifyUsers) ? this.config.config.notifyUsers.filter(u => u.userId) : []
    if (!hasSend && notifyUsers.length === 0) {
      // 没有任何管理群发送成功，也没有管理用户，通知邀请人
      try {
        await botAdapter.pickFriend(this.e.user_id).sendMsg(
          '您的加群请求处理失败，未找到可用的管理群，请联系机器人管理员。'
        )
      } catch (err) {
        logger.error('[群组邀请管理] 发送私聊消息失败:', err)
      }
      return true
    }

    // 发送私聊消息给邀请者
    try {
      // 收集所有启用的管理群号
      const enabledGroups = (this.config.config.groups || []).filter(g => g.isEnabled)
      const groupIds = enabledGroups.map(g => g.groupId).join('、')
      const msg = '【群组邀请管理】\n' +
        '📢 您的加群请求已收到\n' +
        '━━━━━━━━━━━━━━\n' +
        '⚠️ 请按以下步骤操作：\n' +
        `1️⃣ 进入管理群（群号：${groupIds}）\n` +
        '2️⃣ 找到机器人发送的加群请求通知\n' +
        '3️⃣ 回复该通知并发送 #确认加群 或 #拒绝加群\n' +
        '━━━━━━━━━━━━━━\n' +
        `⏰ 注意：请求将在${this.config.config.requestExpireMinutes || 5}分钟后自动取消`
      await botAdapter.pickFriend(this.e.user_id).sendMsg(msg)
    } catch (err) {
      logger.error('[群组邀请管理] 发送私聊消息失败:', err)
    }

    // 不自动处理加群请求，等待确认
    return true
  }

  // 辅助函数：同时通知额外用户
  async notifyExtraUsers(msg, e) {
    const botAdapter = getBotAdapter(e.bot)
    const notifyUsers = Array.isArray(this.config.config.notifyUsers) ? this.config.config.notifyUsers : []
    logger.mark(`[群组邀请管理] 尝试通知额外用户: ${notifyUsers.map(u => u.userId).join(',')}`)
    for (const user of notifyUsers) {
      if (user.userId && user.userId != e.user_id) {
        logger.mark(`[群组邀请管理] 正在通知: ${user.userId}，内容：${msg}`)
        try {
          await botAdapter.pickFriend(user.userId).sendMsg(msg)
        } catch (err) {
          logger.error(`[群组邀请管理] 发送额外通知给${user.userId}失败:`, err)
        }
      }
    }
  }
} 