'use strict';
import config from '../../config.js';
import { ButtonV2 } from '../../Library/MessageBuilder.js';
import { toPhoneJid, isLidJid } from '../../Library/resolve.js';
import { buildFkontak } from '../../Library/utils.js';
import bratoriginalHandler from './bratoriginal.js';
import bratruromiyaHandler from './bratruromiya.js';
import bratvidHandler from './bratvid.js';
const footer = `© ${config.copyrightName || config.botName}`;
const bratSessions = new Map();
const SESSION_TTL_MS = 2 * 60 * 1000;
async function resolveSenderThumb(sock, m) {
    try {
        const rawSender = m.sender;
        let jid = null;
        if (isLidJid(rawSender) && m.senderAlt && !isLidJid(m.senderAlt)) {
            jid = toPhoneJid(m.senderAlt) || m.senderAlt;
        } else {
            jid = toPhoneJid(rawSender) || rawSender;
        }
        const url = await sock.profilePictureUrl(jid, 'image');
        if (url) return url;
    } catch {}
    try {
        const botJid = (sock.user?.id?.split(':')[0] || '') + '@s.whatsapp.net';
        const botUrl = await sock.profilePictureUrl(botJid, 'image');
        if (botUrl) return botUrl;
    } catch {}
    return null;
}
async function sendBratMenu(m, conn, text) {
    const thumb = await resolveSenderThumb(conn, m);
    const btn = new ButtonV2(conn)
        .setTitle(' Brat Sticker')
        .setSubtitle(`Teks: ${text}`)
        .setBody(`Pilih style\n\n` + `◦  Original\n` + `◦  Ruromiya\n` + `◦  Vid`)
        .setFooter(footer);
    if (thumb) btn.setThumbnail(thumb);
    btn.addButton(' Original', '.brat_orig');
    btn.addButton(' Ruromiya', '.brat_ruromiya');
    btn.addButton(' Vid', '.brat_vid');
    const built = await btn.build(m.chat, { quoted: (await buildFkontak(conn, config).catch(() => null)) || m.raw });
    await conn.relayMessage(m.chat, built.message, { messageId: built.key.id });
}
const BUTTON_CMDS = new Set(['brat_orig', 'brat_ruromiya', 'brat_vid']);
const CMD_MAP = {
    brat_orig: { plugin: bratoriginalHandler, command: 'bratoriginal' },
    brat_ruromiya: { plugin: bratruromiyaHandler, command: 'bratruromiya' },
    brat_vid: { plugin: bratvidHandler, command: 'bratvid' },
};
const handler = async (m, { conn, text, command, usedPrefix }) => {
    if (BUTTON_CMDS.has(command)) {
        const session = bratSessions.get(m.sender);
        if (!session) return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴋᴇᴛɪᴋ ᴜʟᴀɴɢ ʙʀᴀᴛ ʟᴀɢɪ\n╰┈┈┈┈┈┈┈┈⬡`);
        bratSessions.delete(m.sender);
        const target = CMD_MAP[command];
        if (!target) return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴘʟᴜɢɪɴ ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ!\n╰┈┈┈┈┈┈┈┈⬡`);
        return target.plugin(m, {
            conn,
            text: session.text,
            args: session.text.split(' '),
            usedPrefix: usedPrefix || '.',
            command: target.command,
        });
    }
    if (!text?.trim())
        return m.reply(
            `╭┈┈⬡「 *ʙʀᴀᴛ ꜱᴛɪᴄᴋᴇʀ* 」\n` +
            `┃ ✧ ᴄᴏɴᴛᴏʜ: *${usedPrefix}ʙʀᴀᴛ ʜᴀʟᴏɪɪ*\n` +
            `┃\n` +
            `┃ ✧ ꜱᴛʏʟᴇ ᴅᴇɴɢᴀɴ ʙᴜᴛᴛᴏɴ:\n` +
            `┃ ✧ ᴏʀɪɢɪɴᴀʟ\n` +
            `┃ ✧ ʀᴜʀᴏᴍɪʏᴀ\n` +
            `┃ ✧ ᴠɪᴅ\n` +
            `┃\n` +
            `┃ ✧ ꜱᴛʏʟᴇ ᴋᴇᴛɪᴋ ʟᴀɴɢꜱᴜɴɢ:\n` +
            `┃ ✧ ${usedPrefix}ʙʀᴀᴛᴠ2 <ᴛᴇᴋꜱ>\n` +
            `┃ ✧ ${usedPrefix}ʙʀᴀᴛɢᴜʀᴀ <ᴛᴇᴋꜱ>\n` +
            `┃ ✧ ${usedPrefix}ʙʀᴀᴛꜱᴘᴏɴɢᴇʙᴏʙ <ᴛᴇᴋꜱ>\n` +
            `┃ ✧ ${usedPrefix}ʙʀᴀᴛᴛʀᴇɴ <ᴛᴇᴋꜱ>\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n${footer}`
        );
    bratSessions.set(m.sender, { text: text.trim() });
    setTimeout(() => bratSessions.delete(m.sender), SESSION_TTL_MS);
    await sendBratMenu(m, conn, text.trim());
};
handler.command = /^(brat|brat_orig|brat_ruromiya|brat_vid)$/i;
handler.tags = ['sticker'];
handler.help = ['brat <teks>'];
handler.limit = true;
export default handler;
