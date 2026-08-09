'use strict';
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
