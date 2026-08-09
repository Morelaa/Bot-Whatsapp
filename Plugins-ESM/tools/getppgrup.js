'use strict';
import config from '../../config.js';
const FOOTER = `© ${config.copyrightName || config.botName || 'Bot'}`;
const handler = async (m, { conn }) => {
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
    try {
        const url = await conn.profilePictureUrl(m.chat, 'image');
        await conn.sendMessage(m.chat, {
            image: { url },
            caption: `╭┈┈⬡「 🖼️ *ꜰᴏᴛᴏ ɢʀᴜᴘ* 」\n┃ ✧ ${url}\n╰┈┈┈┈┈┈┈┈⬡\n\n${FOOTER}`,
        }, { quoted: m.raw });
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
    } catch {
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ɢʀᴜᴘ ᴛɪᴅᴀᴋ ᴘᴜɴʏᴀ ꜰᴏᴛᴏ ᴀᴛᴀᴜ ᴛɪᴅᴀᴋ ʙɪꜱᴀ ᴅɪᴀᴋꜱᴇꜱ\n╰┈┈┈┈┈┈┈┈⬡`);
    }
};
handler.command = /^(getppgrup|ppgrup|fotogroup)$/i;
handler.tags = ['tools'];
handler.help = ['getppgrup'];
handler.group = true;
handler.limit = true;
export default handler;
