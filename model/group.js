export class Group {
  constructor(data = {}) {
    this.groupId = data.groupId || ''           // 群号
    this.groupName = data.groupName || ''       // 群名称
    this.adminQQ = data.adminQQ || ''           // 管理员QQ
    this.isEnabled = data.isEnabled || false    // 是否启用验证码功能
    this.lastUpdate = data.lastUpdate || ''     // 最后更新时间
    this.isSourceGroup = data.isSourceGroup || false  // 是否为验证码来源群组
  }

  static fromJSON(json) {
    return new Group(json)
  }

  toJSON() {
    return {
      groupId: this.groupId,
      groupName: this.groupName,
      adminQQ: this.adminQQ,
      isEnabled: this.isEnabled,
      lastUpdate: this.lastUpdate,
      isSourceGroup: this.isSourceGroup
    }
  }
} 