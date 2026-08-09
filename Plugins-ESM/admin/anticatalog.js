'use strict';
import db from '../../Database/db.js';
import { getMainOwnerNumber } from '../../System/mainowner.js';
import {
    normNum,
    isLidJid,
    resolveLidToPhone,
    findParticipant,
    isParticipantAdmin,
    safeKickJid,
    safeDeleteParticipant,
    isSenderAdminInGroup,
    resolveBotAdmin,
} from '../../Library/resolve.js';
const CFG = {
    CATALOG_BTN_NAME: 'catalog_message',
    AIRICH_SUBMSG_MAX: 15,
    AIRICH_SECTION_MAX: 20,
    AIRICH_PRIM_MAX: 30,
};
function getMsgType(msg = {}) {
    return Object.keys(msg).find((k) => !['messageContextInfo', 'senderKeyDistributionMessage'].includes(k));
}
function containsCatalogStr(obj, seen = new WeakSet()) {
    if (!obj) return false;
    if (typeof obj === 'string') return obj.includes('catalog_message');
    if (typeof obj !== 'object') return false;
    if (seen.has(obj)) return false;
    seen.add(obj);
    if (Array.isArray(obj)) return obj.some((v) => containsCatalogStr(v, seen));
    return Object.values(obj).some((v) => containsCatalogStr(v, seen));
}
function isCatalogBug(rawMsg) {
    let msg = rawMsg;
    while (true) {
        const type = getMsgType(msg);
        if (type === 'viewOnceMessage' || type === 'viewOnceMessageV2' || type === 'viewOnceMessageV2Extension') {
            const inner = msg[type]?.message;
            if (!inner) return false;
            msg = inner;
            continue;
        }
        break;
    }
    const type = getMsgType(msg);
    if (type !== 'interactiveMessage') return false;
    const interactive = msg.interactiveMessage;
    if (!interactive) return false;
    const buttons = interactive?.nativeFlowMessage?.buttons ?? [];
    if (buttons.some((btn) => btn?.name === CFG.CATALOG_BTN_NAME)) return true;
    return containsCatalogStr(interactive);
}
function countSectionPrimitives(sections) {
    let total = 0;
    for (const sec of sections) {
        const vm = sec?.view_model;
        if (!vm) continue;
        if (Array.isArray(vm.primitives)) total += vm.primitives.length;
        else if (vm.primitive) total += 1;
    }
    return total;
}
const DANGEROUS_TYPENAMES = new Set(['GenAIProductItemCardPrimitive', 'GenAIImaginePrimitive', 'GenAIReelPrimitive', 'GenAIPostPrimitive']);
function countDangerousPrimitives(sections) {
    let count = 0;
    for (const sec of sections) {
        const vm = sec?.view_model;
        if (!vm) continue;
        const items = Array.isArray(vm.primitives) ? vm.primitives : vm.primitive ? [vm.primitive] : [];
        for (const item of items) {
            if (DANGEROUS_TYPENAMES.has(item?.__typename)) count++;
        }
    }
    return count;
}
function isAIRichBug(rawMsg) {
    const botFwd = rawMsg?.botForwardedMessage;
    if (!botFwd) return { detected: false };
    const richResp = botFwd?.message?.richResponseMessage;
    if (!richResp) return { detected: false };
    const submessages = richResp?.submessages ?? [];
    const submsgCount = submessages.length;
    let sections = [];
    try {
        const raw = richResp?.unifiedResponse?.data;
        if (raw) {
            const decoded = JSON.parse(Buffer.from(raw, 'base64').toString('utf-8'));
            sections = decoded?.sections ?? [];
        }
    } catch {  }
    const sectionCount = sections.length;
    const primCount = countSectionPrimitives(sections);
    const dangerCount = countDangerousPrimitives(sections);
    if (submsgCount > CFG.AIRICH_SUBMSG_MAX) return { detected: true, reason: `submessages flood (${submsgCount})` };
    if (sectionCount > CFG.AIRICH_SECTION_MAX) return { detected: true, reason: `sections flood (${sectionCount})` };
    if (primCount > CFG.AIRICH_PRIM_MAX) return { detected: true, reason: `primitives flood (${primCount})` };
    if (dangerCount > CFG.AIRICH_PRIM_MAX) return { detected: true, reason: `dangerous primitives flood (${dangerCount})` };
    return { detected: false };
}
function resolveSenderInfo(senderJid, pushName) {
    const isLid = isLidJid(senderJid);
    const rawLidNum = senderJid.split('@')[0];
    const resolvedPhone = isLid ? resolveLidToPhone(senderJid) : null;
    const phoneNum = resolvedPhone || normNum(senderJid);
    const mentionJid = resolvedPhone ? `${phoneNum}@s.whatsapp.net` : senderJid;
    const displayName =
        db.getPushName(senderJid) ||
        db.getPushName(rawLidNum) ||
        (resolvedPhone ? db.getPushName(`${phoneNum}@s.whatsapp.net`) : null) ||
        (resolvedPhone ? db.getPushName(phoneNum) : null) ||
        pushName || `+${phoneNum}`;
    return { phoneNum, mentionJid, displayName };
}
async function deleteMsg(sock, m) {
    try {
        const rawPart = m.key?.participant || m.sender || m.key?.remoteJid || '';
        const participant = safeDeleteParticipant(rawPart);
        await sock.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: m.key.id, participant } });
    } catch (e) { console.error('[ANTICATALOG] Delete gagal:', e?.message); }
}
async function notifyOwnerDM(sock, senderJid, bugLabel, pushName) {
    try {
        const ownerNum = getMainOwnerNumber();
        if (!ownerNum) return;
        const ownerJid = `${ownerNum}@s.whatsapp.net`;
        const { phoneNum, displayName } = resolveSenderInfo(senderJid, pushName);
        const waktu = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
        await sock.sendMessage(ownerJid, {
            text:
                `╭┈┈⬡「 *ʟᴀᴘᴏʀᴀɴ ʙᴜɢ ᴅᴍ* 」\n┃\n` +
                `┃ ✧ ᴀᴅᴀ ʏᴀɴɢ ɴʏᴏʙᴀ ᴋɪʀɪᴍ ʙᴜɢ ᴋᴇ ʙᴏᴛ!\n┃\n` +
                `┃ ✧ ɴᴀᴍᴀ   : *${displayName}*\n` +
                `┃ ✧ ɴᴏᴍᴏʀ  : *+${phoneNum}*\n` +
                `┃ ✧ ᴊᴇɴɪꜱ  : *${bugLabel}*\n` +
                `┃ ✧ ᴡᴀᴋᴛᴜ  : *${waktu}*\n┃\n` +
                `┃ ✧ _ᴘᴇꜱᴀɴ ꜱᴜᴅᴀʜ ᴅɪʜᴀᴘᴜꜱ ᴏᴛᴏᴍᴀᴛɪꜱ._\n╰┈┈┈┈┈┈┈┈⬡`,
        });
    } catch (e) { console.error('[ANTICATALOG] Notif owner gagal:', e?.message); }
}
async function findKickableJid(sock, groupJid, senderJid) {
    try {
        const meta = await sock.groupMetadata(groupJid);
        if (!meta?.participants?.length) return null;
        const participants = meta.participants;
        const botEntry = findParticipant(participants, String(sock.user?.id ?? ''));
        if (!isParticipantAdmin(botEntry)) return null;
        const target = findParticipant(participants, senderJid);
        return safeKickJid(target);
    } catch (e) { console.error('[ANTICATALOG] findKickableJid error:', e?.message); return null; }
}
async function kickImmediately(sock, m, senderJid, bugLabel) {
    const { phoneNum, mentionJid, displayName } = resolveSenderInfo(senderJid, m.pushName);
    const kickJid = await findKickableJid(sock, m.chat, senderJid);
    const kickText =
        `╭┈┈⬡「 *ᴀɴᴛɪʙᴜɢ* 」\n┃\n┃ ✧ *ʙᴜɢ ᴛᴇʀᴅᴇᴛᴇᴋꜱɪ & ᴅɪᴋɪᴄᴋ!*\n┃\n` +
        `┃ ✧ ɴᴀᴍᴀ  : *${displayName}*\n┃ ✧ ᴋᴀꜱᴜꜱ : *${bugLabel}*\n┃\n` +
        `┃ ✧ _ᴘᴇꜱᴀɴ ᴛᴇʟᴀʜ ᴅɪʜᴀᴘᴜꜱ ᴏᴛᴏᴍᴀᴛɪꜱ._\n╰┈┈┈┈┈┈┈┈⬡`;
    try { await sock.sendMessage(m.chat, { text: kickText, mentions: [mentionJid] }, { quoted: m.raw }); } catch {  }
    if (kickJid) {
        try { await sock.groupParticipantsUpdate(m.chat, [kickJid], 'remove'); }
        catch (e) { console.error('[ANTICATALOG] Kick gagal:', e?.message); }
    }
}
async function handleGroupBug(sock, m, senderJid, botAdmin, bugLabel) {
    if (!botAdmin) {
        console.warn(`[ANTICATALOG] Bot bukan admin — ${bugLabel} dari ${senderJid.split('@')[0]} tidak bisa ditindak.`);
        return;
    }
    await deleteMsg(sock, m);
    await kickImmediately(sock, m, senderJid, bugLabel);
}
async function handleDMBug(sock, m, senderJid, bugLabel) {
    await deleteMsg(sock, m);
    await notifyOwnerDM(sock, senderJid, bugLabel, m.pushName);
}
const handler = async (m, { conn, args }) => {
    const from = m.chat;
    const sub = (args[0] || '').toLowerCase();
    const action = (args[1] || '').toLowerCase();
    const grp = db.getGroup(from);
    const settings = grp?.settings || {};
    if (!sub) {
        let groupName = 'Grup';
        try { const meta = await conn.groupMetadata(from); groupName = meta.subject || 'Grup'; } catch {  }
        const catStatus = settings.anticatalog ? ' Aktif' : ' Nonaktif';
        const airichStatus = settings.antiairich ? ' Aktif' : ' Nonaktif';
        return m.reply(
            `╭┈┈⬡「 *ᴀɴᴛɪʙᴜɢ ᴄᴇɴᴛᴇʀ* 」\n┃ ✧ *${groupName}*\n┃\n` +
            `┃ ✧ *ᴀɴᴛɪ ᴄᴀᴛᴀʟᴏɢ ʙᴜɢ* : ${catStatus}\n` +
            `┃ ✧ *ᴀɴᴛɪ ᴀɪʀɪᴄʜ ʙᴜɢ*  : ${airichStatus}\n┃\n` +
            `┃ ✧ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ:*\n` +
            `┃ ✧ .ᴀɴᴛɪʙᴜɢ ᴄᴀᴛᴀʟᴏɢ ᴏɴ/ᴏꜰꜰ\n` +
            `┃ ✧ .ᴀɴᴛɪʙᴜɢ ᴀɪʀɪᴄʜ ᴏɴ/ᴏꜰꜰ\n┃\n` +
            `┃ ✧ ᴘᴇʟᴀᴋᴜ ʙᴜɢ ʟᴀɴɢꜱᴜɴɢ *ᴅɪᴋɪᴄᴋ* ᴛᴀɴᴘᴀ ᴡᴀʀɴ.\n` +
            `┃ ✧ ʙᴏᴛ ᴡᴀᴊɪʙ ᴊᴀᴅɪ *ᴀᴅᴍɪɴ* ɢʀᴜᴘ.\n╰┈┈┈┈┈┈┈┈⬡`
        );
    }
    const validSubs = {
        catalog: { flagKey: 'anticatalog', label: 'Anti Catalog Bug' },
        airich: { flagKey: 'antiairich', label: 'Anti AIRich Bug' },
    };
    const target = validSubs[sub];
    if (!target) return m.reply('╭┈┈⬡「 *ᴇʀʀᴏʀ* 」\n┃ ✧ ɢᴜɴᴀᴋᴀɴ: ᴄᴀᴛᴀʟᴏɢ ᴀᴛᴀᴜ ᴀɪʀɪᴄʜ\n╰┈┈┈┈┈┈┈┈⬡');
    if (action === 'on') {
        if (settings[target.flagKey]) return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ *${target.label}* ꜱᴜᴅᴀʜ ᴀᴋᴛɪꜰ!\n╰┈┈┈┈┈┈┈┈⬡`);
        db.updateGroup(from, { [target.flagKey]: true });
        return m.reply(`╭┈┈⬡「 *${target.label}* ʙᴇʀʜᴀꜱɪʟ ᴅɪᴀᴋᴛɪꜰᴋᴀɴ!* 」\n┃\n┃ ✧ ᴘᴇʟᴀᴋᴜ ʙᴜɢ ᴀᴋᴀɴ ʟᴀɴɢꜱᴜɴɢ ᴅɪʜᴀᴘᴜꜱ ᴘᴇꜱᴀɴɴʏᴀ + ᴅɪᴋɪᴄᴋ.\n┃ ✧ _ʙᴏᴛ ʜᴀʀᴜꜱ ᴊᴀᴅɪ ᴀᴅᴍɪɴ._\n╰┈┈┈┈┈┈┈┈⬡`);
    }
    if (action === 'off') {
        if (!settings[target.flagKey]) return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ *${target.label}* ᴍᴇᴍᴀɴɢ ꜱᴜᴅᴀʜ ɴᴏɴᴀᴋᴛɪꜰ!\n╰┈┈┈┈┈┈┈┈⬡`);
        db.updateGroup(from, { [target.flagKey]: false });
        return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ *${target.label}* ʙᴇʀʜᴀꜱɪʟ ᴅɪɴᴏɴᴀᴋᴛɪꜰᴋᴀɴ!\n╰┈┈┈┈┈┈┈┈⬡`);
    }
    return m.reply(`╭┈┈⬡「 *ɢᴜɴᴀᴋᴀɴ: *ᴏɴ* ᴀᴛᴀᴜ *ᴏꜰꜰ* 」\n┃ ✧ ᴄᴏɴᴛᴏʜ: .ᴀɴᴛɪʙᴜɢ ${sub} ᴏɴ\n╰┈┈┈┈┈┈┈┈⬡`);
};
handler.help = ['antibug', 'antibug catalog on/off', 'antibug airich on/off'];
handler.tags = ['group', 'anti'];
handler.command = /^(antibug|anticatalog|antiairich|antibugcatalog|antibugairich)$/i;
handler.group = true;
handler.admin = true;
handler.onText = async (m, { conn, participants }) => {
    if (!m.message) return false;
    const rawMsg = m.message;
    const isGroup = !!m.isGroup;
    const senderJid = m.senderPn || m.sender || m.key?.participant || m.key?.remoteJid || '';
    if (!senderJid) return false;
    if (isGroup && (await isSenderAdminInGroup(conn, m.chat, senderJid, participants))) return false;
    const grp = isGroup ? db.getGroup(m.chat) : null;
    const settings = grp?.settings || {};
    if (isGroup) {
        if (settings.anticatalog && isCatalogBug(rawMsg)) {
            const botAdmin = await resolveBotAdmin(conn, m.chat, participants);
            await handleGroupBug(conn, m, senderJid, botAdmin, 'Bug Catalog');
            return false;
        }
    } else if (isCatalogBug(rawMsg)) {
        await handleDMBug(conn, m, senderJid, 'Bug Catalog');
        return false;
    }
    if (isGroup) {
        if (settings.antiairich) {
            const result = isAIRichBug(rawMsg);
            if (result.detected) {
                const botAdmin = await resolveBotAdmin(conn, m.chat, participants);
                await handleGroupBug(conn, m, senderJid, botAdmin, 'Bug AIRich Flood');
                return false;
            }
        }
    } else {
        const result = isAIRichBug(rawMsg);
        if (result.detected) {
            await handleDMBug(conn, m, senderJid, 'Bug AIRich Flood');
            return false;
        }
    }
    return false;
};
handler.limit = true;
export default handler;
