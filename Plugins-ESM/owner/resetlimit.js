'use strict';
import config from '../../config.js';
import db from '../../Database/db.js';
import usagelimit from '../../Database/usagelimit.js';
const handler = async (m, { conn, text }) => {
    const botName = config.botName;
    const arg = (text || '').trim().toLowerCase();
    if (arg === 'all') {
        const changed = usagelimit.resetAllUsage();
        await conn.sendMessage(m.chat, { react: { text: '', key: m.key } });
        await m.reply(
            `╭┈┈⬡「 *ʀᴇꜱᴇᴛ ʟɪᴍɪᴛ ᴀʟʟ* 」\n┃\n` +
            `┃ ✧ ʙᴇʀʜᴀꜱɪʟ ʀᴇꜱᴇᴛ ʟɪᴍɪᴛ *${changed}* ᴅᴀᴛᴀ ᴜꜱᴇʀ\n┃\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n꒰ © ${botName} ꒱`
        );
        return;
    }
    if (arg === 'reply') {
        if (!m.quoted) {
            await m.reply(
                `╭┈┈⬡「 *ᴄᴀʀᴀ ʀᴇꜱᴇᴛʟɪᴍɪᴛ* 」\n┃\n` +
                `┃ ✧ ʀᴇᴘʟʏ ᴘᴇꜱᴀɴ ᴜꜱᴇʀ ʏᴀɴɢ ᴍᴀᴜ ᴅɪʀᴇꜱᴇᴛ\n` +
                `┃ ✧ ʟᴀʟᴜ ᴋᴇᴛɪᴋ *.ʀᴇꜱᴇᴛʟɪᴍɪᴛ ʀᴇᴘʟʏ*\n┃\n` +
                `╰┈┈┈┈┈┈┈┈⬡\n\n꒰ © ${botName} ꒱`
            );
            return;
        }
        const targetJid = m.quoted.sender || m.quoted.key?.participant || m.quoted.key?.remoteJid;
        if (!targetJid) {
            await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ɢᴀɢᴀʟ ᴍᴇɴᴅᴀᴘᴀᴛᴋᴀɴ ᴛᴀʀɢᴇᴛ ᴅᴀʀɪ ᴘᴇꜱᴀɴ ʏᴀɴɢ ᴅɪʀᴇᴘʟʏ.\n╰┈┈┈┈┈┈┈┈⬡`);
            return;
        }
        const ok = usagelimit.resetUsage(targetJid);
        const nomor = targetJid.replace('@s.whatsapp.net', '').replace(/[^0-9]/g, '');
        const nama = db.getUser(targetJid)?.name || nomor;
        await conn.sendMessage(m.chat, { react: { text: '', key: m.key } });
        await m.reply(
            `╭┈┈⬡「 *ʀᴇꜱᴇᴛ ʟɪᴍɪᴛ* 」\n┃\n` +
            `┃ ✧ ${ok ? ' Berhasil reset' : ' Belum ada data'} ʟɪᴍɪᴛ *${nama}*\n┃\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n꒰ © ${botName} ꒱`
        );
        return;
    }
    await m.reply(
        `╭┈┈⬡「 *ᴄᴀʀᴀ ʀᴇꜱᴇᴛʟɪᴍɪᴛ* 」\n┃\n` +
        `┃ ✧ *.ʀᴇꜱᴇᴛʟɪᴍɪᴛ ʀᴇᴘʟʏ* — ʀᴇᴘʟʏ ᴘᴇꜱᴀɴ ᴜꜱᴇʀ\n` +
        `┃ ✧ *.ʀᴇꜱᴇᴛʟɪᴍɪᴛ ᴀʟʟ* — ʀᴇꜱᴇᴛ ꜱᴇᴍᴜᴀ ᴜꜱᴇʀ\n┃\n` +
        `╰┈┈┈┈┈┈┈┈⬡\n\n꒰ © ${botName} ꒱`
    );
};
handler.help = ['resetlimit reply', 'resetlimit all'];
handler.tags = ['owner'];
handler.noLimit = true;
handler.command = /^(resetlimit)$/i;
handler.owner = true;
export default handler;
