import fs from 'node:fs'
import path from 'node:path'
import { joinGroupSchemas } from './Geconfig/joinGroupSchemas.js'

// 修改配置文件路径，使用相对于插件根目录的路径
const configPath = path.join(process.cwd(), 'plugins/GroupEntry_Plugin/config/JoinGroup.json')

// 读取配置文件
function getJoinGroupData() {
  try {
    if (!fs.existsSync(configPath)) {
      logger.debug('[群组邀请管理] JoinGroup.json 文件不存在，返回空数组')
      return { joinGroups: [] }
    }
    const data = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    logger.debug('[群组邀请管理] 读取到的原始 JoinGroup.json 数据:', JSON.stringify(data))
    // 转换数据格式以适应锅巴面板，兼容字符串数组和对象数组
    const joinGroups = Object.entries(data).map(([groupId, config]) => {
      const groupIdStr = String(groupId)
      // ans 兼容字符串数组和对象数组
      let ansArr = []
      if (Array.isArray(config.ans)) {
        if (typeof config.ans[0] === 'object') {
          ansArr = config.ans.map(item => ({ value: item.value || item }))
        } else {
          ansArr = config.ans.map(value => ({ value }))
        }
      }
      // BlackList 兼容字符串数组和对象数组
      let blackArr = []
      if (Array.isArray(config.BlackList)) {
        if (typeof config.BlackList[0] === 'object') {
          blackArr = config.BlackList.map(item => ({ userId: item.userId || item }))
        } else {
          blackArr = config.BlackList.map(userId => ({ userId }))
        }
      }
      const groupConfig = {
        groupId: groupIdStr,
        groupName: config.groupName || `群${groupIdStr}`,
        wenti: config.wenti || '',
        ans: ansArr,
        BlackList: blackArr,
        exactMatch: Boolean(config.exactMatch),
        enableLevelCheck: Boolean(config.enableLevelCheck),
        minLevel: Number(config.minLevel) || 25,
        autoBlacklistOnLeave: Boolean(config.autoBlacklistOnLeave)
      }

      // 如果是特殊群号（如stdin），添加特殊标记
      if (groupIdStr === 'stdin') {
        groupConfig.groupName = '默认配置'
        groupConfig.isDefault = true
      }

      return groupConfig
    })

    // 按群号排序，特殊群号（如stdin）放在最后
    joinGroups.sort((a, b) => {
      if (a.groupId === 'stdin') return 1
      if (b.groupId === 'stdin') return -1
      return a.groupId.localeCompare(b.groupId)
    })

    logger.mark('[群组邀请管理] 转换后的 joinGroups 数据:', JSON.stringify(joinGroups))
    return { joinGroups }
  } catch (err) {
    logger.error('[群组邀请管理] 读取JoinGroup.json失败:', err)
    return { joinGroups: [] }
  }
}

// 保存配置文件
function setJoinGroupData(data) {
  try {
    logger.mark('[群组邀请管理] setJoinGroupData 入参:', JSON.stringify(data))
    // 验证数据格式
    if (!data || !Array.isArray(data.joinGroups)) {
      logger.error('[群组邀请管理] 无效的加群配置数据格式')
      return false
    }

    // 读取现有配置，以保留未在面板中修改的群配置
    let existingConfig = {}
    try {
      if (fs.existsSync(configPath)) {
        existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'))
      }
    } catch (err) {
      logger.warn('[群组邀请管理] 读取现有配置失败，将创建新配置:', err)
    }

    // 转换数据格式以适应配置文件
    const config = { ...existingConfig } // 保留现有配置
    data.joinGroups.forEach(group => {
      if (group && group.groupId) {
        // 保证groupId为字符串
        const groupIdStr = String(group.groupId)
        // 保持原有的数据结构
        config[groupIdStr] = {
          groupName: group.groupName || `群${groupIdStr}`,
          wenti: group.wenti || '',
          // ans 只保存为字符串数组
          ans: Array.isArray(group.ans) ? group.ans.map(item => typeof item === 'object' ? (item.value || '') : String(item)).filter(Boolean) : [],
          // BlackList 只保存为字符串数组
          BlackList: Array.isArray(group.BlackList) ? group.BlackList.map(item => typeof item === 'object' ? (item.userId || '') : String(item)).filter(Boolean) : [],
          exactMatch: Boolean(group.exactMatch),
          enableLevelCheck: Boolean(group.enableLevelCheck),
          minLevel: Number(group.minLevel) || 25,
          autoBlacklistOnLeave: Boolean(group.autoBlacklistOnLeave)
        }

        // 验证必要字段
        if (!config[groupIdStr].wenti) {
          logger.warn(`[群组邀请管理] 群${groupIdStr}的问题为空，将使用默认值`)
          config[groupIdStr].wenti = '请输入加群问题'
        }
        if (!Array.isArray(config[groupIdStr].ans) || config[groupIdStr].ans.length === 0) {
          logger.warn(`[群组邀请管理] 群${groupIdStr}的答案列表为空，将使用默认值`)
          config[groupIdStr].ans = ['默认答案']
        }
      }
    })

    // 确保目录存在
    const dir = path.dirname(configPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    // 保存配置文件，保持原有的格式
    const jsonStr = JSON.stringify(config, null, 2)
    fs.writeFileSync(configPath, jsonStr)
    
    // 验证保存的文件
    try {
      const savedData = JSON.parse(fs.readFileSync(configPath, 'utf8'))
      logger.mark('[群组邀请管理] 实际保存后的 JoinGroup.json 数据:', JSON.stringify(savedData))
      if (Object.keys(savedData).length === 0) {
        logger.warn('[群组邀请管理] 保存的配置文件为空')
      }
    } catch (err) {
      logger.error('[群组邀请管理] 验证保存的配置文件失败:', err)
      return false
    }

    return true
  } catch (err) {
    logger.error('[群组邀请管理] 保存JoinGroup.json失败:', err)
    return false
  }
}

export async function getJoinGroupConfig() {
  const data = getJoinGroupData()
  return {
    schemas: joinGroupSchemas,
    data
  }
}

export async function setJoinGroupConfig(data, { Result }) {
  if (!data || !Array.isArray(data.joinGroups)) {
    logger.error('[群组邀请管理] 无效的加群配置数据格式:', data)
    return Result.error('无效的加群配置数据格式')
  }

  logger.debug('[群组邀请管理] 保存加群配置:', data)
  if (setJoinGroupData(data)) {
    return Result.ok({}, 'Ciallo～(∠・ω< )⌒☆')
  } else {
    return Result.error('保存失败，请查看日志')
  }
} 