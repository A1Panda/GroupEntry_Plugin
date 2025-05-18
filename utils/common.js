import fs from 'node:fs'
import path from 'node:path'

export const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

export const readJSON = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (err) {
    logger.error(`[群组邀请管理] 读取JSON文件失败: ${filePath}`, err)
    return null
  }
}

export const writeJSON = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
    return true
  } catch (err) {
    logger.error(`[群组邀请管理] 写入JSON文件失败: ${filePath}`, err)
    return false
  }
}

// 验证码存储
const verifyCodes = new Map()

export const generateVerifyCode = (sourceGroupId) => {
  // 生成6位数字验证码
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  // 存储验证码，设置5分钟过期
  verifyCodes.set(code, {
    sourceGroupId,
    expireTime: Date.now() + 5 * 60 * 1000
  })
  return code
}

export const verifyCode = (code) => {
  const verifyInfo = verifyCodes.get(code)
  if (!verifyInfo) return false
  
  // 检查是否过期
  if (Date.now() > verifyInfo.expireTime) {
    verifyCodes.delete(code)
    return false
  }
  
  // 验证码正确则删除
  verifyCodes.delete(code)
  return verifyInfo.sourceGroupId
}

export const formatDate = () => {
  const now = new Date()
  return now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
} 