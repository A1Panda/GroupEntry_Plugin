/**
 * 适配器 - 处理 napcat 和 icqq 的兼容性
 * 支持 Yunzai-Bot 的不同适配器框架
 */

// 检测当前使用的适配器类型
export async function detectAdapter() {
  try {
    // 尝试导入 icqq
    const icqq = await import('icqq')
    if (icqq) {
      return 'icqq'
    }
  } catch (e) {
    // icqq 不可用
  }
  
  try {
    // 尝试导入 oicq
    const oicq = await import('oicq')
    if (oicq) {
      return 'oicq'
    }
  } catch (e) {
    // oicq 不可用
  }
  
  // 默认返回 oicq（napcat 兼容）
  return 'oicq'
}

// 获取 segment 对象
export async function getSegment() {
  const adapterType = await detectAdapter()
  
  try {
    if (adapterType === 'icqq') {
      const { segment } = await import('icqq')
      return segment
    } else {
      const { segment } = await import('oicq')
      return segment
    }
  } catch (err) {
    logger.error('[群组邀请管理] 获取 segment 失败:', err)
    // 返回一个兼容的 segment 对象
    return {
      image: (file) => ({ type: 'image', file }),
      text: (text) => ({ type: 'text', text }),
      at: (qq) => ({ type: 'at', qq }),
      reply: (id) => ({ type: 'reply', id })
    }
  }
}

// 统一的 Bot API 调用接口
export class BotAdapter {
  constructor(bot) {
    this.bot = bot
    this.adapterType = null
    this.init()
  }
  
  async init() {
    this.adapterType = await detectAdapter()
    logger.info(`[群组邀请管理] 检测到适配器类型: ${this.adapterType}`)
  }
  
  // 统一的 sendApi 方法
  async sendApi(action, params = {}) {
    try {
      if (this.adapterType === 'icqq') {
        // icqq 的 API 调用方式
        return await this.bot.pickUser(this.bot.uin)[action](params)
      } else {
        // oicq/napcat 的 API 调用方式
        return await this.bot.sendApi(action, params)
      }
    } catch (err) {
      logger.error(`[群组邀请管理] API 调用失败 [${action}]:`, err)
      throw err
    }
  }
  
  // 统一的 pickGroup 方法
  pickGroup(groupId) {
    try {
      if (this.adapterType === 'icqq') {
        return this.bot.pickGroup(groupId)
      } else {
        return this.bot.pickGroup(groupId)
      }
    } catch (err) {
      logger.error(`[群组邀请管理] pickGroup 失败 [${groupId}]:`, err)
      throw err
    }
  }
  
  // 统一的 pickFriend 方法
  pickFriend(userId) {
    try {
      if (this.adapterType === 'icqq') {
        return this.bot.pickUser(userId)
      } else {
        return this.bot.pickFriend(userId)
      }
    } catch (err) {
      logger.error(`[群组邀请管理] pickFriend 失败 [${userId}]:`, err)
      throw err
    }
  }
  
  // 统一的 pickMember 方法
  async pickMember(groupId, userId) {
    try {
      if (this.adapterType === 'icqq') {
        const group = this.bot.pickGroup(groupId)
        return await group.pickMember(userId)
      } else {
        return await this.bot.pickMember(groupId, userId)
      }
    } catch (err) {
      logger.error(`[群组邀请管理] pickMember 失败 [${groupId}/${userId}]:`, err)
      throw err
    }
  }
  
  // 获取群成员列表
  async getGroupMemberMap(group) {
    try {
      if (this.adapterType === 'icqq') {
        return await group.getMemberMap()
      } else {
        return await group.getMemberMap()
      }
    } catch (err) {
      logger.error('[群组邀请管理] getGroupMemberMap 失败:', err)
      throw err
    }
  }
  
  // 获取群信息
  async getGroupInfo(groupId) {
    try {
      return await this.sendApi('get_group_info', { group_id: groupId })
    } catch (err) {
      logger.error(`[群组邀请管理] getGroupInfo 失败 [${groupId}]:`, err)
      throw err
    }
  }
  
  // 获取用户信息
  async getStrangerInfo(userId) {
    try {
      return await this.sendApi('get_stranger_info', { user_id: userId })
    } catch (err) {
      logger.error(`[群组邀请管理] getStrangerInfo 失败 [${userId}]:`, err)
      throw err
    }
  }
  
  // 处理加群请求
  async setGroupAddRequest(flag, subType, approve) {
    try {
      return await this.sendApi('set_group_add_request', {
        flag,
        sub_type: subType,
        approve
      })
    } catch (err) {
      logger.error(`[群组邀请管理] setGroupAddRequest 失败:`, err)
      throw err
    }
  }
  
  // 获取消息
  async getMsg(messageId) {
    try {
      return await this.sendApi('get_msg', { message_id: messageId })
    } catch (err) {
      logger.error(`[群组邀请管理] getMsg 失败 [${messageId}]:`, err)
      throw err
    }
  }
  
  // 获取群列表
  async getGroupList() {
    try {
      return await this.sendApi('get_group_list')
    } catch (err) {
      logger.error('[群组邀请管理] getGroupList 失败:', err)
      throw err
    }
  }
}

// 全局 Bot 适配器实例
let globalBotAdapter = null

export function getBotAdapter(bot) {
  if (!globalBotAdapter) {
    globalBotAdapter = new BotAdapter(bot)
  }
  return globalBotAdapter
}

// 兼容性检查
export async function checkCompatibility() {
  const adapterType = await detectAdapter()
  logger.info(`[群组邀请管理] 当前适配器: ${adapterType}`)
  
  if (adapterType === 'icqq') {
    logger.info('[群组邀请管理] 使用 icqq 适配器')
  } else if (adapterType === 'oicq') {
    logger.info('[群组邀请管理] 使用 oicq 适配器 (napcat 兼容)')
  } else {
    logger.warn('[群组邀请管理] 未知适配器类型，使用默认兼容模式')
  }
  
  return adapterType
}
