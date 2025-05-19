export const joinGroupSchemas = [
  {
    label: '加群配置',
    component: 'SOFT_GROUP_BEGIN'
  },
  {
    component: "Divider",
    label: "加群配置",
    componentProps: {
      orientation: "left",
      plain: true,
    },
  },
  {
    field: "joinGroups",
    label: "群组配置",
    bottomHelpMessage: "配置每个群的加群问题、答案、黑名单等设置。",
    component: "GSubForm",
    componentProps: {
      multiple: true,
      showRemove: true,
      showAdd: true,
      schemas: [
        {
          field: "groupId",
          label: "群号",
          required: true,
          component: "GSelectGroup",
          componentProps: {
            placeholder: "点击选择群聊或手动输入",
            allowInput: true
          }
        },
        {
          field: "wenti",
          label: "加群问题",
          required: true,
          component: "Input",
          componentProps: {
            placeholder: "请输入加群问题"
          }
        },
        {
          field: "ans",
          label: "答案列表",
          required: true,
          component: "GTags",
          componentProps: {
            placeholder: "请输入答案，回车添加，可批量粘贴"
          },
          show: ({ mode }) => mode === 'edit'
        },
        {
          field: "BlackList",
          label: "黑名单",
          component: "GTags",
          componentProps: {
            placeholder: "请输入QQ号，回车添加，可批量粘贴"
          },
          show: ({ mode }) => mode === 'edit'
        },
        {
          field: "exactMatch",
          label: "精确匹配",
          component: "Switch",
          defaultValue: false
        },
        {
          field: "enableLevelCheck",
          label: "等级检查",
          component: "Switch",
          defaultValue: false
        },
        {
          field: "minLevel",
          label: "最低等级",
          component: "InputNumber",
          defaultValue: 25,
          componentProps: {
            min: 1,
            max: 100
          }
        },
        {
          field: "autoBlacklistOnLeave",
          label: "退群自动拉黑",
          component: "Switch",
          defaultValue: true
        }
      ]
    }
  }
] 