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
export async function sendWelcome(sock, groupJid, memberJid, groupName, memberCount, pushname) {
    const safeJid = sanitizeJid(memberJid);
    if (!safeJid) {
        console.warn('[WELCOME] JID tidak valid, skip:', memberJid);
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
        `Halo @${userNum} \n\n` +
        `Selamat datang di grup *${groupName}* ` +
        (username && username !== userNum ? `\nNama: *${username}*` : '');
    try {
        const thumb = await resolveThumbnail(sock, safeJid);
        const btn = new ButtonV2(sock)
            .setTitle(groupName)
            .setSubtitle(` Member ke-${memberCount}`)
            .setBody(bodyText)
            .setFooter(footer)
            .setContextInfo({ mentionedJid: [phoneJid] });
        if (thumb) btn.setThumbnail(thumb);
        btn.addButton('Menu', '.menu');
        btn.addButton('Daftar', '.daftar');
        const msg = await btn.build(groupJid, { userJid: sock.user?.id });
        await sock.relayMessage(groupJid, msg.message, { messageId: msg.key.id });
        console.log(`[WELCOME]  ${username} (@${userNum}) | pp=${!!thumb}`);
    } catch (e) {
        console.error('[WELCOME] ButtonV2 error:', e?.message);
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
        const current = !!groupData?.settings?.welcome;
        if (!mode || mode === 'status' || mode === 'cek') {
            return m.reply(`╭┈┈⬡「 *ᴡᴇʟᴄᴏᴍᴇ ꜱᴛᴀᴛᴜꜱ* 」\n┃\n┃ ✧ ᴡᴇʟᴄᴏᴍᴇ : ${current ? ' AKTIF' : ' NONAKTIF'}\n┃\n┃ ✧ *.ᴡᴇʟᴄᴏᴍᴇ ᴏɴ/ᴏꜰꜰ* — ᴀᴛᴜʀ ᴡᴇʟᴄᴏᴍᴇ\n┃ ✧ *.ᴡᴇʟᴄᴏᴍᴇ @ᴛᴀɢ* / *.ᴛᴇꜱᴡᴇʟᴄᴏᴍᴇ @ᴛᴀɢ* — ᴛᴇꜱᴛ ᴍᴀɴᴜᴀʟ\n╰┈┈┈┈┈┈┈┈⬡`);
        }
        if (mode === 'on') {
            if (current) return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴡᴇʟᴄᴏᴍᴇ ꜱᴜᴅᴀʜ ᴀᴋᴛɪꜰ!\n╰┈┈┈┈┈┈┈┈⬡`);
            upsertGroupSettings(from, groupMeta?.subject ?? null, { welcome: true });
            return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ *ᴡᴇʟᴄᴏᴍᴇ ᴅɪᴀᴋᴛɪꜰᴋᴀɴ!*\n╰┈┈┈┈┈┈┈┈⬡`);
        }
        if (mode === 'off') {
            if (!current) return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴡᴇʟᴄᴏᴍᴇ ꜱᴜᴅᴀʜ ɴᴏɴᴀᴋᴛɪꜰ!\n╰┈┈┈┈┈┈┈┈⬡`);
            upsertGroupSettings(from, groupMeta?.subject ?? null, { welcome: false });
            return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ *ᴡᴇʟᴄᴏᴍᴇ ᴅɪɴᴏɴᴀᴋᴛɪꜰᴋᴀɴ!*\n╰┈┈┈┈┈┈┈┈⬡`);
        }
        return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ɢᴜɴᴀᴋᴀɴ: .ᴡᴇʟᴄᴏᴍᴇ ᴏɴ / ᴏꜰꜰ / ꜱᴛᴀᴛᴜꜱ / @ᴛᴀɢ\n╰┈┈┈┈┈┈┈┈⬡`);
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
        await sendWelcome(conn, from, safeTarget, groupName, memberCount, pushname);
        m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴡᴇʟᴄᴏᴍᴇ ᴛᴇꜱᴛ ᴛᴇʀᴋɪʀɪᴍ!\n╰┈┈┈┈┈┈┈┈⬡`);
    } catch (e) {
        console.error('[WELCOME CMD ERROR]', e?.message);
        m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴇʀʀᴏʀ: ${e?.message}\n╰┈┈┈┈┈┈┈┈⬡`);
    }
};
handler.help = ['welcome on', 'welcome off', 'welcome @tag', 'teswelcome @tag'];
handler.tags = ['admin'];
handler.command = /^(welcome|testwelcome|teswelcome|setwelcome)$/i;
handler.admin = true;
handler.group = true;
handler.limit = true;
export default handler;
