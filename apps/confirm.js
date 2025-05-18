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
    // 检查是否是配置的群组
    const sourceGroup = await this.config.getSourceGroup()
    if (!sourceGroup) {
      return false
    }

    if (sourceGroup.groupId !== e.group_id) {
      return false
    }

    // 检查是否是确认加群命令
    if (!e.msg.includes('#确认加群')) {
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
      await e.reply('请引用要确认的加群请求消息')
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
      await e.reply('请引用机器人发送的加群请求通知消息')
      return true
    }

    // 获取待处理的加群请求
    const pendingRequests = await this.config.getPendingRequests()
    const pendingRequest = pendingRequests.find(req => String(req.groupId) === String(groupId))
    
    if (!pendingRequest) {
      await e.reply('未找到对应的加群请求或请求已过期')
      return true
    }

    // 检查权限：必须是邀请者、群主或群管理
    const isInviter = e.user_id === pendingRequest.userId
    const isAdmin = e.sender.role === 'admin' || e.sender.role === 'owner'
    
    if (!isInviter && !isAdmin) {
      await e.reply('只有邀请者、群主或群管理才能确认加群请求')
      return true
    }

    // 同意加群请求
    try {
      await e.bot.sendApi('set_group_add_request', {
        flag: pendingRequest.flag,
        sub_type: 'invite',
        approve: true
      })
    } catch (err) {
      logger.error('[群组邀请管理] 同意加群请求失败:', err)
      await e.reply('同意加群请求失败，请稍后重试')
      return true
    }

    // 从待处理列表中移除
    await this.config.removePendingRequestByMsgId(pendingRequest.msgId)

    // 发送确认消息
    await e.reply('已同意加群请求')

    // 私聊通知邀请者
    try {
      await e.bot.pickFriend(pendingRequest.userId).sendMsg(
        `您的加群请求已被确认，机器人已加入群 ${pendingRequest.groupName}(${pendingRequest.groupId})`
      )
    } catch (err) {
      logger.error('[群组邀请管理] 发送私聊消息失败:', err)
    }

    return true
  }
} 