'use strict';
import { getGroup, updateGroup, getAllGroups } from '../Database/db.js';
import * as kv from '../Database/kvstore.js';
import config from '../config.js';
const KEY_GLOBAL = 'selfmode:global';
function readGlobal() {
    const val = kv.get(KEY_GLOBAL);
    return val === undefined ? !!config.defaultSelfMode : val === true || val === 'true';
}
function writeGlobal(active) {
    try { kv.set(KEY_GLOBAL, !!active); } catch { }
}

export function isSelfMode(groupJid) {
    if (!groupJid) return false;
    const groupData = getGroup(groupJid);
    if (isSelfModeGlobal()) {
        if (groupData && groupData.settings?.selfmode === false) return false;
        return true;
    }
    return groupData?.settings?.selfmode ?? false;
}
export function setSelfMode(groupJid, value) {
    if (!groupJid) return false;
    updateGroup(groupJid, { selfmode: Boolean(value) });
    return Boolean(value);
}
export function isSelfModeGlobal() {
    return readGlobal();
}

export function setSelfModeGlobal(value, applyToAll = true) {
    writeGlobal(value);
    if (!applyToAll) return 0;
    const groups = getAllGroups();
    let count = 0;
    for (const jid of Object.keys(groups)) {
        updateGroup(jid, { selfmode: value });
        count++;
    }
    return count;
}
export function toggleSelfModeGlobal() {
    return setSelfModeGlobal(!isSelfModeGlobal());
}
export function shouldBlockNonOwner(groupJid, isOwnerSender) {
    return isSelfMode(groupJid) && !isOwnerSender;
}
export default {
    isSelfMode,
    setSelfMode,
    isSelfModeGlobal,
    setSelfModeGlobal,
    toggleSelfModeGlobal,
    shouldBlockNonOwner,
};
