'use strict';
import db from '../../Database/db.js';
import {
    isLidJid,
    resolveLidToPhone,
    normNum,
    findParticipant,
    isParticipantAdmin,
    safeKickJid,
    safeDeleteParticipant,
    isSenderAdminInGroup,
} from '../../Library/resolve.js';
const FEATURES = {
    antilink: 'Anti Link',
    antivirtex: 'Anti Virtex',
    antibot: 'Anti Bot Lain',
    anticatalog: 'Anti Bug Catalog',
    antiairich: 'Anti Bug AIRich',
    antifoto: 'Anti Foto/Gambar',
    antivideo: 'Anti Video',
    antiaudio: 'Anti Audio/Voice',
    antidokumen: 'Anti Dokumen/File',
    antisticker: 'Anti Sticker',
    antimention: 'Anti Tag Status',
    antiswgc: 'Anti SWGC',
    welcome: 'Welcome Member',
    goodbye: 'Goodbye Member',
};
const VALID_KEYS = Object.keys(FEATURES);
const ORDER = ['antilink', 'antivirtex', 'antibot', 'anticatalog', 'antiairich', 'antifoto', 'antivideo', 'antiaudio', 'antidokumen', 'antisticker', 'antimention', 'antiswgc', 'welcome', 'goodbye'];
function getText(m) {
    return m.text || m.message?.conversation || m.message?.extendedTextMessage?.text ||
        m.message?.imageMessage?.caption || m.message?.videoMessage?.caption || m.message?.documentMessage?.caption || '';
}
async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
async function deleteMsg(sock, m) {
    const senderRaw = m.key?.participant || m.key?.remoteJid || '';
    const deleteParticipant = safeDeleteParticipant(senderRaw);
    const payload = { delete: { remoteJid: m.chat, fromMe: false, id: m.key?.id, participant: deleteParticipant } };
    for (let attempt = 1; attempt <= 2; attempt++) {
        try { await sock.sendMessage(m.chat, payload); return; }
        catch (e) {
            if (e?.message?.includes('rate-overlimit') && attempt === 1) { await sleep(3000); continue; }
            throw e;
        }
    }
}
async function findKickableJid(sock, groupJid, senderJid) {
    try {
        const meta = await sock.groupMetadata(groupJid);
        if (!meta?.participants?.length) return null;
        const participants = meta.participants;
        const botEntry = findParticipant(participants, String(sock.user?.id ?? ''));
        if (!isParticipantAdmin(botEntry)) return null;
        const found = findParticipant(participants, senderJid);
        return found ? safeKickJid(found) : null;
    } catch (e) { console.error('[ANTIGRUP] findKickableJid error:', e?.message); return null; }
}
async function addWarn(sock, m, reason, senderJid) {
    try {
        const grp = db.getGroup(m.chat);
        const warns = grp?.settings?.warns || {};
        if (!warns[senderJid]) warns[senderJid] = { count: 0 };
        warns[senderJid].count++;
        warns[senderJid].updatedAt = Date.now();
        db.updateGroup(m.chat, { warns });
        const count = warns[senderJid].count;
        const isLid = isLidJid(senderJid);
        const rawLidNum = senderJid.split('@')[0];
        const resolvedPhone = isLid ? resolveLidToPhone(senderJid) : null;
        const phoneNum = resolvedPhone || normNum(senderJid);
        const mentionJid = resolvedPhone ? `${phoneNum}@s.whatsapp.net` : senderJid;
        const displayName =
            db.getPushName(senderJid) || db.getPushName(rawLidNum) ||
            (resolvedPhone ? db.getPushName(`${phoneNum}@s.whatsapp.net`) : null) ||
            (resolvedPhone ? db.getPushName(phoneNum) : null) ||
            m.pushName || (resolvedPhone ? `+${phoneNum}` : rawLidNum);
        const warnText =
            `* Peringatan ${count}/5*\n\n@${phoneNum} melanggar aturan:\n*${reason}*\n\nNama: *${displayName}*\n` +
            (count >= 5 ? 'Peringatan penuh! Akan segera dikeluarkan.' : 'Jika mencapai 5 peringatan, akan dikeluarkan.');
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                await sock.sendMessage(m.chat, { text: warnText, mentions: [mentionJid] }, { quoted: m.raw });
                break;
            } catch (e) {
                if (e?.message?.includes('rate-overlimit') && attempt === 1) { await sleep(3000); continue; }
                console.warn('[ANTIGRUP] Gagal kirim warning:', e?.message);
                break;
            }
        }
        if (count >= 5) {
            warns[senderJid].count = 0;
            db.updateGroup(m.chat, { warns });
            const kickJid = await findKickableJid(sock, m.chat, senderJid);
            if (kickJid) {
                try { await sock.groupParticipantsUpdate(m.chat, [kickJid], 'remove'); }
                catch (e) { console.error('[ANTIGRUP] Kick gagal:', e?.message); }
            }
        }
    } catch (e) { console.error('[ANTIGRUP] addWarn error:', e?.message); }
}
async function act(sock, m, reason, senderJid) {
    try { await deleteMsg(sock, m); } catch (e) { console.error('[ANTIGRUP] Delete gagal:', e?.message); }
    await addWarn(sock, m, reason, senderJid);
}
function isBotMessage(m) {
    const pushName = m.pushName || '';
    const mtype = m.type || '';
    const msg = m.message || {};
    const BOT_MTYPES = ['interactiveMessage', 'listMessage', 'buttonsMessage', 'templateMessage', 'highlyStructuredMessage'];
    if (BOT_MTYPES.includes(mtype)) return true;
    if (msg.viewOnceMessage) {
        const inner = msg.viewOnceMessage?.message || {};
        if (inner.interactiveMessage || inner.buttonsMessage) return true;
    }
    const ctx = msg.extendedTextMessage?.contextInfo || msg.imageMessage?.contextInfo || msg.videoMessage?.contextInfo || msg.documentMessage?.contextInfo || {};
    if (ctx.externalAdReply) return true;
    const lowerName = pushName.toLowerCase();
    if (/\bbot\b/.test(lowerName) && !/^~/.test(pushName)) return true;
    const ltext = getText(m);
    if (/©\s*\S+/.test(ltext)) return true;
    if (/[╭╰┃]/.test(ltext) && /[╌─┄]/.test(ltext)) return true;
    if (/[「」]/.test(ltext)) return true;
    const lines = ltext.split('\n');
    const prefixedLines = lines.filter((l) => /^[┃|◉•▸►»]/.test(l.trim()));
    if (prefixedLines.length >= 4) return true;
    if (/hallo pengguna|silakan tekan tombol|permintaan anda sedang diproses/i.test(ltext)) return true;
    if (/level up|breakthrough|exp gained/i.test(ltext)) return true;
    return false;
}
function statusOf(settings, k) { return settings[k] ? ' ᴀᴋᴛɪꜰ' : ' ɴᴏɴᴀᴋᴛɪꜰ'; }
async function onHandler(m, { args = [], conn }) {
    const from = m.chat;
    const fitur = (args[0] || '').toLowerCase();
    const grp = db.getGroup(from);
    const settings = grp?.settings || {};
    if (!fitur) {
        const tableRows = [{ items: ['Fɪᴛᴜʀ', 'Sᴛᴀᴛᴜs'], isHeading: true }];
        for (const key of ORDER) {
            const status = settings[key] ? '🟢 ᴀᴋᴛɪꜰ' : '🔴 ɴᴏɴᴀᴋᴛɪꜰ';
            tableRows.push({ items: [FEATURES[key], status] });
        }
        const submessages = [
            {
                messageType: 2,
                messageText:
                    `ɢᴜɴᴀᴋᴀɴ *.ᴏɴ ᴄᴏᴍᴍᴀɴᴅ* ᴜɴᴛᴜᴋ ᴀᴋᴛɪꜰᴋᴀɴ ꜰɪᴛᴜʀ\n` +
                    `ᴄᴏɴᴛᴏʜ : *.ᴏɴ antilink*\n\n` +
                    `🟢 = Fɪᴛᴜʀ yang sedang ᴀᴋᴛɪꜰ\n` +
                    `🔴 = Fɪᴛᴜʀ yang ᴛɪᴅᴀᴋ ᴀᴋᴛɪꜰ`,
            },
            {
                messageType: 4,
                tableMetadata: { title: 'Sᴛᴀᴛᴜs Fɪᴛᴜʀ Gʀᴜᴘ', rows: tableRows },
            },
        ];
        const content = {
            botForwardedMessage: {
                message: {
                    richResponseMessage: {
                        messageType: 1,
                        submessages,
                        contextInfo: {
                            forwardingScore: 1,
                            isForwarded: true,
                            forwardedAiBotMessageInfo: { botJid: '867051314767696@bot' },
                            forwardOrigin: 4,
                        },
                    },
                },
            },
        };
        try {
            return await conn.relayMessage(m.chat, content, {});
        } catch (e) {
            console.error('[ANTIGRUP] Tabel gagal, fallback teks:', e?.message);
            let text = `╭┈┈⬡「 *ꜱᴛᴀᴛᴜꜱ ꜰɪᴛᴜʀ ɢʀᴜᴘ* 」\n┃\n`;
            for (const key of ORDER) {
                text += `┃ ✧ ${statusOf(settings, key)}  ${FEATURES[key]}\n`;
            }
            text += `┃\n┃ ✧ *.ᴏɴ <ꜰɪᴛᴜʀ>* / *.ᴏꜰꜰ <ꜰɪᴛᴜʀ>* ᴜɴᴛᴜᴋ ᴛᴏɢɢʟᴇ\n┃ ✧ ᴄᴏɴᴛᴏʜ: *.ᴏɴ ᴀɴᴛɪʟɪɴᴋ*\n╰┈┈┈┈┈┈┈┈⬡`;
            return m.reply(text);
        }
    }
    if (!VALID_KEYS.includes(fitur)) return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ꜰɪᴛᴜʀ *${fitur}* ᴛɪᴅᴀᴋ ᴅɪᴋᴇɴᴀʟ!\n╰┈┈┈┈┈┈┈┈⬡`);
    if (settings[fitur]) return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ *${FEATURES[fitur]}* ꜱᴜᴅᴀʜ ᴀᴋᴛɪꜰ!\n╰┈┈┈┈┈┈┈┈⬡`);
    db.updateGroup(from, { [fitur]: true });
    return m.reply(`╭┈┈⬡「 *${FEATURES[fitur]}* ʙᴇʀʜᴀꜱɪʟ ᴅɪᴀᴋᴛɪꜰᴋᴀɴ!* 」\n┃ ✧ _ʙᴏᴛ ʜᴀʀᴜꜱ ᴊᴀᴅɪ ᴀᴅᴍɪɴ ᴀɢᴀʀ ʙɪꜱᴀ ʜᴀᴘᴜꜱ ᴘᴇꜱᴀɴ._\n╰┈┈┈┈┈┈┈┈⬡`);
}
async function offHandler(m, { args = [] }) {
    const from = m.chat;
    const fitur = (args[0] || '').toLowerCase();
    if (!fitur) return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴄᴏɴᴛᴏʜ: .ᴏꜰꜰ ᴀɴᴛɪʙᴏᴛ\n╰┈┈┈┈┈┈┈┈⬡`);
    if (!VALID_KEYS.includes(fitur)) return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ꜰɪᴛᴜʀ *${fitur}* ᴛɪᴅᴀᴋ ᴅɪᴋᴇɴᴀʟ!\n╰┈┈┈┈┈┈┈┈⬡`);
    const grp = db.getGroup(from);
    const settings = grp?.settings || {};
    if (!settings[fitur]) return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ *${FEATURES[fitur]}* ᴍᴇᴍᴀɴɢ ꜱᴜᴅᴀʜ ɴᴏɴᴀᴋᴛɪꜰ!\n╰┈┈┈┈┈┈┈┈⬡`);
    db.updateGroup(from, { [fitur]: false });
    return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ *${FEATURES[fitur]}* ʙᴇʀʜᴀꜱɪʟ ᴅɪɴᴏɴᴀᴋᴛɪꜰᴋᴀɴ!\n╰┈┈┈┈┈┈┈┈⬡`);
}
async function statusHandler(m) {
    const from = m.chat;
    const grp = db.getGroup(from);
    const settings = grp?.settings || {};
    let text = `╭┈┈⬡「 *ᴀɴᴛɪ ꜱᴛᴀᴛᴜꜱ* 」\n┃\n`;
    for (const key of ORDER) text += `┃ ✧ ${statusOf(settings, key)}  ${FEATURES[key]}\n`;
    text += `╰┈┈┈┈┈┈┈┈⬡`;
    return m.reply(text);
}
async function delwarnHandler(m, { args = [] }) {
    const from = m.chat;
    let targetJid = null;
    if (m.quoted?.sender) targetJid = m.quoted.sender;
    else if (m.mentionedJid?.[0]) targetJid = m.mentionedJid[0];
    else if (args[0]) {
        const num = args[0].replace(/[^0-9]/g, '');
        if (num.length >= 6) targetJid = num + '@s.whatsapp.net';
    }
    if (!targetJid) return m.reply(`╭┈┈⬡「 *ʀᴇᴘʟʏ/ᴍᴇɴᴛɪᴏɴ/ɴᴏᴍᴏʀ ᴜꜱᴇʀ ʏᴀɴɢ ᴍᴀᴜ ᴅɪʀᴇꜱᴇᴛ ᴡᴀʀɴɴʏᴀ.* 」\n┃ ✧ ᴄᴏɴᴛᴏʜ: .ᴅᴇʟᴡᴀʀɴ @ᴜꜱᴇʀ\n╰┈┈┈┈┈┈┈┈⬡`);
    const grp = db.getGroup(from);
    const warns = grp?.settings?.warns || {};
    if (!warns[targetJid] || warns[targetJid].count === 0) return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ @${targetJid.split('@')[0]} ᴛɪᴅᴀᴋ ᴘᴜɴʏᴀ ᴡᴀʀɴ.\n╰┈┈┈┈┈┈┈┈⬡`);
    const before = warns[targetJid].count;
    warns[targetJid].count = 0;
    db.updateGroup(from, { warns });
    return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴡᴀʀɴ @${targetJid.split('@')[0]} ᴅɪʀᴇꜱᴇᴛ! (ꜱᴇʙᴇʟᴜᴍɴʏᴀ: ${before}/5)\n╰┈┈┈┈┈┈┈┈⬡`);
}
async function listwarnHandler(m) {
    const from = m.chat;
    const grp = db.getGroup(from);
    const warns = grp?.settings?.warns || {};
    const aktif = Object.entries(warns).filter(([, v]) => v.count > 0);
    if (!aktif.length) return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴛɪᴅᴀᴋ ᴀᴅᴀ ᴜꜱᴇʀ ʏᴀɴɢ ᴘᴜɴʏᴀ ᴡᴀʀɴ.\n╰┈┈┈┈┈┈┈┈⬡`);
    let list = `╭┈┈⬡「 *ʟɪꜱᴛ ᴡᴀʀɴ ɢʀᴜᴘ* 」\n┃\n`;
    aktif.sort((a, b) => b[1].count - a[1].count).forEach(([jid, data], i) => {
        list += `┃ ✧ ${i + 1}. @${jid.split('@')[0]} — *${data.count}/5*\n`;
    });
    list += `┃\n┃ ✧ *.ᴅᴇʟᴡᴀʀɴ @ᴜꜱᴇʀ* ᴜɴᴛᴜᴋ ʀᴇꜱᴇᴛ\n╰┈┈┈┈┈┈┈┈⬡`;
    return m.reply(list);
}
const handler = async (m, ctx) => {
    const cmd = m.command || '';
    if (cmd === 'on') return onHandler(m, ctx);
    if (cmd === 'off') return offHandler(m, ctx);
    if (['antistatus', 'groupstatus', 'statusgrup'].includes(cmd)) return statusHandler(m, ctx);
    if (['delwarn', 'resetwarn', 'clearwarn'].includes(cmd)) return delwarnHandler(m, ctx);
    if (['listwarn', 'warnlist'].includes(cmd)) return listwarnHandler(m, ctx);
};
handler.help = ['on <fitur>', 'off <fitur>', 'antistatus', 'delwarn', 'listwarn'];
handler.tags = ['group', 'anti', 'warn'];
handler.command = /^(on|off|antistatus|groupstatus|statusgrup|delwarn|resetwarn|clearwarn|listwarn|warnlist)$/i;
handler.group = true;
handler.admin = true;
handler.onText = async (m, { conn, participants }) => {
    if (!m.isGroup) return false;
    if (!m.message) return false;
    if (m.fromMe) return false;
    const senderJid = m.senderPn || m.sender || m.key?.participant || m.key?.remoteJid || '';
    if (!senderJid) return false;
    if (await isSenderAdminInGroup(conn, m.chat, senderJid, participants)) return false;
    const grp = db.getGroup(m.chat);
    if (!grp) return false;
    const settings = grp.settings || {};
    if (settings.antibot && isBotMessage(m)) { await act(conn, m, FEATURES.antibot, senderJid); return false; }
    if (settings.antivideo && m.type === 'videoMessage') { await act(conn, m, FEATURES.antivideo, senderJid); return false; }
    if (settings.antifoto && m.type === 'imageMessage') { await act(conn, m, FEATURES.antifoto, senderJid); return false; }
    if (settings.antiaudio && m.type === 'audioMessage') { await act(conn, m, FEATURES.antiaudio, senderJid); return false; }
    if (settings.antidokumen && m.type === 'documentMessage') { await act(conn, m, FEATURES.antidokumen, senderJid); return false; }
    if (settings.antisticker && m.type === 'stickerMessage') { await act(conn, m, FEATURES.antisticker, senderJid); return false; }
    if (settings.antimention && m.type === 'groupStatusMentionMessage') { await act(conn, m, FEATURES.antimention, senderJid); return false; }
    return false;
};
handler.limit = true;
export default handler;
