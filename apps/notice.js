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

    logger.info('[群组邀请管理] 收到群邀请请求:', {
      group_id: this.e.group_id,
      group_name: groupName,
      user_id: this.e.user_id,
      nickname: nickname,
      flag: this.e.flag
    })

    // 获取配置的群组信息
    const sourceGroup = await this.config.getSourceGroup()
    if (!sourceGroup) {
      logger.error('[群组邀请管理] 未找到配置的验证码来源群组')
      // 发送私聊消息给邀请者
      try {
        await this.e.bot.pickFriend(this.e.user_id).sendMsg(
          '抱歉，机器人暂未配置验证码来源群组，无法处理加群请求'
        )
      } catch (err) {
        logger.error('[群组邀请管理] 发送私聊消息失败:', err)
      }
      return true
    }

    // 构建通知消息
    const msg = [
      segment.image(`https://p.qlogo.cn/gh/${this.e.group_id}/${this.e.group_id}/0`),
      `[群组邀请管理 - 新的加群请求]\n`,
      `群号：${this.e.group_id}\n`,
      `群名：${groupName}\n`,
      `邀请人账号：${this.e.user_id}\n`,
      `邀请人昵称：${nickname}\n`,
      `----------------\n`,
      `请邀请者、群主或群管理回复\n#确认加群 来同意加群请求\n`,
      `该请求将在5分钟后自动取消`
    ]

    // 保存加群请求信息
    await this.config.setPendingRequest({
      groupId: this.e.group_id,
      groupName: groupName,
      userId: this.e.user_id,
      nickname: nickname,
      flag: this.e.flag,
      requestTime: Date.now()
    })

    // 发送通知到配置的群
    try {
      logger.info('[群组邀请管理] 正在发送通知到配置的群:', sourceGroup.groupId)
      await this.e.bot.pickGroup(sourceGroup.groupId).sendMsg(msg)
    } catch (err) {
      logger.error('[群组邀请管理] 发送通知失败:', err)
    }

    // 发送私聊消息给邀请者
    try {
      await this.e.bot.pickFriend(this.e.user_id).sendMsg(
        '已收到您的加群请求，请等待确认\n' +
        `您可以在群 ${sourceGroup.groupId} 中发送\n` +
        '#确认加群 来确认加群请求'
      )
    } catch (err) {
      logger.error('[群组邀请管理] 发送私聊消息失败:', err)
    }

    // 不自动处理加群请求，等待确认
    return true
  }
} 