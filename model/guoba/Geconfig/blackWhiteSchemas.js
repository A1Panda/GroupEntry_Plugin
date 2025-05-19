export const blackWhiteSchemas = [
  {
    field: "blackGroups",
    label: "自动退群黑名单",
    bottomHelpMessage: "在此列表中的群，机器人被拉入后无论如何都会自动退群。",
    component: "GSubForm",
    componentProps: {
      multiple: true,
      showRemove: true,
      schemas: [
        {
          field: "groupId",
          label: "群号（选择）",
          component: "GSelectGroup",
          componentProps: { placeholder: "点击选择群聊" }
        },
        {
          field: "groupIdInput",
          label: "群号（手动输入）",
          component: "Input",
          componentProps: { placeholder: "手动输入群号（如未选择上方群聊时使用）" }
        },
        {
          field: "remark",
          label: "备注",
          component: "Input",
          componentProps: { placeholder: "可选，便于识别" }
        },
        {
          field: "isEnabled",
          label: "是否启用",
          component: "Switch",
          defaultValue: true,
          bottomHelpMessage: "关闭后该群将不会被自动退群"
        }
      ]
    }
  },
  {
    field: "whiteGroups",
    label: "自动退群白名单",
    bottomHelpMessage: "在此列表中的群，任何人邀请机器人都不会自动退群。",
    component: "GSubForm",
    componentProps: {
      multiple: true,
      showRemove: true,
      schemas: [
        {
          field: "groupId",
          label: "群号（选择）",
          component: "GSelectGroup",
          componentProps: { placeholder: "点击选择群聊" }
        },
        {
          field: "groupIdInput",
          label: "群号（手动输入）",
          component: "Input",
          componentProps: { placeholder: "手动输入群号（如未选择上方群聊时使用）" }
        },
        {
          field: "remark",
          label: "备注",
          component: "Input",
          componentProps: { placeholder: "可选，便于识别" }
        },
        {
          field: "isEnabled",
          label: "是否启用",
          component: "Switch",
          defaultValue: true,
          bottomHelpMessage: "关闭后该群将不再受白名单保护"
        }
      ]
    }
  }
] 