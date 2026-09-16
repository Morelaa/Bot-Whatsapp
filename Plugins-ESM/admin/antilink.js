//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import config from '../../config.js';
import db from '../../Database/db.js';
import pluginManager from '../_pluginmanager.js';
import { isSenderAdminInGroup, safeDeleteParticipant, resolveBotAdmin } from '../../Library/resolve.js';
const LINK_REGEX =
    /(https?:\/\/[^\s]+|www\.[^\s]+|chat\.whatsapp\.com\/[^\s]+|wa\.me\/\d+|whatsapp\.com\/channel\/[^\s]+|instagram\.com\/[^\s]+|t\.me\/[^\s]+|discord\.(gg|com)\/[^\s]+|bit\.ly\/[^\s]+|tinyurl\.com\/[^\s]+|s\.id\/[^\s]+|linktr\.ee\/[^\s]+|\b[a-z0-9-]+\.(com|net|org|id|xyz|info|link|click|shop)\/[^\s]*)/i;
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
function extractPollText(msg) {
    const poll = msg.pollCreationMessage ||
        msg.pollCreationMessageV2 ||
        msg.pollCreationMessageV3 ||
        msg.pollCreationMessageV4 ||
        msg.pollCreationMessageV5 ||
        msg.pollCreationMessageV6;
    if (!poll) return '';
    const parts = [];
    if (poll.name) parts.push(poll.name);
    if (Array.isArray(poll.options)) {
        for (const opt of poll.options) {
            if (opt?.optionName) parts.push(opt.optionName);
        }
    }
    return parts.join(' ');
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
    const pollText = extractPollText(msg);
    if (pollText) parts.push(pollText);
    const voPoll = msg.viewOnceMessage?.message || msg.viewOnceMessageV2?.message;
    if (voPoll) {
        const voPollText = extractPollText(voPoll);
        if (voPollText) parts.push(voPollText);
    }
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
    for (const key of ['pollCreationMessage', 'pollCreationMessageV2', 'pollCreationMessageV3', 'pollCreationMessageV4', 'pollCreationMessageV5', 'pollCreationMessageV6']) {
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
        chatHistory.delete(from); 
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
handler.limit = true;
const HISTORY_LIMIT = 50;
const MAX_TRACKED_CHATS = 300;
const chatHistory = new Map();
function pushHistory(chat, entry) {
    let arr = chatHistory.get(chat);
    if (arr) {
        chatHistory.delete(chat);
    } else {
        arr = [];
    }
    chatHistory.set(chat, arr);
    arr.push(entry);
    if (arr.length > HISTORY_LIMIT) arr.shift();
    while (chatHistory.size > MAX_TRACKED_CHATS) {
        const oldestKey = chatHistory.keys().next().value;
        chatHistory.delete(oldestKey);
    }
}
async function sweepHistory(conn, from) {
    const arr = chatHistory.get(from);
    if (!arr || !arr.length) return;
    for (const entry of arr) {
        if (entry.deleted || entry.isAdmin || !entry.hasLink) continue;
        try {
            await conn.sendMessage(from, {
                delete: {
                    remoteJid: from,
                    fromMe: false,
                    id: entry.id,
                    participant: entry.participant,
                },
            });
            entry.deleted = true;
        } catch (e) {
            console.error('[ANTILINK] Sweep delete failed:', e?.message);
        }
    }
}
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
    const prohibited = hasProhibitedContent(m);
    const senderIsAdmin = await isSenderAdminInGroup(conn, from, senderRaw, participants);
    pushHistory(from, {
        id: m.key.id,
        participant: safeDeleteParticipant(senderRaw),
        hasLink: prohibited,
        isAdmin: senderIsAdmin,
        deleted: false,
    });
    await sweepHistory(conn, from);
    return false;
};
export default handler;
