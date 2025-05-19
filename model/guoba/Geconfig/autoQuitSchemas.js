export const autoQuitSchemas = [
  {
    label: "自动退群",
    component: "SOFT_GROUP_BEGIN",
  },
  {
    component: "Divider",
    label: "退群设置",
    componentProps: {
      orientation: "left",
      plain: true,
    },
  },
  {
    field: "autoQuitEnabled",
    label: "自动退群开关",
    bottomHelpMessage: "关闭后机器人不会自动退群",
    component: "Switch",
    defaultValue: true
  },
  {
    field: "autoQuitCron",
    label: "定时检查频率",
    bottomHelpMessage: "设置自动检查黑名单群的频率，支持标准Cron表达式",
    helpMessage: "修改后重启生效，常用示例：*/1 * * * *（每分钟），*/5 * * * *（每5分钟），0 0 * * *（每天0点）",
    component: "EasyCron",
    componentProps: {
      placeholder: "请输入Cron表达式"
    }
  },
  {
    field: "minGroupMember",
    label: "最小成员数",
    bottomHelpMessage: "退群判断的成员数阈值，低于该值将自动退群",
    component: "InputNumber",
    componentProps: {
      min: 1,
      max: 100,
      step: 1,
      placeholder: "默认10"
    }
  },
  {
    field: "autoQuitMsg",
    label: "退群通知内容",
    bottomHelpMessage: "支持变量：{memberCount}、{minMember}、{groupIds}",
    extra: "机器人自动退群时发送的消息，可用变量：{memberCount}（当前成员数）、{minMember}（阈值）、{groupIds}（所有启用的管理群号）",
    component: "Input",
    componentProps: {
      placeholder: "支持变量：{memberCount}、{minMember}、{groupIds}",
      maxlength: 100
    }
  },
  {
    field: "allowAdminInvite",
    label: "管理邀请免退群",
    bottomHelpMessage: "开启后群主和管理员邀请机器人时不会自动退群，关闭则只有主人邀请才不会退群。",
    component: "Switch",
    defaultValue: false
  }
] 