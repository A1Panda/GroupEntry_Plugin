import { pluginInfo } from './Geconfig/pluginInfo.js'
import { groupSchemas } from './Geconfig/groupSchemas.js'
import { notifySchemas } from './Geconfig/notifySchemas.js'
import { reviewSchemas } from './Geconfig/reviewSchemas.js'
import { autoQuitSchemas } from './Geconfig/autoQuitSchemas.js'
import { blackWhiteSchemas } from './Geconfig/blackWhiteSchemas.js'
import { joinGroupSchemas } from './Geconfig/joinGroupSchemas.js'
import { getConfigData } from './getConfigData.js'
import { setConfigData } from './setConfigData.js'
import { getJoinGroupConfig, setJoinGroupConfig } from './joinGroup.js'

export function supportGuoba() {
  return {
    pluginInfo,
    configInfo: {
      schemas: [
        ...groupSchemas,
        ...notifySchemas,
        ...reviewSchemas,
        ...autoQuitSchemas,
        ...blackWhiteSchemas,
        ...joinGroupSchemas
      ],
      getConfigData,
      setConfigData
    }
  }
}
