import { Config } from "../../components/config.js"
import { getJoinGroupConfig } from "./joinGroup.js"

export async function getConfigData() {
  const config = new Config()
  const mainConfig = config.loadConfig() || {}
  // 读取 joinGroups 配置
  let joinGroups = []
  try {
    const joinGroupData = await getJoinGroupConfig()
    joinGroups = joinGroupData?.data?.joinGroups || []
  } catch (err) {
    logger.error('[群组邀请管理] 读取 JoinGroup.json 失败:', err)
  }
  return {
    ...mainConfig,
    joinGroups
  }
} 