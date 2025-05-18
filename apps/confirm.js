import plugin from '../../../lib/plugins/plugin.js'
import { Config } from '../components/config.js'

export class ConfirmHandler extends plugin {
  constructor() {
    super({
      name: '群组邀请确认',
      dsc: '处理群组邀请确认',
      event: 'message.group',
      priority: 1000
    })
    
    this.config = new Config()
  }

  async accept(e) {
    // 检查是否是确认或拒绝加群命令
    const isConfirm = e.msg.includes('#确认加群')
    const isReject = e.msg.includes('#拒绝加群')
    if (!isConfirm && !isReject) {
      return false
    }

    // 获取引用的消息ID
    let quoteMsgId = null
    try {
      if (e.message && Array.isArray(e.message)) {
        const replyMsg = e.message.find(item => item.type === 'reply')
        if (replyMsg && replyMsg.id) {
          quoteMsgId = replyMsg.id
        }
      }
    } catch (err) {
      logger.error('[群组邀请管理] 解析消息失败:', err)
    }

    if (!quoteMsgId) {
      await e.reply('【群组邀请管理】\n' +
        '❌ 操作失败\n' +
        '━━━━━━━━━━━━━━\n' +
        '⚠️ 请引用回复要处理的加群请求消息\n' +
        '📝 操作步骤：\n' +
        '1️⃣ 找到机器人发送的加群请求通知\n' +
        '2️⃣ 点击"引用"按钮\n' +
        '3️⃣ 发送 #确认加群 或 #拒绝加群')
      return true
    }

    // 获取引用的消息内容
    let quoteMsgSegments = []
    try {
      const quoteMsg = await e.bot.sendApi('get_msg', {
        message_id: quoteMsgId
      })
      if (quoteMsg && quoteMsg.data && quoteMsg.data.message) {
        quoteMsgSegments = quoteMsg.data.message
      }
    } catch (err) {
      logger.error('[群组邀请管理] 获取引用消息内容失败:', err)
    }

    // 从消息内容中提取群号
    let groupId = null
    if (quoteMsgSegments && Array.isArray(quoteMsgSegments)) {
      for (const segment of quoteMsgSegments) {
        if (segment.type === 'text' && segment.data && segment.data.text) {
          const groupIdMatch = segment.data.text.match(/群号：(\d+)/)
          if (groupIdMatch) {
            groupId = groupIdMatch[1]
            break
          }
        }
      }
    }

    if (!groupId) {
      await e.reply('【群组邀请管理】\n' +
        '❌ 操作失败\n' +
        '━━━━━━━━━━━━━━\n' +
        '⚠️ 请引用机器人发送的加群请求通知消息\n' +
        '📝 操作步骤：\n' +
        '1️⃣ 找到机器人发送的加群请求通知\n' +
        '2️⃣ 点击"引用"按钮\n' +
        '3️⃣ 发送 #确认加群 或 #拒绝加群')
      return true
    }

    // 获取待处理的加群请求
    const pendingRequests = await this.config.getPendingRequests()
    const pendingRequest = pendingRequests.find(req => String(req.groupId) === String(groupId))
    
    if (!pendingRequest) {
      await e.reply('【群组邀请管理】\n' +
        '❌ 操作失败\n' +
        '━━━━━━━━━━━━━━\n' +
        '⚠️ 未找到对应的加群请求\n' +
        '可能原因：\n' +
        '1️⃣ 请求已过期（5分钟）\n' +
        '2️⃣ 请求已被处理\n' +
        '3️⃣ 请求不存在\n' +
        '📝 请重新邀请机器人加群')
      return true
    }

    // 检查权限：必须是邀请者、群主或群管理
    const isInviter = e.user_id === pendingRequest.userId
    const isAdmin = e.sender.role === 'admin' || e.sender.role === 'owner'
    
    if (!isInviter && !isAdmin) {
      await e.reply('【群组邀请管理】\n' +
        '❌ 操作失败\n' +
        '━━━━━━━━━━━━━━\n' +
        '⚠️ 权限不足\n' +
        '📝 只有以下用户才能处理加群请求：\n' +
        '1️⃣ 邀请者本人\n' +
        '2️⃣ 群主\n' +
        '3️⃣ 群管理员')
      return true
    }

    // 处理加群请求
    try {
      await e.bot.sendApi('set_group_add_request', {
        flag: pendingRequest.flag,
        sub_type: 'invite',
        approve: isConfirm
      })
    } catch (err) {
      logger.error('[群组邀请管理] 处理加群请求失败:', err)
      await e.reply('【群组邀请管理】\n' +
        '❌ 操作失败\n' +
        '━━━━━━━━━━━━━━\n' +
        '⚠️ 处理加群请求失败\n' +
        '📝 请稍后重试')
      return true
    }

    // 从待处理列表中移除
    await this.config.removePendingRequestByMsgId(pendingRequest.msgId)

    // 发送处理结果消息
    if (isConfirm) {
      await e.reply('【群组邀请管理】\n' +
        '✅ 操作成功\n' +
        '━━━━━━━━━━━━━━\n' +
        '📢 已同意加群请求\n' +
        '📝 处理结果：\n' +
        '1️⃣ 机器人将加入目标群\n' +
        '2️⃣ 邀请者将收到通知\n' +
        '3️⃣ 加群请求已关闭')

      // 私聊通知邀请者
      try {
        await e.bot.pickFriend(pendingRequest.userId).sendMsg(
          '【群组邀请管理】\n' +
          '✅ 加群请求已确认\n' +
          '━━━━━━━━━━━━━━\n' +
          '📢 您的加群请求已被确认\n' +
          '📝 群组信息：\n' +
          `群名：${pendingRequest.groupName}\n` +
          `群号：${pendingRequest.groupId}\n` +
          '━━━━━━━━━━━━━━\n' +
          '🤖 机器人将自动加入该群'
        )
      } catch (err) {
        logger.error('[群组邀请管理] 发送私聊消息失败:', err)
      }
    } else {
      await e.reply('【群组邀请管理】\n' +
        '✅ 操作成功\n' +
        '━━━━━━━━━━━━━━\n' +
        '📢 已拒绝加群请求\n' +
        '📝 处理结果：\n' +
        '1️⃣ 加群请求已关闭\n' +
        '2️⃣ 邀请者将收到通知')

      // 私聊通知邀请者
      try {
        await e.bot.pickFriend(pendingRequest.userId).sendMsg(
          '【群组邀请管理】\n' +
          '❌ 加群请求被拒绝\n' +
          '━━━━━━━━━━━━━━\n' +
          '📢 您的加群请求已被拒绝\n' +
          '📝 群组信息：\n' +
          `群名：${pendingRequest.groupName}\n` +
          `群号：${pendingRequest.groupId}\n` +
          '━━━━━━━━━━━━━━\n' +
          '💡 如有疑问请联系群主或管理员'
        )
      } catch (err) {
        logger.error('[群组邀请管理] 发送私聊消息失败:', err)
      }
    }

    return true
  }
} 