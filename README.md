# 群组邀请管理插件

一个适用于 Yunzai-Bot 的高安全性群组邀请管理插件，支持灵活配置、锅巴面板可视化管理，适合多群机器人场景下的加群审核与风控。

---

## ✨ 功能亮点

- **🎯 加群请求需审核**：机器人被邀请进群时，需邀请者、群主或管理员在群内"引用通知消息"并发送 `#确认加群` 或 `#拒绝加群`，方可处理。
- **👥 多群支持**：可配置多个管理群，灵活启用/禁用。
- **⏰ 请求过期自动清理**：加群请求有自定义时效，超时自动失效，防止积压。
- **📱 私聊通知邀请人**：加群请求被处理后，自动私聊通知邀请人处理结果。
- **🎨 锅巴面板可视化配置**：支持通过锅巴面板管理群组、设置请求过期时间、最大待处理数等。
- **🔄 配置热更新与兼容**：支持自动合并新配置项，升级无忧。
- **📝 详细日志与错误提示**：便于排查和维护。

---

## 📥 安装方法

### 方式一：使用 git clone（推荐）

在 Yunzai-Bot 根目录下执行以下命令：

```bash
git clone https://github.com/A1Panda/GroupEntry_Plugin.git ./plugins/GroupEntry_Plugin/
```

### 方式二：手动安装

1. 下载本仓库的 ZIP 文件
2. 解压后将 `GroupEntry_Plugin` 文件夹放入 Yunzai-Bot 的 `plugins` 目录下

### 安装后操作

1. 重启 Yunzai-Bot 或发送 `#群组邀请更新` 命令
2. 使用锅巴面板进行可视化配置（强烈推荐）

---

## ⚙️ 配置说明

插件配置文件位于 `config/config.json`，默认配置参考 `config/defaultConfig.json`。  
# 强烈建议你使用锅巴进行配置！！！

### 主要配置项
```json
{
  "groups": [],
  "notifyUsers": [],
  "pendingRequests": [],
  "requestExpireMinutes": 5,
  "maxPendingRequests": 20,
  "minGroupMember": 100,
  "autoQuitEnabled": true,
  "autoQuitMsg": "本群成员数仅({memberCount}人)，未达到最低要求（{minMember}人），机器人将自动退出。\n\n管理群号：{groupIds}",
  "reviewMode": 2,
  "allowAdminInvite": false,
  "allowInviterConfirm": true,
  "blackGroups": [],
  "whiteGroups": [],
  "autoQuitCron": "0 0 * * * ? *"
} 
```

### 配置项说明
- `groups`：管理的群组列表，可多选。
- `notifyUsers`：额外通知的用户列表
- `isEnabled`：是否启用该群组的加群管理。
- `requestExpireMinutes`：加群请求的过期时间，超时自动失效。
- `maxPendingRequests`：最多同时存在的待处理加群请求数。
- `minGroupMember`：群成员数最低要求
- `autoQuitEnabled`：是否启用自动退群
- `autoQuitMsg`：自动退群提示消息
- `reviewMode`：审核模式
- `allowAdminInvite`：是否允许管理员邀请
- `allowInviterConfirm`：是否允许邀请者确认
- `blackGroups`：黑名单群组
- `whiteGroups`：白名单群组
- `autoQuitCron`：自动退群定时任务

### 配置自动合并
升级插件或增加新字段时，用户配置会自动补全，无需手动修改。

---

## 🎨 锅巴面板支持

- 群组列表可视化增删改
- 过期时间、最大请求数可视化设置
- 支持热更新与保存
- 字段说明清晰，界面简洁美观

---

## 📋 使用流程

1. **邀请机器人进群**
2. 机器人在目标群发送加群请求通知
3. 邀请者、群主或管理员"引用"该通知消息并回复 `#确认加群` 或 `#拒绝加群`
4. 机器人自动处理请求，并私聊通知邀请人结果
5. 超时未处理的请求自动失效

---

## ❓ 常见问题与建议

### Q: 配置项升级后会不会丢失？
A: 不会，插件自动合并新字段，老用户无需手动修改 config.json。

### Q: 锅巴面板保存后配置不生效？
A: 请刷新页面或重启 Yunzai-Bot。

### Q: 如何只允许部分群管理？
A: 只需在 `groups` 中启用对应群组即可。

### Q: 支持多机器人多群场景吗？
A: 完全支持。

---

## 🔄 更新与维护

- 支持 `#群组邀请更新`、`#群组邀请强制更新`、`#群组邀请更新日志` 等命令一键升级插件
- 建议将 `config/config.json`、`config/defaultConfig.json` 加入 `.gitignore`，避免敏感信息泄露
- 日志详细，便于排查问题

---

## 🤝 贡献与反馈

- 作者：[@A1_Panda](https://github.com/A1Panda)
- 插件主页：[GitHub](https://github.com/A1Panda/GroupEntry_Plugin)
- 欢迎 issue、PR、建议与交流！

---

## 📝 开发计划

- [ ] 通知事件-支持设置群/好友通知
- [ ] 群邀请审核通知-新增邀请者同意开关
- [ ] 进群事件迁移到该插件
- [ ] 支持黑白名单控制（联动积分）