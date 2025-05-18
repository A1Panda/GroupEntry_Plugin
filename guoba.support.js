import { Config } from "./components/config.js"
import lodash from "lodash"

export function supportGuoba() {
  return {
    pluginInfo: {
      name: 'GroupEntry_Plugin',
      title: '群组邀请管理',
      author: ['@A1_Pa'],
      authorLink: ['https://github.com/A1_Pa'],
      link: 'https://github.com/A1_Pa/GroupEntry_Plugin',
      isV3: true,
      isV2: false,
      showInMenu: true,
      description: '基于 Yunzai 的群组邀请管理插件，实现更安全的加群流程',
      icon: 'fluent-emoji-flat:robot',
      iconColor: '#000000',
    },
    configInfo: {
      schemas: [
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
          bottomHelpMessage: "配置群组信息",
          component: "GSubForm",
          componentProps: {
            multiple: true,
            schemas: [
              {
                field: "groupId",
                label: "群号",
                required: true,
                component: "Input",
                componentProps: {
                  placeholder: "请输入群号",
                },
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
        },
        {
          component: "Divider",
          label: "高级设置",
          componentProps: {
            orientation: "left",
            plain: true,
          },
        },
        {
          field: "requestExpireMinutes",
          label: "过期时间(分钟)",
          component: "InputNumber",
          componentProps: {
            min: 1,
            max: 60,
            step: 1,
            placeholder: "默认5分钟",
            readonly: false
          },
          helpMessage: "加群请求超时时间，单位分钟"
        },
        {
          field: "maxPendingRequests",
          label: "最大请求数",
          component: "InputNumber",
          componentProps: {
            min: 1,
            max: 100,
            step: 1,
            placeholder: "默认20"
          },
          helpMessage: "最多同时存在的待处理加群请求数"
        }
      ],
      getConfigData() {
        const config = new Config()
        return config.loadConfig()
      },

      setConfigData(data, { Result }) {
        let config = {}
        for (let [keyPath, value] of Object.entries(data)) {
          lodash.set(config, keyPath, value)
        }

        const configInstance = new Config()
        const currentConfig = configInstance.loadConfig()
        config = lodash.merge({}, currentConfig, config)

        // 直接赋值所有数组类型的配置项
        config.groups = data['groups']

        try {
          configInstance.config = config
          configInstance.saveConfig()
          return Result.ok({}, '保存成功~')
        } catch (err) {
          return Result.ok({}, '保存失败: ' + err.message)
        }
      },
    },
  }
}