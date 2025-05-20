import fs from 'node:fs';

if (!global.segment) {
  global.segment = (await import("oicq")).segment;
}

let ret = [];

logger.info(logger.yellow("[群组邀请管理] 正在载入插件"));

const files = fs
  .readdirSync('./plugins/GroupEntry_Plugin/apps')
  .filter((file) => file.endsWith('.js'));

files.forEach((file) => {
  ret.push(import(`./apps/${file}`))
})

ret = await Promise.allSettled(ret);

let apps = {};
for (let i in files) {
  let name = files[i].replace('.js', '');

  if (ret[i].status !== 'fulfilled') {
    logger.error(`[群组邀请管理] 载入插件错误：${logger.red(name)}`);
    logger.error(ret[i].reason);
    continue;
  }
  
  // 获取所有导出的类
  const exportedClasses = ret[i].value;
  // 将每个导出的类添加到apps对象中
  for (const className in exportedClasses) {
    apps[`${name}_${className}`] = exportedClasses[className];
  }
}

logger.info(logger.green("[群组邀请管理] 插件载入成功"));

export { apps }; 