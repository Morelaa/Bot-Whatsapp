'use strict';
import config from '../../config.js';
import db from '../../Database/db.js';
import pluginManager from '../_pluginmanager.js';
import { isSenderAdminInGroup, safeDeleteParticipant, resolveBotAdmin } from '../../Library/resolve.js';
const LINK_REGEX =
    /(https?:\/\/[^\s]+|www\.[^\s]+|chat\.whatsapp\.com\/[^\s]+|wa\.me\/\d+|instagram\.com\/[^\s]+|t\.me\/[^\s]+|discord\.(gg|com)\/[^\s]+)/i;
function isRealBotCommand(text) {
    if (!text) return false;
    const trimmed = text.trim();
    const prefixUsed = config.prefix.find((p) => trimmed.startsWith(p));
    if (!prefixUsed) return false;
    const withoutPrefix = trimmed.slice(prefixUsed.length);
    const cmd = withoutPrefix.trim().split(/\s+/)[0]?.toLowerCase();
    if (!cmd) return false;
    return !!pluginManager.findCommand(cmd);
}
function extractAllText(m) {
    const parts = [];
    const msg = m.message || {};
    if (msg.conversation) parts.push(msg.conversation);
    if (msg.extendedTextMessage?.text) parts.push(msg.extendedTextMessage.text);
    if (msg.extendedTextMessage?.matchedText) parts.push(msg.extendedTextMessage.matchedText);
    if (msg.extendedTextMessage?.canonicalUrl) parts.push(msg.extendedTextMessage.canonicalUrl);
    if (msg.imageMessage?.caption) parts.push(msg.imageMessage.caption);
    if (msg.videoMessage?.caption) parts.push(msg.videoMessage.caption);
    if (msg.documentMessage?.caption) parts.push(msg.documentMessage.caption);
    if (msg.audioMessage?.caption) parts.push(msg.audioMessage.caption);
    if (msg.ephemeralMessage?.message?.conversation) parts.push(msg.ephemeralMessage.message.conversation);
    if (msg.ephemeralMessage?.message?.extendedTextMessage?.text) parts.push(msg.ephemeralMessage.message.extendedTextMessage.text);
    if (msg.viewOnceMessage?.message?.imageMessage?.caption) parts.push(msg.viewOnceMessage.message.imageMessage.caption);
    if (msg.viewOnceMessage?.message?.videoMessage?.caption) parts.push(msg.viewOnceMessage.message.videoMessage.caption);
    if (msg.viewOnceMessageV2?.message?.imageMessage?.caption) parts.push(msg.viewOnceMessageV2.message.imageMessage.caption);
    if (msg.viewOnceMessageV2?.message?.videoMessage?.caption) parts.push(msg.viewOnceMessageV2.message.videoMessage.caption);
    if (msg.buttonsMessage?.contentText) parts.push(msg.buttonsMessage.contentText);
    if (msg.templateMessage?.hydratedTemplate?.hydratedContentText) parts.push(msg.templateMessage.hydratedTemplate.hydratedContentText);
    if (msg.listMessage?.description) parts.push(msg.listMessage.description);
    if (msg.listMessage?.title) parts.push(msg.listMessage.title);
    return parts.join(' ');
}
function hasProhibitedContent(m) {
    const msg = m.message || {};
    const text = extractAllText(m);
    if (text && LINK_REGEX.test(text)) return true;
    if (msg.groupInviteMessage) return true;
    function checkCtx(ctx) {
        if (!ctx) return false;
        if (ctx.inviteLinkGroupTypeV2 || ctx.inviteLinkGroupType) return true;
        if (ctx.inviteLinkJoinV2) return true;
        const adUrl = ctx.externalAdReply?.sourceUrl;
        if (adUrl && (adUrl.includes('chat.whatsapp.com') || adUrl.includes('wa.me') || adUrl.includes('whatsapp.com/channel'))) return true;
        return false;
    }
    if (checkCtx(msg.extendedTextMessage?.contextInfo)) return true;
    if (checkCtx(msg.extendedTextMessage)) return true;
    for (const key of ['imageMessage', 'videoMessage', 'documentMessage', 'audioMessage']) {
        if (checkCtx(msg[key]?.contextInfo)) return true;
    }
    const voMsg = msg.viewOnceMessage?.message || msg.viewOnceMessageV2?.message;
    if (voMsg) {
        if (checkCtx(voMsg.extendedTextMessage?.contextInfo)) return true;
        for (const key of ['imageMessage', 'videoMessage']) {
            if (checkCtx(voMsg[key]?.contextInfo)) return true;
        }
    }
    return false;
}
const handler = async (m, { conn, args }) => {
    const from = m.chat;
    const mode = (args[0] || '').toLowerCase();
    const grp = db.getGroup(from);
    const current = grp?.settings?.antilink || false;
    if (!mode || mode === 'status' || mode === 'cek') {
        return m.reply(
            `╭┈┈⬡「 *ᴀɴᴛɪʟɪɴᴋ ꜱᴛᴀᴛᴜꜱ* 」\n` +
            `┃\n` +
            `┃ ✧ ɢʀᴜᴘ ɪɴɪ : ${current ? '*ᴀᴋᴛɪꜰ*' : '*ɴᴏɴᴀᴋᴛɪꜰ*'}\n` +
            `┃\n` +
            `┃ ✧ .ᴀɴᴛɪʟɪɴᴋ ᴏɴ  — ᴀᴋᴛɪꜰᴋᴀɴ\n` +
            `┃ ✧ .ᴀɴᴛɪʟɪɴᴋ ᴏꜰꜰ — ɴᴏɴᴀᴋᴛɪꜰᴋᴀɴ\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        );
    }
    if (mode === 'on' || mode === 'aktif') {
        if (current) return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴀɴᴛɪʟɪɴᴋ ꜱᴜᴅᴀʜ ᴀᴋᴛɪꜰ ᴅɪ ɢʀᴜᴘ ɪɴɪ!\n╰┈┈┈┈┈┈┈┈⬡`);
        db.updateGroup(from, { antilink: true });
        return m.reply(
            `╭┈┈⬡「 *ᴀɴᴛɪʟɪɴᴋ ᴅɪᴀᴋᴛɪꜰᴋᴀɴ!* 」\n` +
            `┃\n` +
            `┃ ✧ ꜱᴇᴍᴜᴀ ᴘᴇꜱᴀɴ ʙᴇʀɪꜱɪ ʟɪɴᴋ ᴀᴋᴀɴ ᴅɪʜᴀᴘᴜꜱ ᴏᴛᴏᴍᴀᴛɪꜱ.\n` +
            `┃ ✧ ᴀᴅᴍɪɴ & ᴏᴡɴᴇʀ ᴅɪᴋᴇᴄᴜᴀʟɪᴋᴀɴ.\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        );
    }
    if (mode === 'off' || mode === 'nonaktif') {
        if (!current) return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴀɴᴛɪʟɪɴᴋ ꜱᴜᴅᴀʜ ɴᴏɴᴀᴋᴛɪꜰ ᴅɪ ɢʀᴜᴘ ɪɴɪ!\n╰┈┈┈┈┈┈┈┈⬡`);
        db.updateGroup(from, { antilink: false });
        return m.reply(
            `╭┈┈⬡「 *ᴀɴᴛɪʟɪɴᴋ ᴅɪɴᴏɴᴀᴋᴛɪꜰᴋᴀɴ!* 」\n` +
            `┃ ✧ ʟɪɴᴋ ʙᴏʟᴇʜ ᴅɪᴋɪʀɪᴍ ᴅɪ ɢʀᴜᴘ ɪɴɪ.\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        );
    }
    return m.reply(
        `╭┈┈⬡「 *ᴇʀʀᴏʀ* 」\n` +
        `┃ ✧ ᴀʀɢᴜᴍᴇɴ ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ!\n` +
        `┃\n` +
        `┃ ✧ ɢᴜɴᴀᴋᴀɴ: .ᴀɴᴛɪʟɪɴᴋ ᴏɴ / ᴏꜰꜰ / ꜱᴛᴀᴛᴜꜱ\n` +
        `╰┈┈┈┈┈┈┈┈⬡`
    );
};
handler.help = ['antilink on', 'antilink off', 'antilink status'];
handler.tags = ['group', 'anti'];
handler.command = /^antilink$/i;
handler.group = true;
handler.admin = true;
handler.onText = async (m, { conn, participants }) => {
    if (!m.isGroup) return false;
    if (!m.message) return false;
    if (m.fromMe) return false;
    const from = m.chat;
    const grp = db.getGroup(from);
    if (!grp?.settings?.antilink) return false;
    const botIsAdmin = await resolveBotAdmin(conn, from, participants);
    if (!botIsAdmin) return false;
    const rawText = extractAllText(m);
    if (rawText && isRealBotCommand(rawText)) return false;
    const senderRaw = m.key?.participant || m.key?.remoteJid || m.sender || '';
    let senderIsAdmin = await isSenderAdminInGroup(conn, from, senderRaw, participants);
    if (senderIsAdmin) return false;
    if (!hasProhibitedContent(m)) return false;
    try {
        const deleteParticipant = safeDeleteParticipant(senderRaw);
        await conn.sendMessage(from, {
            delete: {
                remoteJid: from,
                fromMe: false,
                id: m.key.id,
                participant: deleteParticipant,
            },
        });
    } catch (e) {
        console.error('[ANTILINK] Delete failed:', e?.message);
    }
    return false;
};
handler.limit = true;
export default handler;
