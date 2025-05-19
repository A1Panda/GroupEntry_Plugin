export const notifySchemas = [
  {
    component: "Divider",
    label: "私聊配置",
    componentProps: {
      orientation: "left",
      plain: true,
    },
  },
  {
    field: "notifyUsers",
    label: "通知用户",
    bottomHelpMessage: "配置后加群相关通知会同时私聊这些用户。",
    component: "GSubForm",
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
        },
        {
          field: "remark",
          label: "备注",
          component: "Input",
          componentProps: {
            placeholder: "可选，便于识别"
          }
        }
      ],
      removeConfirm: {
        title: "确认删除",
        content: "确定要删除该通知用户吗？",
        okText: "确定",
        cancelText: "取消"
      },
      onRemove: (index, record, form) => {
        const values = form.getFieldsValue()
        if (Array.isArray(values.notifyUsers)) {
          values.notifyUsers.splice(index, 1)
          form.setFieldsValue({ notifyUsers: values.notifyUsers })
        }
      }
    }
  }
] 