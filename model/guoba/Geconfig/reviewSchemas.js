export const reviewSchemas = [
  {
    label: '群邀请审核',
    component: 'SOFT_GROUP_BEGIN'
  },
  {
    field: "allowInviterConfirm",
    label: "邀请者确认加群",
    bottomHelpMessage: "关闭后邀请者本人无法同意自己的加群请求，只能由群主或管理员同意。",
    component: "Switch",
    defaultValue: true
  },
  {
    component: "Divider",
    label: "审核设置",
    componentProps: {
      orientation: "left",
      plain: true,
    },
  },
  {
    field: "reviewMode",
    label: "加群审核模式",
    bottomHelpMessage: "0-自动同意 1-关闭不处理 2-需审核(默认) 3-自动拒绝",
    component: "Select",
    defaultValue: 2,
    componentProps: {
      options: [
        { label: "自动同意加群", value: 0 },
        { label: "关闭（不处理）", value: 1 },
        { label: "需审核", value: 2 },
        { label: "自动拒绝加群", value: 3 }
      ]
    }
  },
  {
    field: "requestExpireMinutes",
    label: "过期时间(分钟)",
    bottomHelpMessage: "加群请求超时时间，单位分钟",
    component: "InputNumber",
    componentProps: {
      min: 1,
      max: 60,
      step: 1,
      placeholder: "默认5分钟",
      readonly: false
    }
  },
  {
    field: "maxPendingRequests",
    label: "最大请求数",
    bottomHelpMessage: "最多同时存在的待处理加群请求数",
    component: "InputNumber",
    componentProps: {
      min: 1,
      max: 100,
      step: 1,
      placeholder: "默认20"
    }
  }
] 