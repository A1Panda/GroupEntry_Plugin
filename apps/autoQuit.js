import plugin from '../../../lib/plugins/plugin.js'
import { Config } from '../components/config.js'

export class AutoQuitHandler extends plugin {
  constructor() {
    super({
      name: '自动退群',
      dsc: '群成员小于阈值自动退群',
      event: 'notice.group.increase',
      priority: 1000
    })
    this.config = new Config()
  }

  async accept() {
    // 黑名单优先，直接退群或拒绝邀请（必须放在所有逻辑最前面）
    const blackGroups = this.config.getEnabledBlackGroups()
    logger.debug(`[自动退群] 当前群号: ${this.e.group_id}`)
    logger.debug(`[自动退群] 黑名单群组列表: ${JSON.stringify(blackGroups, null, 2)}`)
    
    const isBlacklisted = blackGroups.some(g => {
      const isInBlacklist = g.groupIds.includes(String(this.e.group_id))
      logger.debug(`[自动退群] 检查群组 ${this.e.group_id} 是否在黑名单 ${g.groupIds.join(',')} 中: ${isInBlacklist}`)
      return isInBlacklist
    })
    
    if (isBlacklisted) {
      logger.mark(`[自动退群] 命中启用的黑名单，立即退群`)
      // 如果机器人已在群，直接退群
      if (this.e.group) {
        await this.reply('本群已被列入黑名单，机器人将自动退出。')
        this.e.group.quit()
      } else if (this.e.flag) {
        // 如果是加群邀请事件，直接拒绝
        try {
          await this.e.bot.sendApi('set_group_add_request', {
            flag: this.e.flag,
            sub_type: 'invite',
            approve: false
          })
        } catch (err) {
          logger.error('[自动退群] 拒绝黑名单群邀请失败:', err)
        }
      }
      return true
    }

    // 开关关闭则不处理
    if (!this.config.config.autoQuitEnabled) return false

    logger.mark(`[自动退群] 事件触发，user_id=${this.e.user_id} self_id=${this.e.self_id} operator_id=${this.e.operator_id}`)

    // 只处理机器人自己被拉入新群
    if (this.e.user_id != this.e.self_id) {
      logger.mark('[自动退群] 非机器人被拉入，忽略')
      return false
    }

    // 只有邀请人是主人才不退群
    let isMaster = false
    const masterIds = (global.yunzaiConfig?.master ? [global.yunzaiConfig.master] : []).concat(global.yunzaiConfig?.masters || [])
    logger.mark(`[自动退群] 主人QQ号列表: ${masterIds.join(',')}`)
    if (masterIds.includes(String(this.e.operator_id))) isMaster = true
    logger.mark(`[自动退群] 邀请人${this.e.operator_id} 是否为主人: ${isMaster}`)
    if (isMaster) {
      logger.mark('[自动退群] 邀请人为主人，不退群')
      return false
    }

    // 获取邀请人信息
    let inviterRole = ''
    try {
      const gml = await this.e.group.getMemberMap()
      if (gml instanceof Map && this.e.operator_id) {
        const inviter = gml.get(this.e.operator_id)
        inviterRole = inviter?.role || ''
      }
    } catch (err) {
      logger.error('[自动退群] 获取邀请人信息失败:', err)
    }
    logger.mark(`[自动退群] 邀请人角色: ${inviterRole}`)

    // allowAdminInvite 开关逻辑
    const allowAdminInvite = !!this.config.config.allowAdminInvite
    if (allowAdminInvite && (inviterRole === 'owner' || inviterRole === 'admin')) {
      logger.mark('[自动退群] allowAdminInvite=ON，群主/管理员邀请，不退群')
      return false
    }

    // 读取配置中的最小成员数，默认10
    const minMember = this.config.config.minGroupMember || 10

    // 获取群成员列表
    let memberCount = 0
    try {
      const gml = await this.e.group.getMemberMap()
      if (gml instanceof Map) {
        memberCount = gml.size
      }
    } catch (err) {
      logger.error('[自动退群] 获取群成员失败:', err)
      return false
    }

    // 白名单优先，不退群
    const whiteGroups = this.config.getEnabledWhiteGroups()
    if (whiteGroups.some(g => {
      let groupIds = Array.isArray(g.groupId) ? g.groupId : [g.groupId]
      let groupIdInputs = Array.isArray(g.groupIdInput) ? g.groupIdInput : [g.groupIdInput]
      return groupIds.map(String).includes(String(this.e.group_id)) ||
             groupIdInputs.map(String).includes(String(this.e.group_id))
    })) {
      logger.mark(`[自动退群] 群${this.e.group_id}在启用的白名单，任何人邀请都不会退群`)
      return false
    }

    // 判断是否需要退群
    if (memberCount < minMember && !this.e.group.is_owner) {
      // 获取自定义消息
      let quitMsg = this.config.config.autoQuitMsg || `本群成员数仅${memberCount}人，未达到最低要求（${minMember}人），机器人将自动退出。`
      quitMsg = quitMsg.replace('{memberCount}', memberCount).replace('{minMember}', minMember)
      // 替换{groupIds}
      const enabledGroups = (this.config.config.groups || []).filter(g => g.isEnabled)
      const groupIds = enabledGroups.map(g => g.groupId).join('、')
      quitMsg = quitMsg.replace('{groupIds}', groupIds)
      await this.reply(quitMsg)
      logger.mark(`[自动退群] ${this.e.group_id}，成员数：${memberCount}`)
      this.e.group.quit()
      return true
    }

    return false
  }
} 