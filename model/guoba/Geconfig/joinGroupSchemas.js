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
          field: "groupName",
          label: "群名称",
          component: "Input",
          componentProps: {
            placeholder: "请输入群名称（可选）"
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
          component: "GSubForm",
          defaultValue: [],
          show: ({ mode }) => mode === 'edit',
          componentProps: {
            multiple: true,
            showRemove: true,
            showAdd: true,
            schemas: [
              {
                field: "value",
                label: "答案",
                required: true,
                component: "Input",
                componentProps: {
                  placeholder: "请输入答案"
                }
              }
            ]
          }
        },
        {
          field: "BlackList",
          label: "黑名单",
          component: "GSubForm",
          defaultValue: [],
          show: ({ mode }) => mode === 'edit',
          componentProps: {
            multiple: true,
            showRemove: true,
            showAdd: true,
            schemas: [
              {
                field: "userId",
                label: "QQ号",
                required: true,
                component: "Input",
                componentProps: {
                  placeholder: "请输入QQ号"
                }
              }
            ]
          }
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