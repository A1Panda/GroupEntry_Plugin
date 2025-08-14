# 适配器兼容性说明

## 概述

本插件已升级为同时支持 **napcat** 和 **icqq** 适配器，实现了真正的跨适配器兼容。

## 支持的适配器

### 1. napcat (基于 oicq)
- 传统的 Yunzai-Bot 适配器
- 基于 oicq 库
- 稳定可靠，功能完整

### 2. icqq
- 新一代 QQ 机器人适配器
- 更好的性能和稳定性
- 支持更多新特性

## 自动检测机制

插件启动时会自动检测当前环境中的适配器类型：

1. **优先检测 icqq** - 如果检测到 icqq 库，则使用 icqq 适配器
2. **回退到 oicq** - 如果 icqq 不可用，则使用 oicq (napcat 兼容)
3. **兼容模式** - 如果都不可用，使用内置的兼容模式

## 适配器差异处理

### API 调用差异

| 功能 | napcat (oicq) | icqq | 统一接口 |
|------|---------------|------|----------|
| 发送 API | `bot.sendApi()` | `bot.pickUser().api()` | `botAdapter.sendApi()` |
| 获取群 | `bot.pickGroup()` | `bot.pickGroup()` | `botAdapter.pickGroup()` |
| 获取好友 | `bot.pickFriend()` | `bot.pickUser()` | `botAdapter.pickFriend()` |
| 获取成员 | `bot.pickMember()` | `group.pickMember()` | `botAdapter.pickMember()` |

### Segment 差异

| 功能 | napcat (oicq) | icqq | 统一接口 |
|------|---------------|------|----------|
| 图片消息 | `segment.image()` | `segment.image()` | `segment.image()` |
| 文本消息 | `segment.text()` | `segment.text()` | `segment.text()` |
| @用户 | `segment.at()` | `segment.at()` | `segment.at()` |
| 回复消息 | `segment.reply()` | `segment.reply()` | `segment.reply()` |

## 使用方法

### 1. 安装插件
```bash
git clone https://github.com/A1Panda/GroupEntry_Plugin.git ./plugins/GroupEntry_Plugin/
```

### 2. 重启 Yunzai-Bot
插件会自动检测适配器类型并输出日志：
```
[群组邀请管理] 检测到适配器类型: icqq
[群组邀请管理] 使用 icqq 适配器
```

### 3. 验证兼容性
```bash
node utils/test-adapter.js
```

## 测试结果示例

### icqq 环境
```
=== 适配器兼容性测试 ===
1. 检测适配器类型...
   检测结果: icqq
2. 测试 segment 获取...
   segment 类型: object
   segment.image 函数: function
   segment.text 函数: function
3. 测试兼容性检查...
   兼容性检查结果: icqq
4. 测试 segment 功能...
   图片消息: {"type":"image","file":"test.jpg"}
   文本消息: {"type":"text","text":"test"}
✅ 适配器兼容性测试通过
```

### napcat 环境
```
=== 适配器兼容性测试 ===
1. 检测适配器类型...
   检测结果: oicq
2. 测试 segment 获取...
   segment 类型: object
   segment.image 函数: function
   segment.text 函数: function
3. 测试兼容性检查...
   兼容性检查结果: oicq
4. 测试 segment 功能...
   图片消息: {"type":"image","file":"test.jpg"}
   文本消息: {"type":"text","text":"test"}
✅ 适配器兼容性测试通过
```

## 故障排除

### 1. 适配器检测失败
如果出现适配器检测失败的情况，插件会使用默认的兼容模式：
```
[群组邀请管理] 获取 segment 失败: Error
[群组邀请管理] 使用默认兼容模式
```

### 2. API 调用失败
如果某个 API 调用失败，插件会记录详细错误信息：
```
[群组邀请管理] API 调用失败 [get_group_info]: Error
```

### 3. 功能异常
如果发现功能异常，请检查：
1. 适配器是否正确安装
2. 插件版本是否最新
3. 运行兼容性测试

## 升级说明

### 从旧版本升级
1. 备份配置文件
2. 更新插件代码
3. 重启 Yunzai-Bot
4. 插件会自动适配新的适配器

### 配置文件兼容性
- 所有现有配置文件完全兼容
- 无需修改任何配置
- 功能保持不变

## 技术实现

### 适配器层设计
```javascript
// 统一的 Bot API 调用接口
export class BotAdapter {
  constructor(bot) {
    this.bot = bot
    this.adapterType = null
    this.init()
  }
  
  // 统一的 sendApi 方法
  async sendApi(action, params = {}) {
    if (this.adapterType === 'icqq') {
      return await this.bot.pickUser(this.bot.uin)[action](params)
    } else {
      return await this.bot.sendApi(action, params)
    }
  }
}
```

### 自动检测机制
```javascript
export async function detectAdapter() {
  try {
    const icqq = await import('icqq')
    if (icqq) return 'icqq'
  } catch (e) {}
  
  try {
    const oicq = await import('oicq')
    if (oicq) return 'oicq'
  } catch (e) {}
  
  return 'oicq' // 默认
}
```

## 总结

通过适配器层的设计，本插件实现了真正的跨适配器兼容：

✅ **自动检测** - 无需手动配置  
✅ **无缝切换** - 功能完全一致  
✅ **向后兼容** - 现有配置无需修改  
✅ **错误处理** - 完善的异常处理机制  
✅ **性能优化** - 最小化性能开销  

无论您使用 napcat 还是 icqq，都能获得相同的功能和体验。
