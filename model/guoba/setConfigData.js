import { Config } from "../../components/config.js"
import lodash from "lodash"
import { setJoinGroupConfig } from "./joinGroup.js"

export async function setConfigData(data, { Result }) {
  // 分离joinGroup配置和其他配置
  const joinGroupData = {}
  const otherData = {}
  
  for (let [keyPath, value] of Object.entries(data)) {
    // 检查是否是joinGroup相关的配置
    if (keyPath === 'joinGroups') {
      joinGroupData.joinGroups = value
    } else {
      // 特殊处理数组类型的配置项
      if (keyPath === 'notifyUsers' || keyPath === 'groups' || keyPath === 'blackGroups' || keyPath === 'whiteGroups') {
        otherData[keyPath] = value || [] // 确保是数组，如果为null或undefined则设为空数组
      } else {
        lodash.set(otherData, keyPath, value)
      }
    }
  }

  // 如果有joinGroup配置，单独处理
  if (joinGroupData.joinGroups) {
    try {
      // 确保joinGroups是数组
      if (!Array.isArray(joinGroupData.joinGroups)) {
        joinGroupData.joinGroups = []
      }
      await setJoinGroupConfig(joinGroupData, { Result })
    } catch (err) {
      logger.error('[群组邀请管理] 保存加群配置失败:', err)
      return Result.error('保存加群配置失败: ' + err.message)
    }
  }

  // 处理其他配置
  if (Object.keys(otherData).length > 0) {
    const configInstance = new Config()
    const currentConfig = configInstance.loadConfig()
    
    // 合并配置，但保持数组类型配置项的独立性
    const config = lodash.merge({}, currentConfig, otherData)
    
    // 确保数组类型配置项使用新值
    if (otherData.notifyUsers !== undefined) config.notifyUsers = otherData.notifyUsers
    if (otherData.groups !== undefined) config.groups = otherData.groups
    if (otherData.blackGroups !== undefined) config.blackGroups = otherData.blackGroups
    if (otherData.whiteGroups !== undefined) config.whiteGroups = otherData.whiteGroups

    try {
      configInstance.config = config
      configInstance.saveConfig()
    } catch (err) {
      logger.error('[群组邀请管理] 保存其他配置失败:', err)
      return Result.error('保存其他配置失败: ' + err.message)
    }
  }

  return Result.ok({}, 'Ciallo～(∠・ω< )⌒☆')
} 