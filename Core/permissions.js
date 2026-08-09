'use strict';
import config from '../config.js';
import { isOwner, isMainOwner, isGroupAdmin, isSenderAdminInGroup, resolveBotAdmin, autoMapParticipantLids } from '../Library/resolve.js';
import db from '../Database/db.js';
import { getAllOwners } from '../System/ownerlist.js';
export function checkOwner(m, participants) {
    if (participants)
        autoMapParticipantLids(participants);
    return isOwner(m, getAllOwners(), participants);
}
export function checkMainOwner(m, participants) {
    if (participants)
        autoMapParticipantLids(participants);
    return isMainOwner(m, participants);
}
export function checkGroupAdmin(m, participants) {
    if (!m?.isGroup)
        return false;
    return isGroupAdmin(m, participants);
}
export async function checkGroupAdminAsync(sock, m) {
    if (!m?.isGroup)
        return false;
    return isSenderAdminInGroup(sock, m.chat, m.sender);
}
export async function checkBotAdmin(sock, groupJid, participants) {
    return resolveBotAdmin(sock, groupJid, participants);
}
export function checkPremiumUser(jid) {
    return !!db.getUser(jid)?.premium;
}
export async function evaluatePluginAccess(plugin, ctx) {
    const { m, participants, sock } = ctx;
    const isOwnerOrMain = checkMainOwner(m, participants) || checkOwner(m, participants);
    if (plugin.mainOwner && !checkMainOwner(m, participants)) {
        return { allowed: false, reason: 'main_owner_only' };
    }
    if (plugin.owner && !checkOwner(m, participants)) {
        return { allowed: false, reason: 'owner_only' };
    }
    if (plugin.group && !m?.isGroup) {
        return { allowed: false, reason: 'group_only' };
    }
    if (plugin.private && m?.isGroup) {
        return { allowed: false, reason: 'private_only' };
    }
    if (plugin.admin && !checkGroupAdmin(m, participants)) {
        return { allowed: false, reason: 'admin_only' };
    }
    if (plugin.botAdmin && m?.isGroup) {
        const botIsAdmin = await checkBotAdmin(sock, m.chat, participants);
        if (!botIsAdmin)
            return { allowed: false, reason: 'bot_not_admin' };
    }
    if (plugin.premium && !isOwnerOrMain && !checkPremiumUser(m?.senderPn || m?.sender)) {
        return { allowed: false, reason: 'premium_required' };
    }
    return { allowed: true };
}
export default {
    checkOwner,
    checkMainOwner,
    checkGroupAdmin,
    checkGroupAdminAsync,
    checkBotAdmin,
    checkPremiumUser,
    evaluatePluginAccess,
};
