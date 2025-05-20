import plugin from '../../../lib/plugins/plugin.js';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'node:path';

/**
 * 原作者：千奈千祁
 * 修改者：飞舞、浅巷墨黎、一只哒
 * V3作者：A1_Panda
 * 
 * 插件发布地址：https://gitee.com/qiannqq/yunzai-plugin-JS
 * 禁止商用、倒卖等获利行为
 */

/**
 * 自动处理进群事件插件 V3.1
 * 
 * 功能说明:
 * 1. 自动处理加群申请
 * - 根据设定的问题和答案自动审核入群申请
 * - 支持精确匹配和模糊匹配两种模式
 * - 可配置多个正确答案
 * 
 * 2. 黑名单系统
 * - 支持添加/删除黑名单成员
 * - 自动拒绝黑名单成员的加群申请
 * - 可选择开启退群自动拉黑功能
 * 
 * 3. 等级检查
 * - 可设置最低入群等级要求
 * - 可选择是否启用等级检查
 * 
 * 使用方法:
 * 1. 配置文件设置(./config/JoinGroup.json)
 * - wenti: 设置入群问题
 * - ans: 设置答案列表
 * - exactMatch: 是否启用精确匹配(true/false)
 * - enableLevelCheck: 是否启用等级检查(true/false)
 * - minLevel: 最低等级要求(数字)
 * - autoBlacklistOnLeave: 是否开启退群自动拉黑(true/false)
 * 
 * 2. 管理命令
 * #加群自动同意拉黑 123456789 - 将QQ号123456789加入黑名单
 * #加群自动同意拉白 123456789 - 将QQ号123456789从黑名单移除
 * #(开启|关闭)退群自动拉黑 - 开启/关闭退群自动拉黑功能
 * 
 * 注意事项:
 * 1. 需要机器人具有群管理员权限
 * 2. 只有群主和管理员可以使用管理命令
 * 3. 配置文件修改后自动生效,无需重启
 * 4. 命令前需要加上机器人的命令前缀(默认为#)
 */


// 默认配置
const defaultConfig = {
    '511802473': {
        wenti: `你在哪里知道的这个群？`, //问题
        ans: [`github`, `gitee`, `校友帮`, `xyb`, `maimai`, `舞萌`, `QQ`], //答案
        BlackList: ["1516335938", "123122312"], //黑名单QQ 如果想配置这个 必须在外置配置文件中配置 或者使用命令配置
        exactMatch: false, //是否精确匹配
        enableLevelCheck: false, //是否启用等级检查
        minLevel: 25, //最低等级
        autoBlacklistOnLeave: true  // 添加退群自动拉黑开关，默认开启
    },
    '671783657': {
        wenti: `害怕最喜欢的皮肤是?`, //问题
        ans: [`蛙`, `绿`, `青叶蛙`, `青蛙`], //答案
        BlackList: ["1515938", "12312123", "1846002204"], //黑名单QQ 如果想配置这个 必须在外置配置文件中配置 或者使用命令配置
        exactMatch: false, //是否精确匹配
        enableLevelCheck: false, //是否启用等级检查
        minLevel: 25, //最低等级
        autoBlacklistOnLeave: true  // 添加退群自动拉黑开关，默认开启
    }
};

// 配置文件路径
const configFilePath = path.join(process.cwd(), 'plugins/GroupEntry_Plugin/config/JoinGroup.json');

// 如果配置文件不存在，则创建并写入默认配置
if (!fs.existsSync(configFilePath)) {
    fs.writeFileSync(configFilePath, JSON.stringify(defaultConfig, null, 2));
} else {
    // 读取现有配置文件
    let existingConfig;
    try {
        const fileContent = fs.readFileSync(configFilePath, 'utf-8');
        existingConfig = fileContent ? JSON.parse(fileContent) : defaultConfig;
    } catch (error) {
        console.error('读取配置文件时发生错误:', error);
        existingConfig = defaultConfig;
    }

    // 只添加新的群配置，不覆盖现有的配置
    for (const groupId in defaultConfig) {
        if (!existingConfig[groupId]) {
            existingConfig[groupId] = defaultConfig[groupId];
        } else {
            // 只确保必要的字段存在，不覆盖现有值
            if (!('autoBlacklistOnLeave' in existingConfig[groupId])) {
                existingConfig[groupId].autoBlacklistOnLeave = true;
            }
        }
    }

    // 写回更新后的配置文件
    fs.writeFileSync(configFilePath, JSON.stringify(existingConfig, null, 2));
}

// 使用外置配置
let config;
try {
    const fileContent = fs.readFileSync(configFilePath, 'utf-8');
    const parsedConfig = JSON.parse(fileContent);
    
    // 验证配置格式
    for (const groupId in parsedConfig) {
        if (!parsedConfig[groupId].wenti || !Array.isArray(parsedConfig[groupId].ans)) {
            console.error(`群${groupId}的配置格式错误，使用默认配置`);
            parsedConfig[groupId] = defaultConfig[groupId];
        }
    }
    
    config = parsedConfig;
} catch (error) {
    console.error('配置文件验证失败:', error);
    config = defaultConfig;
}

// 确保只添加一次监听器
if (!global.configFileWatcher) {
    global.configFileWatcher = true;
    fs.watchFile(configFilePath, (curr, prev) => {
        if (curr.mtime !== prev.mtime) {
            try {
                const updatedFileContent = fs.readFileSync(configFilePath, 'utf-8');
                config = updatedFileContent ? JSON.parse(updatedFileContent) : updatedFileContent;
                console.log('【自动处理进群事件插件】：配置文件已更新');
            } catch (error) {
                console.error('更新配置文件时发生错误:', error);
            }
        }
    });
}

// 处理加群申请的类
export class GroupRequestHandler extends plugin {
    constructor() {
        super({
            name: '加群申请处理',
            dsc: '',
            event: 'request.group.add',
            priority: 0,
        });
    }

    async accept(e) {
        let groupConfig = config[`${e.group_id}`];
        if (groupConfig) {
            // 处理留言内容
            let comment = e.comment || '无';
            // 如果留言包含"问题："和"答案："，则分开显示
            let questionPart = '';
            let answerPart = '';
            if (comment.includes('问题：') && comment.includes('答案：')) {
                const parts = comment.split('答案：');
                questionPart = parts[0].replace('问题：', '').trim();
                answerPart = parts[1].trim();
            }

            const msg = [
                {
                    type: 'image',
                    file: `https://q1.qlogo.cn/headimg_dl?dst_uin=${e.user_id}&spec=640`
                },
                {
                    type: 'text',
                    text: '【加群申请处理】\n' +
                        '📢 收到新的加群申请\n' +
                        '━━━━━━━━━━━━━━\n' +
                        `📝 问题：${groupConfig.wenti}\n` +
                        `👤 用户：${e.user_id}\n` +
                        (answerPart ? `💬 用户答案：${answerPart}\n` : '') +
                        (!questionPart && !answerPart ? `💬 留言：${comment}\n` : '') +
                        '━━━━━━━━━━━━━━'
                }
            ];
            await Bot.pickGroup(`${e.group_id}`).sendMsg(msg);

            // 检查黑名单
            if (groupConfig.BlackList.includes(`${e.user_id}`)) {
                await Bot.pickGroup(`${e.group_id}`).sendMsg(
                    '【加群申请处理】\n' +
                    '❌ 加群申请被拒绝\n' +
                    '━━━━━━━━━━━━━━\n' +
                    '📢 该用户已被列入黑名单\n' +
                    `👤 用户：${e.user_id}\n` +
                    '━━━━━━━━━━━━━━'
                );
                e.approve(false);
                return false;
            }

            try {
                // 等级检查
                if (groupConfig.enableLevelCheck) {
                    const response = await fetch(`https://apis.kit9.cn/api/qq_material/api.php?qq=${e.user_id}`, {
                        timeout: 5000  // 添加5秒超时
                    }).catch(async err => {
                        await Bot.pickGroup(`${e.group_id}`).sendMsg(
                            '【加群申请处理】\n' +
                            '⚠️ 处理异常\n' +
                            '━━━━━━━━━━━━━━\n' +
                            '📢 获取用户信息超时\n' +
                            `👤 用户：${e.user_id}\n` +
                            '💡 请稍后重试\n' +
                            '━━━━━━━━━━━━━━'
                        );
                        return null;
                    });

                    if (!response) return false;

                    const data = await response.json();

                    if (!data?.data?.level) {
                        await Bot.pickGroup(`${e.group_id}`).sendMsg(
                            '【加群申请处理】\n' +
                            '❌ 加群申请被拒绝\n' +
                            '━━━━━━━━━━━━━━\n' +
                            '📢 无法获取用户等级信息\n' +
                            `👤 用户：${e.user_id}\n` +
                            '━━━━━━━━━━━━━━'
                        );
                        return false;
                    }

                    const userLevel = parseInt(data.data.level);
                    if (userLevel < groupConfig.minLevel) {
                        await Bot.pickGroup(`${e.group_id}`).sendMsg(
                            '【加群申请处理】\n' +
                            '❌ 加群申请被拒绝\n' +
                            '━━━━━━━━━━━━━━\n' +
                            '📢 用户等级未达到要求\n' +
                            `👤 用户：${e.user_id}\n` +
                            `📊 当前等级：${userLevel}\n` +
                            `📊 要求等级：${groupConfig.minLevel}\n` +
                            '━━━━━━━━━━━━━━'
                        );
                        return false;
                    }
                }

                // 答案检查
                const userAnswer = e.comment?.trim().toLowerCase(); // 转小写
                if (!userAnswer) {
                    await Bot.pickGroup(`${e.group_id}`).sendMsg(
                        '【加群申请处理】\n' +
                        '❌ 加群申请被拒绝\n' +
                        '━━━━━━━━━━━━━━\n' +
                        '📢 未检测到答案\n' +
                        `👤 用户：${e.user_id}\n` +
                        '💡 请重新申请并填写答案\n' +
                        '━━━━━━━━━━━━━━'
                    );
                    return false;
                }

                if (groupConfig.ans.some(ans => 
                    groupConfig.exactMatch ? 
                    userAnswer === ans.toLowerCase() : 
                    userAnswer.includes(ans.toLowerCase())
                )) {
                    const successMsg = groupConfig.enableLevelCheck ? 
                        '【加群申请处理】\n' +
                        '✅ 加群申请已通过\n' +
                        '━━━━━━━━━━━━━━\n' +
                        '📢 答案正确且等级符合要求\n' +
                        `👤 用户：${e.user_id}\n` +
                        '━━━━━━━━━━━━━━' :
                        '【加群申请处理】\n' +
                        '✅ 加群申请已通过\n' +
                        '━━━━━━━━━━━━━━\n' +
                        '📢 答案正确\n' +
                        `👤 用户：${e.user_id}\n` +
                        '━━━━━━━━━━━━━━';
                    await Bot.pickGroup(`${e.group_id}`).sendMsg(successMsg);
                    e.approve(true);
                    return false;
                }

                await Bot.pickGroup(`${e.group_id}`).sendMsg(
                    '【加群申请处理】\n' +
                    '❌ 加群申请被拒绝\n' +
                    '━━━━━━━━━━━━━━\n' +
                    '📢 答案错误\n' +
                    `👤 用户：${e.user_id}\n` +
                    '💡 请检查答案是否正确后重新申请\n' +
                    '━━━━━━━━━━━━━━'
                );
            } catch (error) {
                console.error('处理加群申请时发生错误：', error);
                await Bot.pickGroup(`${e.group_id}`).sendMsg(
                    '【加群申请处理】\n' +
                    '⚠️ 处理异常\n' +
                    '━━━━━━━━━━━━━━\n' +
                    '📢 验证过程发生错误\n' +
                    `👤 用户：${e.user_id}\n` +
                    '💡 请稍后重试\n' +
                    '━━━━━━━━━━━━━━'
                );
                return false;
            }
        }
        return false;
    }
}

// 处理拉黑和拉白的类
export class GroupJoinHandler extends plugin {
    constructor() {
        super({
            name: '加群申请处理拉黑',
            desc: '拉黑拉白',
            event: 'message',
            priority: 5000,
            rule: [
                {
                    reg: '^#加群自动同意拉白.*',
                    fnc: 'Whitening'
                },
                {
                    reg: '^#加群自动同意拉黑.*',
                    fnc: 'Blocking'
                },
                {
                    reg: '^#(开启|关闭)退群自动拉黑$',
                    fnc: 'toggleAutoBlacklist'
                }
            ]
        });
    }

    async Blocking(e) {
        await this.modifyBlacklist(e, 'add');
    }

    async Whitening(e) {
        await this.modifyBlacklist(e, 'remove');
    }

    async modifyBlacklist(e, action) {
        try {
            const memberInfo = await Bot.pickMember(e.group_id, e.user_id);
            if (['owner', 'admin'].includes(memberInfo.role) || e.isMaster) {
                if (!e.isGroup) {
                    e.reply('该功能仅限群聊');
                    return;
                }

                let userId;
                const atUser = e.message.filter(item => item.type === 'at')[0];
                if (atUser) {
                    userId = atUser.qq || atUser.data?.qq;
                } else {
                    const qqMatch = e.msg.match(/\d{5,}/);
                    if (qqMatch) {
                        userId = qqMatch[0];
                    }
                }

                if (userId) {
                    const groupConfig = config[`${e.group_id}`];
                    if (groupConfig) {
                        let groupBlackList = groupConfig.BlackList || [];
                        if (action === 'add' && !groupBlackList.includes(`${userId}`)) {
                            groupBlackList.push(`${userId}`);
                            e.reply(`${userId}该用户已成功拉黑`);
                        } else if (action === 'remove' && groupBlackList.includes(`${userId}`)) {
                            groupBlackList = groupBlackList.filter(item => item !== `${userId}`);
                            e.reply(`${userId}该用户已成功拉白`);
                        } else {
                            e.reply(action === 'add' ? '该用户已在黑名单中' : '该用户不在黑名单中');
                        }
                        groupConfig.BlackList = groupBlackList;
                        fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));
                    } else {
                        e.reply('未找到该群的配置信息');
                    }
                } else {
                    e.reply(`请@需要${action === 'add' ? '拉黑' : '拉白'}的用户或输入QQ号`);
                }
            } else {
                e.reply('您没有权限拉黑或者拉白。');
            }
        } catch (error) {
            console.error('发生错误:', error);
            e.reply('操作失败，请稍后再试或联系管理员。');
        }
    }

    // 添加新方法处理开关命令
    async toggleAutoBlacklist(e) {
        try {
            const memberInfo = await Bot.pickMember(e.group_id, e.user_id);
            if (!['owner', 'admin'].includes(memberInfo.role) && !e.isMaster) {
                e.reply('只有群主或管理员才能操作此功能');
                return;
            }

            if (!e.isGroup) {
                e.reply('该功能仅限群聊使用');
                return;
            }

            const groupConfig = config[`${e.group_id}`];
            if (!groupConfig) {
                e.reply('当前群未配置自动处理功能');
                return;
            }

            const isEnable = e.msg.includes('开启');
            groupConfig.autoBlacklistOnLeave = isEnable;

            // 保存配置
            fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));

            e.reply(`已${isEnable ? '开启' : '关闭'}退群自动拉黑功能`);
        } catch (error) {
            console.error('切换退群自动拉黑状态失败:', error);
            e.reply('操作失败，请稍后重试');
        }
    }
}

// 添加处理退群事件的类
export class GroupLeaveHandler extends plugin {
    constructor() {
        super({
            name: '退群自动拉黑',
            dsc: '退群自动加入黑名单',
            event: 'notice.group.decrease',
            priority: 5000
        });
    }

    async accept(e) {
        // 检查是否是配置过的群
        let groupConfig = config[`${e.group_id}`];
        if (!groupConfig) return false;

        // 检查是否开启了退群自动拉黑
        if (!groupConfig.autoBlacklistOnLeave) {
            return false;
        }

        // 获取退群用户的QQ
        const userId = `${e.user_id}`;
        
        // 如果已经在黑名单中，就不需要再添加
        if (groupConfig.BlackList.includes(userId)) {
            return false;
        }

        try {
            // 将用户添加到黑名单
            groupConfig.BlackList.push(userId);
            
            // 保存更新后的配置到文件
            fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));

            // 发送通知消息
            Bot.pickGroup(e.group_id).sendMsg(
                '【加群申请处理】\n' +
                '⚠️ 用户退群通知\n' +
                '━━━━━━━━━━━━━━\n' +
                `👤 用户：${userId}\n` +
                '📢 已自动加入黑名单\n' +
                '━━━━━━━━━━━━━━'
            );

            return true;
        } catch (error) {
            console.error('退群自动拉黑处理失败:', error);
            return false;
        }
    }
}