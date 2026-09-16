//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import * as kv from '../Database/kvstore.js';
import config from '../config.js';
const KEY_ENABLED = 'privatemode:enabled';
export function isPrivateModeOn() {
    const val = kv.get(KEY_ENABLED);
    return val === undefined ? config.defaultPrivateMode : val === true || val === 'true';
}
export function setPrivateMode(enabled) {
    kv.set(KEY_ENABLED, !!enabled);
    return isPrivateModeOn();
}
export function isChatAllowed(chatJid, isGroup, isOwnerSender) {
    if (isGroup)
        return true;
    if (!isPrivateModeOn())
        return true;
    return !!isOwnerSender;
}
export default { isPrivateModeOn, setPrivateMode, isChatAllowed };
