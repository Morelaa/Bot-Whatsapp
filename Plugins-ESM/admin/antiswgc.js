'use strict';
import db from '../../Database/db.js';
import {
    isLidJid,
    resolveLidToPhone,
    normNum,
    findParticipant,
    safeKickJid,
    resolveBotAdmin,
    isSenderAdminInGroup,
} from '../../Library/resolve.js';

const SWGC_TYPES = new Set(['groupStatusMessageV2', 'groupStatusMessage']);
const WRAPPER_TYPES = new Set([
    'ephemeralMessage',
    'viewOnceMessage',
    'viewOnceMessageV2',
    'viewOnceMessageV2Extension',
]);

function getEffectiveTypeAndSender(m) {
    let node = m.message;
    let type = m.type;
    for (let i = 0; i < 4 && node && WRAPPER_TYPES.has(type); i++) {
        const wrapped = node?.[type]?.message;
        if (!wrapped) break;
        const innerType = Object.keys(wrapped).find(
            (k) => k !== 'messageContextInfo' && k !== 'senderKeyDistributionMessage'
        );
        if (!innerType) break;
        node = wrapped;
        type = innerType;
    }
    return type;
}

function resolveDisplay(m, senderJid) {
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
        m.pushName ||
        (resolvedPhone ? `+${phoneNum}` : rawLidNum);
    return { phoneNum, mentionJid, displayName };
}

async function kickNoWarn(sock, m, senderJid, botAdmin) {
    const { phoneNum, mentionJid, displayName } = resolveDisplay(m, senderJid);
    await sock.sendMessage(m.chat, {
        text:
            ` *Anti SWGC — Terdeteksi!*\n\n` +
            `@${phoneNum} dikeluarkan dari grup karena:\n` +
            ` *Mengirim Status Grup (SWGC)*\n\n` +
            `Nama: *${displayName}*\n` +
            `_Tindakan: Kick langsung, tanpa peringatan_`,
        mentions: [mentionJid],
    }, { quoted: m.raw });
    const effectiveBotAdmin = botAdmin || (await resolveBotAdmin(sock, m.chat));
    if (!effectiveBotAdmin) return;
    try {
        const meta = await sock.groupMetadata(m.chat);
        const target = findParticipant(meta?.participants, senderJid);
        const kickJid = safeKickJid(target) || senderJid;
        await sock.groupParticipantsUpdate(m.chat, [kickJid], 'remove');
    } catch (e) {
        console.error('[ANTI-SWGC] kick error:', e?.message);
    }
}

const handler = async (m, { args }) => {
    const from = m.chat;
    const mode = (args[0] || '').toLowerCase();
    const grp = db.getGroup(from);
    const current = grp?.settings?.antiswgc || false;
    if (!mode || mode === 'status' || mode === 'cek') {
        return m.reply(
            `╭┈┈⬡「 *ᴀɴᴛɪ sᴡɢᴄ* 」\n┃\n` +
            `┃ ✧ ꜱᴛᴀᴛᴜꜱ: ${current ? ' AKTIF' : ' NONAKTIF'}\n┃\n` +
            `┃ ✧ sɪᴀᴘᴀ ᴘᴜɴ ʏᴀɴɢ ᴋɪʀɪᴍ ꜱᴛᴀᴛᴜꜱ ɢʀᴜᴘ (SWGC)\n` +
            `┃ ✧  ʟᴀɴɢꜱᴜɴɢ ᴋɪᴄᴋ, ᴛᴀɴᴘᴀ ᴘᴇʀɪɴɢᴀᴛᴀɴ\n┃\n` +
            `┃ ✧ *.ᴀɴᴛɪsᴡɢᴄ ᴏɴ*  — ᴀᴋᴛɪꜰᴋᴀɴ\n` +
            `┃ ✧ *.ᴀɴᴛɪsᴡɢᴄ ᴏꜰꜰ* — ɴᴏɴᴀᴋᴛɪꜰᴋᴀɴ\n╰┈┈┈┈┈┈┈┈⬡`
        );
    }
    if (mode === 'on' || mode === 'aktif') {
        if (current) return m.reply('╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴀɴᴛɪ sᴡɢᴄ ꜱᴜᴅᴀʜ ᴀᴋᴛɪꜰ!\n╰┈┈┈┈┈┈┈┈⬡');
        db.updateGroup(from, { antiswgc: true });
        return m.reply('╭┈┈⬡「 *ᴀɴᴛɪ sᴡɢᴄ ᴀᴋᴛɪꜰ* 」\n┃ ✧ ʙᴇʀʜᴀꜱɪʟ ᴅɪᴀᴋᴛɪꜰᴋᴀɴ!\n┃ ✧ _ᴘᴀꜱᴛɪᴋᴀɴ ʙᴏᴛ ꜱᴜᴅᴀʜ ᴊᴀᴅɪ ᴀᴅᴍɪɴ!_\n╰┈┈┈┈┈┈┈┈⬡');
    }
    if (mode === 'off' || mode === 'nonaktif') {
        if (!current) return m.reply('╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴀɴᴛɪ sᴡɢᴄ ᴍᴇᴍᴀɴɢ ꜱᴜᴅᴀʜ ɴᴏɴᴀᴋᴛɪꜰ!\n╰┈┈┈┈┈┈┈┈⬡');
        db.updateGroup(from, { antiswgc: false });
        return m.reply('╭┈┈⬡「 *ʙᴇʀʜᴀꜱɪʟ* 」\n┃ ✧ ᴀɴᴛɪ sᴡɢᴄ ᴅɪɴᴏɴᴀᴋᴛɪꜰᴋᴀɴ!\n╰┈┈┈┈┈┈┈┈⬡');
    }
    return m.reply('╭┈┈⬡「 *ᴇʀʀᴏʀ* 」\n┃ ✧ ɢᴜɴᴀᴋᴀɴ: *.ᴀɴᴛɪsᴡɢᴄ ᴏɴ/ᴏꜰꜰ/ꜱᴛᴀᴛᴜꜱ*\n╰┈┈┈┈┈┈┈┈⬡');
};
handler.help = ['antiswgc on', 'antiswgc off', 'antiswgc status'];
handler.tags = ['group', 'anti'];
handler.command = /^antiswgc$/i;
handler.group = true;
handler.admin = true;
handler.onText = async (m, { conn, participants }) => {
    if (!m.isGroup) return false;
    if (!m.message) return false;
    if (m.chat === 'status@broadcast') return false;
    const effectiveType = getEffectiveTypeAndSender(m);
    if (!SWGC_TYPES.has(effectiveType)) return false;
    const grp = db.getGroup(m.chat);
    if (!grp?.settings?.antiswgc) return false;
    if (m.fromMe) {
        await conn.sendMessage(m.chat, {
            text:
                ` *Anti SWGC — Deteksi Aktif*\n\n` +
                `Status grup (SWGC) terdeteksi di sini.\n` +
                `_Pengirim: bot sendiri  tidak di-kick._\n` +
                `_Kalau ini dikirim member lain, mereka akan langsung di-kick tanpa peringatan._`,
        }, { quoted: m.raw });
        return false;
    }
    const senderJid = m.senderPn || m.sender || m.key?.participant || m.key?.remoteJid || '';
    if (!senderJid) return false;
    if (await isSenderAdminInGroup(conn, m.chat, senderJid, participants)) return false;
    const botAdmin = await resolveBotAdmin(conn, m.chat, participants);
    await kickNoWarn(conn, m, senderJid, botAdmin);
    return false;
};
handler.limit = true;
export default handler;
