import plugin from '../../../lib/plugins/plugin.js'
import { Config } from '../components/config.js'

export class ConfirmHandler extends plugin {
  constructor() {
    super({
      name: '确认加群',
      dsc: '处理确认加群命令',
      event: 'message.group',
      priority: 1000
    })
    
    this.config = new Config()
  }

  async accept() {
    // 检查是否是确认加群命令
    if (this.e.msg !== '#确认加群') return false

    // 获取配置的群组信息
    const sourceGroup = await this.config.getSourceGroup()
    if (!sourceGroup || sourceGroup.groupId !== this.e.group_id) {
      return false
    }

    // 获取最新的加群请求
    const pendingRequest = await this.config.getPendingRequest()
    if (!pendingRequest) {
      await this.e.reply('没有待处理的加群请求')
      return true
    }

    // 检查权限：必须是邀请者、群主或群管理
    const isInviter = this.e.user_id === pendingRequest.userId
    const isAdmin = this.e.sender.role === 'admin' || this.e.sender.role === 'owner'
    
    if (!isInviter && !isAdmin) {
      await this.e.reply('只有邀请者、群主或群管理才能确认加群请求')
      return true
    }

    // 同意加群请求
    try {
      // 使用 setGroupAddRequest 方法处理加群请求
      await this.e.bot.setGroupAddRequest(pendingRequest.flag, 'invite', true)
      await this.e.reply('已同意加群请求')
      
      // 发送私聊消息给邀请者
      await this.e.bot.pickFriend(pendingRequest.userId).sendMsg(
        '您的加群请求已通过，我已加入群聊'
      )

      // 清除待处理的加群请求
      await this.config.clearPendingRequest()
    } catch (err) {
      logger.error('[群组邀请管理] 处理加群请求失败:', err)
      await this.e.reply('处理加群请求失败，请重试')
    }

    return true
  }
} 