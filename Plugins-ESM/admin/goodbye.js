'use strict';
import config from '../../config.js';
import { getGroup, upsertGroupSettings, getPushName } from '../../Database/db.js';
import { ButtonV2 } from '../../Library/MessageBuilder.js';
import { toPhoneJid, isLidJid, resolveLidToPhone, normNum, findParticipant } from '../../Library/resolve.js';
const footer = `© ${config.copyrightName || config.botName}`;
function sanitizeJid(jid) {
    if (!jid || typeof jid !== 'string') return null;
    const t = jid.trim();
    if (!t || t.endsWith('@g.us')) return null;
    return toPhoneJid(t);
}
async function resolveThumbnail(sock, targetJid) {
    try {
        const url = await sock.profilePictureUrl(targetJid, 'image');
        if (url) return url;
    } catch {}
    try {
        const botJid = (sock.user?.id?.split(':')[0] || '') + '@s.whatsapp.net';
        const botUrl = await sock.profilePictureUrl(botJid, 'image');
        if (botUrl) return botUrl;
    } catch {}
    return null;
}
export async function sendGoodbye(sock, groupJid, memberJid, groupName, memberCount, pushname) {
    const safeJid = sanitizeJid(memberJid);
    if (!safeJid) {
        console.warn('[GOODBYE] JID tidak valid, skip:', memberJid);
        return;
    }
    const rawLidNum = memberJid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
    const isLid = isLidJid(memberJid);
    const phone = isLid ? resolveLidToPhone(memberJid) : null;
    const userNum = phone ? phone : (isLid ? rawLidNum : normNum(safeJid));
    const phoneJid = phone ? `${phone}@s.whatsapp.net` : safeJid;
    const username =
        (typeof pushname === 'string' && pushname.trim() ? pushname.trim() : null) ||
        getPushName(memberJid) ||
        getPushName(rawLidNum) ||
        (phone ? getPushName(`${phone}@s.whatsapp.net`) : null) ||
        (phone ? getPushName(phone) : null) ||
        userNum;
    const bodyText =
        `Sampai jumpa @${userNum} \n\n` +
        `Semoga ketemu lagi di grup *${groupName}* ` +
        (username && username !== userNum ? `\nNama: *${username}*` : '');
    try {
        const thumb = await resolveThumbnail(sock, safeJid);
        const btn = new ButtonV2(sock)
            .setTitle(groupName)
            .setSubtitle(` Sisa ${memberCount} member`)
            .setBody(bodyText)
            .setFooter(footer)
            .setContextInfo({ mentionedJid: [phoneJid] });
        if (thumb) btn.setThumbnail(thumb);
        btn.addButton('Menu', '.menu');
        btn.addButton('Profil', `.profil ${userNum}`);
        const msg = await btn.build(groupJid, { userJid: sock.user?.id });
        await sock.relayMessage(groupJid, msg.message, { messageId: msg.key.id });
        console.log(`[GOODBYE]  ${username} (@${userNum}) | pp=${!!thumb}`);
    } catch (e) {
        console.error('[GOODBYE] ButtonV2 error:', e?.message);
        try {
            await sock.sendMessage(groupJid, { text: bodyText, mentions: [phoneJid] });
        } catch {}
    }
}
const handler = async (m, { conn, args, participants, groupMeta }) => {
    const from = m.chat;
    const mode = (args[0] || '').toLowerCase();
    const hasMention = m.mentionedJid?.length > 0;
    if (!hasMention) {
        const groupData = getGroup(from);
        const current = !!groupData?.settings?.goodbye;
        if (!mode || mode === 'status' || mode === 'cek') {
            return m.reply(`╭┈┈⬡「 *ɢᴏᴏᴅʙʏᴇ ꜱᴛᴀᴛᴜꜱ* 」\n┃\n┃ ✧ ɢᴏᴏᴅʙʏᴇ : ${current ? ' AKTIF' : ' NONAKTIF'}\n┃\n┃ ✧ *.ɢᴏᴏᴅʙʏᴇ ᴏɴ/ᴏꜰꜰ* — ᴀᴛᴜʀ ɢᴏᴏᴅʙʏᴇ\n┃ ✧ *.ɢᴏᴏᴅʙʏᴇ @ᴛᴀɢ* / *.ᴛᴇꜱɢᴏᴏᴅʙʏᴇ @ᴛᴀɢ* — ᴛᴇꜱᴛ ᴍᴀɴᴜᴀʟ\n╰┈┈┈┈┈┈┈┈⬡`);
        }
        if (mode === 'on') {
            if (current) return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ɢᴏᴏᴅʙʏᴇ ꜱᴜᴅᴀʜ ᴀᴋᴛɪꜰ!\n╰┈┈┈┈┈┈┈┈⬡`);
            upsertGroupSettings(from, groupMeta?.subject ?? null, { goodbye: true });
            return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ *ɢᴏᴏᴅʙʏᴇ ᴅɪᴀᴋᴛɪꜰᴋᴀɴ!*\n╰┈┈┈┈┈┈┈┈⬡`);
        }
        if (mode === 'off') {
            if (!current) return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ɢᴏᴏᴅʙʏᴇ ꜱᴜᴅᴀʜ ɴᴏɴᴀᴋᴛɪꜰ!\n╰┈┈┈┈┈┈┈┈⬡`);
            upsertGroupSettings(from, groupMeta?.subject ?? null, { goodbye: false });
            return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ *ɢᴏᴏᴅʙʏᴇ ᴅɪɴᴏɴᴀᴋᴛɪꜰᴋᴀɴ!*\n╰┈┈┈┈┈┈┈┈⬡`);
        }
        return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ɢᴜɴᴀᴋᴀɴ: .ɢᴏᴏᴅʙʏᴇ ᴏɴ / ᴏꜰꜰ / ꜱᴛᴀᴛᴜꜱ / @ᴛᴀɢ\n╰┈┈┈┈┈┈┈┈⬡`);
    }
    try {
        const meta = groupMeta || (await conn.groupMetadata(from));
        const groupName = meta.subject || 'Group';
        const memberCount = meta.participants?.length || 0;
        const targetJid = m.mentionedJid[0];
        const safeTarget = sanitizeJid(targetJid);
        if (!safeTarget) return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴊɪᴅ ᴛᴀʀɢᴇᴛ ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ!\n╰┈┈┈┈┈┈┈┈⬡`);
        const list = participants || meta.participants;
        const participant = findParticipant(list, safeTarget);
        const pushname = participant?.notify || participant?.name || null;
        await sendGoodbye(conn, from, safeTarget, groupName, memberCount, pushname);
        m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ɢᴏᴏᴅʙʏᴇ ᴛᴇꜱᴛ ᴛᴇʀᴋɪʀɪᴍ!\n╰┈┈┈┈┈┈┈┈⬡`);
    } catch (e) {
        console.error('[GOODBYE CMD ERROR]', e?.message);
        m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴇʀʀᴏʀ: ${e?.message}\n╰┈┈┈┈┈┈┈┈⬡`);
    }
};
handler.help = ['goodbye on', 'goodbye off', 'goodbye @tag', 'tesgoodbye @tag'];
handler.tags = ['admin'];
handler.command = /^(goodbye|testgoodbye|tesgoodbye|setgoodbye)$/i;
handler.admin = true;
handler.group = true;
handler.limit = true;
export default handler;
