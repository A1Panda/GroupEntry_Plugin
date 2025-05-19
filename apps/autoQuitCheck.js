import plugin from '../../../lib/plugins/plugin.js'
import { Config } from '../components/config.js'
import { Group } from '../model/group.js'

export class AutoQuitCheck extends plugin {
  static instance = null

  constructor() {
    super({
      name: '自动退群黑名单自检',
      dsc: '定时检查黑名单群并退群',
      event: 'message.private',
      priority: 50
    })

    // 使用单例模式
    if (AutoQuitCheck.instance) {
      return AutoQuitCheck.instance
    }
    AutoQuitCheck.instance = this

    // 初始化配置
    this.config = new Config()
    this.initTask()
  }

  // 初始化定时任务
  initTask() {
    // 获取配置的cron表达式，默认每分钟检查一次
    const cron = this.config.config.autoQuitCron || '*/1 * * * *'
    
    // 注册定时任务
    this.task = {
      cron,
      name: '自动退群黑名单检查',
      fnc: () => this.checkBlackGroups(),
      log: true  // 关闭定时任务的默认日志
    }

    logger.debug(`[自动退群] 定时任务已设置，cron: ${cron}`)
  }

  // 检查黑名单群
  async checkBlackGroups() {
    try {
      // 读取配置
      const config = new Config()
      const cfg = config.config

      // 检查是否启用自动退群
      if (!cfg.autoQuitEnabled) {
        logger.debug('[自动退群] 自动退群功能未启用')
        return false
      }

      // 获取启用的黑名单群
      const blackGroups = config.getEnabledBlackGroups()
      if (!blackGroups.length) {
        logger.debug('[自动退群] 黑名单为空或所有黑名单群都已禁用')
        return false
      }

      logger.debug(`[自动退群] 当前启用的黑名单群：${JSON.stringify(blackGroups)}`)

      // 获取所有机器人账号
      const botList = Object.values(Bot)
      if (botList.length === 0) {
        logger.error('[自动退群] 没有机器人在线')
        return false
      }

      // 使用第一个在线的机器人
      const bot = botList[0]
      logger.debug(`[自动退群] 使用机器人：${bot.uin}`)
      
      // 获取机器人所在群列表
      const groupList = await bot.sendApi('get_group_list')
      if (!groupList || !groupList.data || !Array.isArray(groupList.data)) {
        logger.error('[自动退群] 获取群列表失败或格式错误')
        return false
      }

      // 过滤掉无效的群
      const validGroups = groupList.data.filter(g => g && g.group_id)
      logger.debug(`[自动退群] 机器人当前所在群：${validGroups.map(g => g.group_id).join(', ')}`)

      for (const group of validGroups) {
        const isBlackListed = blackGroups.some(g => {
          let groupIds = Array.isArray(g.groupId) ? g.groupId : [g.groupId]
          let groupIdInputs = Array.isArray(g.groupIdInput) ? g.groupIdInput : [g.groupIdInput]
          return groupIds.map(String).includes(String(group.group_id)) ||
                 groupIdInputs.map(String).includes(String(group.group_id))
        })
        logger.debug(`[自动退群] 检查群 ${group.group_id}，是否在启用的黑名单：${isBlackListed}`)
        
        if (isBlackListed) {
          logger.debug(`[自动退群] 准备退出黑名单群${group.group_id}`)
          try {
            // 获取群信息
            let groupName = "未知"
            try {
              const groupInfo = await bot.sendApi('get_group_info', {
                group_id: group.group_id
              })
              if (groupInfo && groupInfo.data) {
                groupName = groupInfo.data.group_name
              }
            } catch (err) {
              logger.error('[自动退群] 获取群信息失败:', err)
            }

            // 发送退群通知
            const msg = [
              segment.image(`https://p.qlogo.cn/gh/${group.group_id}/${group.group_id}/0`),
              `【群组邀请管理】\n`,
              `⚠️ 退群通知\n`,
              `━━━━━━━━━━━━━━\n`,
              `📌 群组信息\n`,
              `群号：${group.group_id}\n`,
              `群名：${groupName}\n`,
              `━━━━━━━━━━━━━━\n`,
              `📢 通知内容\n`,
              `本群已被列入黑名单，机器人将自动退出。\n`,
              `━━━━━━━━━━━━━━\n`,
              `💡 如有疑问请联系机器人管理员`
            ]
            await bot.pickGroup(group.group_id).sendMsg(msg)
            
            // 等待1秒后退出
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            // 执行退群
            await bot.pickGroup(group.group_id).quit()
            logger.debug(`[自动退群] 成功退出黑名单群${group.group_id}`)
          } catch (err) {
            logger.error(`[自动退群] 退出黑名单群${group.group_id}失败:`, err)
          }
        }
      }
    } catch (error) {
      logger.error('[自动退群] 检查黑名单群失败：', error)
    }
  }
}

// 导出单例
let instance = null
export default (() => {
  if (!instance) {
    instance = new AutoQuitCheck()
  }
  return instance
})() 