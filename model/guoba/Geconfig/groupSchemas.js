export const groupSchemas = [
  {
    label: '通知管理',
    component: 'SOFT_GROUP_BEGIN'
  },
  {
    component: "Divider",
    label: "群组配置",
    componentProps: {
      orientation: "left",
      plain: true,
    },
  },
  {
    field: "groups",
    label: "群组列表",
    bottomHelpMessage: "配置你的管理群（这里之后会接收加群请求）",
    component: "GSubForm",
    componentProps: {
      multiple: true,
      schemas: [
        {
          field: "groupId",
          label: "群号",
          required: true,
          component: "GSelectGroup",
          componentProps: {
            placeholder: "点击选择群聊"
          }
        },
        {
          field: "groupName",
          label: "群名称",
          required: true,
          component: "Input",
          componentProps: {
            placeholder: "请输入群名称",
          },
        },
        {
          field: "isEnabled",
          label: "是否启用",
          component: "Switch",
          defaultValue: true,
        }
      ],
    },
  }
] 