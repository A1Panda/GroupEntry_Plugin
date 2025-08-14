/**
 * 适配器兼容性测试
 * 用于验证 napcat 和 icqq 的兼容性
 */

import { detectAdapter, getSegment, checkCompatibility } from './adapter.js'

export async function testAdapterCompatibility() {
  console.log('=== 适配器兼容性测试 ===')
  
  try {
    // 测试适配器检测
    console.log('1. 检测适配器类型...')
    const adapterType = await detectAdapter()
    console.log(`   检测结果: ${adapterType}`)
    
    // 测试 segment 获取
    console.log('2. 测试 segment 获取...')
    const segment = await getSegment()
    console.log(`   segment 类型: ${typeof segment}`)
    console.log(`   segment.image 函数: ${typeof segment.image}`)
    console.log(`   segment.text 函数: ${typeof segment.text}`)
    
    // 测试兼容性检查
    console.log('3. 测试兼容性检查...')
    const compatibility = await checkCompatibility()
    console.log(`   兼容性检查结果: ${compatibility}`)
    
    // 测试 segment 功能
    console.log('4. 测试 segment 功能...')
    const testImage = segment.image('test.jpg')
    const testText = segment.text('test')
    console.log(`   图片消息: ${JSON.stringify(testImage)}`)
    console.log(`   文本消息: ${JSON.stringify(testText)}`)
    
    console.log('✅ 适配器兼容性测试通过')
    return true
    
  } catch (error) {
    console.error('❌ 适配器兼容性测试失败:', error)
    return false
  }
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  testAdapterCompatibility()
}
