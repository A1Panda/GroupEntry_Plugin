import { update as Update } from '../../other/update.js'

const PluginName = 'GroupEntry_Plugin'

export class UpdateHandler extends plugin {
  constructor() {
    super({
      name: '群组邀请管理更新',
      dsc: '调用Yunzai自带更新模块进行插件更新',
      event: 'message',
      priority: 2000,
      rule: [
        {
          reg: '^#?(群组邀请|群组管理)(插件)?(强制)?更新$',
          fnc: 'update',
          permission: 'master'
        },
        {
          reg: '^#?(群组邀请|群组管理)(插件)?(更新|updata)(日志|记录)$',
          fnc: 'update_log',
          permission: 'master'
        }
      ]
    })
  }

  async update(e) {
    e.isMaster = true
    if (e.at && !e.atme) return
    e.msg = `#${e.msg.includes('强制') ? '强制' : ''}更新${PluginName}`
    const up = new Update(e)
    up.e = e
    return up.update()
  }

  async update_log() {
    let UpdatePlugin = new Update()
    UpdatePlugin.e = this.e
    UpdatePlugin.reply = this.reply

    if (UpdatePlugin.getPlugin(PluginName)) {
      this.e.reply(await UpdatePlugin.getLog(PluginName))
    }
    return true
  }
} 