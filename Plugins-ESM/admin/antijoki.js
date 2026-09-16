//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import config from '../../config.js';
import db from '../../Database/db.js';
import pluginManager from '../_pluginmanager.js';
import { isSenderAdminInGroup, safeDeleteParticipant, resolveBotAdmin } from '../../Library/resolve.js';
const TRIGGER_REGEXES = [
    /\bvs\s*bot\b/, 
    /\bwajib\s*fle[kx]\b/, 
    /\bfle[kx]\s*wajib\b/, 
    /\bno\s*fle[kx]\b/, 
    /\btes\s*kedip\b/,
    /\btes\s*nemu\b/,
    /\bmatch\s*kedip\b/,
    /\bgb\s*mmr\b/, 
    /\bgb\s*po?in\b/, 
    /\bgb\s*point\b/, 
    /\ball\s*(savage|svg|savg)\b/, 
    /\bauto\s*global\b/, 
    /\bauto\s*win\b/,
    /\banti\s*ban\b/,
    /\bend\s*\d+\s*menit\b/, 
    /\ball\s*tier\b/,
    /\bvip\s*\d+\s*k\b/, 
    /\bdraft\s*tf\b/,
    /\bkda\s*\d{2,}\b/, 
    /\bhistory\s*\d+\s*mnt/, 
    /\brw\s*dk\s*dd\b/, 
    /\btiknorglomo\b/, 
];
const SMALL_CAPS_MAP = {
    '\u1D00': 'a', '\u0299': 'b', '\u1D04': 'c', '\u1D05': 'd', '\u1D07': 'e', '\uA730': 'f', '\u0262': 'g',
    '\u029C': 'h', '\u026A': 'i', '\u1D0A': 'j', '\u1D0B': 'k', '\u029F': 'l', '\u1D0D': 'm', '\u0274': 'n',
    '\u1D0F': 'o', '\u1D18': 'p', '\u01EB': 'q', '\u0280': 'r', '\uA731': 's', '\u1D1B': 't', '\u1D1C': 'u',
    '\u1D20': 'v', '\u1D21': 'w', '\u028F': 'y', '\u1D22': 'z',
    '\u1D2C': 'a', '\u1D2E': 'b', '\u1D30': 'd', '\u1D31': 'e', '\u1D33': 'g', '\u1D34': 'h', '\u1D35': 'i',
    '\u1D36': 'j', '\u1D37': 'k', '\u1D38': 'l', '\u1D39': 'm', '\u1D3A': 'n', '\u1D3C': 'o', '\u1D3E': 'p',
    '\u1D3F': 'r', '\u1D40': 's', '\u1D41': 't', '\u1D42': 'w',
};
const CONFUSABLES_MAP = {
    '\u0430': 'a', '\u0410': 'a', '\u0435': 'e', '\u0415': 'e', '\u043E': 'o', '\u041E': 'o',
    '\u0440': 'p', '\u0420': 'p', '\u0441': 'c', '\u0421': 'c', '\u0445': 'x', '\u0425': 'x',
    '\u0443': 'y', '\u0423': 'y', '\u0456': 'i', '\u0406': 'i', '\u0455': 's', '\u0405': 's',
    '\u043A': 'k', '\u041A': 'k', '\u043C': 'm', '\u041C': 'm', '\u043D': 'h', '\u041D': 'h',
    '\u0442': 't', '\u0422': 't', '\u0432': 'b', '\u0412': 'b', '\u0433': 'r', '\u0413': 'r',
    '\u0432': 'v', '\u043B': 'l', '\u0439': 'n', '\u0448': 'w', '\u044E': 'io', '\u044F': 'ya',
    '\u0437': '3', '\u0431': '6', '\u044D': 'e', '\u0451': 'e',
    '\u03B1': 'a', '\u0391': 'a', '\u03BF': 'o', '\u039F': 'o', '\u03C1': 'p', '\u03A1': 'p',
    '\u03C5': 'y', '\u03A5': 'y', '\u03BA': 'k', '\u039A': 'k', '\u03BD': 'v', '\u039D': 'n',
    '\u03C4': 't', '\u03A4': 't', '\u03B9': 'i', '\u0399': 'i', '\u03B5': 'e', '\u0395': 'e',
    '\u03C7': 'x', '\u03A7': 'x', '\u03B2': 'b', '\u0392': 'b', '\u03B7': 'n', '\u0397': 'n',
    '\u03C2': 's', '\u03C3': 's', '\u03A3': 's', '\u03C9': 'w', '\u03A9': 'w',
};
function foldFancyUnicode(text) {
    if (!text) return '';
    let s = String(text).normalize('NFKD');
    s = s.replace(/[\u0300-\u036f]/g, ''); 
    s = s.replace(/./gsu, (ch) => CONFUSABLES_MAP[ch] || SMALL_CAPS_MAP[ch] || ch); 
    s = s.replace(/[\u200B-\u200F\u2060\uFEFF]/g, ''); 
    return s;
}
function normalizeSpaced(text) {
    return foldFancyUnicode(text || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ') 
        .replace(/\s+/g, ' ')
        .trim();
}
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
    if (msg.imageMessage?.caption) parts.push(msg.imageMessage.caption);
    if (msg.videoMessage?.caption) parts.push(msg.videoMessage.caption);
    if (msg.documentMessage?.caption) parts.push(msg.documentMessage.caption);
    if (msg.ephemeralMessage?.message?.conversation) parts.push(msg.ephemeralMessage.message.conversation);
    if (msg.ephemeralMessage?.message?.extendedTextMessage?.text) parts.push(msg.ephemeralMessage.message.extendedTextMessage.text);
    if (msg.viewOnceMessage?.message?.imageMessage?.caption) parts.push(msg.viewOnceMessage.message.imageMessage.caption);
    if (msg.viewOnceMessage?.message?.videoMessage?.caption) parts.push(msg.viewOnceMessage.message.videoMessage.caption);
    if (msg.viewOnceMessageV2?.message?.imageMessage?.caption) parts.push(msg.viewOnceMessageV2.message.imageMessage.caption);
    if (msg.viewOnceMessageV2?.message?.videoMessage?.caption) parts.push(msg.viewOnceMessageV2.message.videoMessage.caption);
    return parts.join(' ');
}
function hasJokiContent(text) {
    const spaced = normalizeSpaced(text);
    if (!spaced) return false;
    return TRIGGER_REGEXES.some((re) => re.test(spaced));
}
const handler = async (m, { conn, args }) => {
    const from = m.chat;
    const mode = (args[0] || '').toLowerCase();
    const grp = db.getGroup(from);
    const current = grp?.settings?.antijoki || false;
    if (!mode || mode === 'status' || mode === 'cek') {
        return m.reply(
            `╭┈┈⬡「 *ᴀɴᴛɪᴊᴏᴋɪ ꜱᴛᴀᴛᴜꜱ* 」\n` +
            `┃\n` +
            `┃ ✧ ɢʀᴜᴘ ɪɴɪ : ${current ? '*ᴀᴋᴛɪꜰ*' : '*ɴᴏɴᴀᴋᴛɪꜰ*'}\n` +
            `┃\n` +
            `┃ ✧ .ᴀɴᴛɪᴊᴏᴋɪ ᴏɴ  — ᴀᴋᴛɪꜰᴋᴀɴ\n` +
            `┃ ✧ .ᴀɴᴛɪᴊᴏᴋɪ ᴏꜰꜰ — ɴᴏɴᴀᴋᴛɪꜰᴋᴀɴ\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        );
    }
    if (mode === 'on' || mode === 'aktif') {
        if (current) return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴀɴᴛɪᴊᴏᴋɪ ꜱᴜᴅᴀʜ ᴀᴋᴛɪꜰ ᴅɪ ɢʀᴜᴘ ɪɴɪ!\n╰┈┈┈┈┈┈┈┈⬡`);
        db.updateGroup(from, { antijoki: true });
        return m.reply(
            `╭┈┈⬡「 *ᴀɴᴛɪᴊᴏᴋɪ ᴅɪᴀᴋᴛɪꜰᴋᴀɴ!* 」\n` +
            `┃\n` +
            `┃ ✧ ᴘᴇꜱᴀɴ ᴘʀᴏᴍᴏ ᴊᴏᴋɪ/ʀᴀɴᴋ (ʀᴀɴᴋ ᴠꜱ ʙᴏᴛ, ᴍᴀx ɢʟᴏʀʏ, ᴅʟʟ) ᴀᴋᴀɴ ᴅɪʜᴀᴘᴜꜱ ᴏᴛᴏᴍᴀᴛɪꜱ.\n` +
            `┃ ✧ ᴀᴅᴍɪɴ & ᴏᴡɴᴇʀ ᴅɪᴋᴇᴄᴜᴀʟɪᴋᴀɴ.\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        );
    }
    if (mode === 'off' || mode === 'nonaktif') {
        if (!current) return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴀɴᴛɪᴊᴏᴋɪ ꜱᴜᴅᴀʜ ɴᴏɴᴀᴋᴛɪꜰ ᴅɪ ɢʀᴜᴘ ɪɴɪ!\n╰┈┈┈┈┈┈┈┈⬡`);
        db.updateGroup(from, { antijoki: false });
        chatHistory.delete(from);
        return m.reply(
            `╭┈┈⬡「 *ᴀɴᴛɪᴊᴏᴋɪ ᴅɪɴᴏɴᴀᴋᴛɪꜰᴋᴀɴ!* 」\n` +
            `┃ ✧ ᴘᴇꜱᴀɴ ᴘʀᴏᴍᴏ ᴊᴏᴋɪ ʙᴏʟᴇʜ ᴅɪᴋɪʀɪᴍ ᴅɪ ɢʀᴜᴘ ɪɴɪ.\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        );
    }
    return m.reply(
        `╭┈┈⬡「 *ᴇʀʀᴏʀ* 」\n` +
        `┃ ✧ ᴀʀɢᴜᴍᴇɴ ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ!\n` +
        `┃\n` +
        `┃ ✧ ɢᴜɴᴀᴋᴀɴ: .ᴀɴᴛɪᴊᴏᴋɪ ᴏɴ / ᴏꜰꜰ / ꜱᴛᴀᴛᴜꜱ\n` +
        `╰┈┈┈┈┈┈┈┈⬡`
    );
};
handler.help = ['antijoki on', 'antijoki off', 'antijoki status'];
handler.tags = ['group', 'anti'];
handler.command = /^antijoki$/i;
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
        if (entry.deleted || entry.isAdmin || !entry.isJoki) continue;
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
            console.error('[ANTIJOKI] Sweep delete failed:', e?.message);
        }
    }
}
handler.onText = async (m, { conn, participants }) => {
    if (!m.isGroup) return false;
    if (!m.message) return false;
    if (m.fromMe) return false;
    const from = m.chat;
    const grp = db.getGroup(from);
    if (!grp?.settings?.antijoki) return false; 
    const botIsAdmin = await resolveBotAdmin(conn, from, participants);
    if (!botIsAdmin) return false;
    const rawText = extractAllText(m);
    if (rawText && isRealBotCommand(rawText)) return false;
    const senderRaw = m.key?.participant || m.key?.remoteJid || m.sender || '';
    const isJoki = hasJokiContent(rawText);
    const senderIsAdmin = await isSenderAdminInGroup(conn, from, senderRaw, participants);
    pushHistory(from, {
        id: m.key.id,
        participant: safeDeleteParticipant(senderRaw),
        isJoki,
        isAdmin: senderIsAdmin,
        deleted: false,
    });
    await sweepHistory(conn, from);
    return false;
};
export default handler;
