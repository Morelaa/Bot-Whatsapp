'use strict';
import axios from 'axios';
import fs from 'fs';
import * as baileys from '@itsliaaa/baileys';
import config from '../../config.js';
import db from '../../Database/db.js';
import {
    isOwner, isMainOwner, findParticipant, normNum, isLidJid,
    resolveTarget, resolvePhoneToLid, resolveDisplayName,
    autoMapParticipantLids, resolveSenderLidLive,
} from '../../Library/resolve.js';
const { prepareWAMessageMedia } = baileys;
async function resolveTargetJid(m, args, senderJid, conn, participants) {
    if (participants?.length) autoMapParticipantLids(participants);
    const { jid, raw, quotedPushName, source } = resolveTarget(m, args, {
        senderJid, fallbackSelf: true, minDigits: 8,
    });
    let finalJid = jid;
    if (finalJid && isLidJid(finalJid)) {
        const live = await resolveSenderLidLive(conn, m.chat, raw || finalJid);
        if (live) finalJid = live + '@s.whatsapp.net';
    }
    return { jid: finalJid, quotedPushName, isSelf: source === 'self' };
}
async function fetchPP(conn, jid) {
    const num = jid.split('@')[0].split(':')[0];
    const candidates = [jid, num + '@s.whatsapp.net', num + '@c.us'].filter((v, i, a) => a.indexOf(v) === i);
    for (const c of candidates) {
        try {
            const pp = await conn.profilePictureUrl(c, 'image');
            if (!pp) continue;
            const res = await axios.get(pp, { responseType: 'arraybuffer', timeout: 8000 });
            if (res.data?.byteLength > 500) return Buffer.from(res.data);
        } catch {  }
    }
    return null;
}
async function fetchPPWithFallback(conn, jid) {
    const userPP = await fetchPP(conn, jid);
    if (userPP) return { buffer: userPP, isBotPP: false };
    const botJid = conn.user?.id;
    if (botJid) {
        const botPP = await fetchPP(conn, botJid);
        if (botPP) return { buffer: botPP, isBotPP: true };
    }
    return { buffer: null, isBotPP: false };
}
async function fetchBio(conn, jid) {
    const num = jid.split('@')[0].split(':')[0];
    const candidates = [jid, num + '@s.whatsapp.net', num + '@c.us'].filter((v, i, a) => a.indexOf(v) === i);
    for (const c of candidates) {
        try {
            const res = await conn.fetchStatus(c);
            const item = Array.isArray(res) ? res[0] : res;
            const text = item?.status?.status || item?.status || item?.text || null;
            if (typeof text === 'string' && text.trim()) return text.trim();
        } catch {  }
    }
    return null;
}
function formatWIB() {
    return new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(new Date()).replace('.', ':') + ' WIB';
}
const handler = async (m, { conn, args, participants }) => {
    const { jid: targetJid, quotedPushName, isSelf } = await resolveTargetJid(m, args, m.senderPn || m.sender, conn, participants);
    if (!targetJid) return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴛᴀʀɢᴇᴛ ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ. ʀᴇᴘʟʏ, ᴍᴇɴᴛɪᴏɴ, ᴀᴛᴀᴜ ᴛᴜʟɪꜱ ɴᴏᴍᴏʀɴʏᴀ.\n╰┈┈┈┈┈┈┈┈⬡`);
    const num = normNum(targetJid);
    const userData = db.getUser(targetJid) || {};
    const isOwnerTarget = isOwner({ sender: targetJid }, config.owners, participants) || isMainOwner(num);
    const isPremTarget = !!userData.premium;
    const isBanned = !!userData.banned;
    let p = participants?.length ? findParticipant(participants, num) : null;
    const lidJid = resolvePhoneToLid(num) || (p?.lid ? normNum(p.lid) : null) || (p?.id?.endsWith('@lid') ? normNum(p.id) : null);
    let isTargetAdmin = false;
    if (p) isTargetAdmin = p.admin === 'admin' || p.admin === 'superadmin';
    const isReg = db.isRegistered(targetJid);
    let statusLabel;
    if (isBanned) statusLabel = 'BLACKLISTED';
    else if (isOwnerTarget) statusLabel = 'OWNER';
    else if (isPremTarget) statusLabel = 'PREMIUM';
    else if (isTargetAdmin) statusLabel = 'ADMIN GRUP';
    else if (isReg) statusLabel = 'MEMBER';
    else statusLabel = 'TIDAK TERDAFTAR';
    const resolvedName = await resolveDisplayName(conn, m, targetJid, { quotedPushName, participants, fallback: '' });
    const selfPushName = isSelf && typeof m.pushName === 'string' ? m.pushName.trim() : '';
    const displayName = userData.name || resolvedName || selfPushName || num;
    const tags = [];
    if (isOwnerTarget) tags.push('Owner');
    if (isPremTarget) tags.push('Premium');
    if (isTargetAdmin) tags.push('Admin Grup');
    const trustedLabel = tags.length ? tags.join(' • ') : 'Tidak ada akses khusus.';
    const [{ buffer: ppBuffer }, bio] = await Promise.all([fetchPPWithFallback(conn, targetJid), fetchBio(conn, targetJid)]);
    const caption =
        `◦ Name: *${displayName}*\n` +
        `◦ Number: *${num}*\n` +
        `◦ JID: \`${targetJid}\`\n` +
        `◦ LID: ${lidJid || 'Tidak diketahui'}\n` +
        `◦ Status: *${statusLabel}*\n` +
        `◦ Bio: _${bio || 'Tidak ada bio / privat'}_\n` +
        `◦ Banned: ${isBanned ? 'YA ' : 'TIDAK '}\n\n` +
        ` *TRUSTED ACCESS*\n${trustedLabel}\n\n` +
        ` *Last Update:* ${formatWIB()}\n` +
        `_Gunakan tombol di bawah untuk menyalin_`;
    const imgBuf = ppBuffer || (fs.existsSync(config.registerImage) ? fs.readFileSync(config.registerImage) : null);
    const interactiveButtons = [
        { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: ' Copy Name', copy_code: displayName }) },
        { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: ' Copy Number', copy_code: num }) },
        { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: ' Copy JID', copy_code: targetJid }) },
        ...(lidJid ? [{ name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: ' Copy LID', copy_code: lidJid }) }] : []),
        ...(bio ? [{ name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: ' Copy Bio', copy_code: bio }) }] : []),
    ];
    let ppImgMsg = null;
    if (imgBuf) {
        try {
            const media = await prepareWAMessageMedia({ image: imgBuf }, { upload: conn.waUploadToServer });
            ppImgMsg = media?.imageMessage;
        } catch {  }
    }
    try {
        await conn.relayMessage(m.chat, {
            interactiveMessage: {
                ...(ppImgMsg ? { header: { hasMediaAttachment: true, imageMessage: ppImgMsg } } : { header: { hasMediaAttachment: false } }),
                body: { text: caption },
                footer: { text: `© ${config.botName}` },
                contextInfo: { forwardingScore: 9, isForwarded: true, mentionedJid: [targetJid], quotedMessage: m.raw?.message },
                nativeFlowMessage: { buttons: interactiveButtons },
            },
        }, { messageId: conn.generateMessageTag ? conn.generateMessageTag() : undefined });
    } catch (e) {
        console.error('[USERINFO]', e?.message);
        await m.reply(caption);
    }
};
handler.help = [
    'userinfo          — info diri sendiri',
    'userinfo @tag     — info via mention',
    'userinfo (reply)  — info via reply pesan',
    'userinfo 6281xxx  — info via nomor',
];
handler.tags = ['tools'];
handler.command = /^(userinfo|cekuser|infouser)$/i;
handler.limit = true;
export default handler;
