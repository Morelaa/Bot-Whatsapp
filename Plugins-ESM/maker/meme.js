'use strict';
import { createMeme } from '../../Library/meme.js';
import { findMediaMessage, downloadMessageMedia } from '../../Library/handle.js';
const handler = async (m, { conn, text }) => {
    const media = findMediaMessage(m);
    if (!media || media.type !== 'imageMessage') {
        await m.reply(`╭┈┈⬡「 *ʀᴇᴘʟʏ ɢᴀᴍʙᴀʀ ᴅᴇɴɢᴀɴ ᴄᴀᴘᴛɪᴏɴ .ᴍᴇᴍᴇ ᴛᴇᴋꜱᴀᴛᴀꜱ|ᴛᴇᴋꜱʙᴀᴡᴀʜ ʏᴀ.* 」\n┃ ✧ ᴄᴏɴᴛᴏʜ: .ᴍᴇᴍᴇ ᴋᴇᴛɪᴋᴀ ʙᴏᴛ|ᴇʀʀᴏʀ ʟᴀɢɪ\n╰┈┈┈┈┈┈┈┈⬡`);
        return;
    }
    if (!text) {
        await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴋᴀꜱɪʜ ᴛᴇᴋꜱɴʏᴀ. ꜰᴏʀᴍᴀᴛ: .ᴍᴇᴍᴇ ᴛᴇᴋꜱᴀᴛᴀꜱ|ᴛᴇᴋꜱʙᴀᴡᴀʜ\n╰┈┈┈┈┈┈┈┈⬡`);
        return;
    }
    const [top = '', bottom = ''] = text.split('|').map((s) => s.trim());
    const buffer = await downloadMessageMedia(m, conn);
    if (!buffer?.length) {
        await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ɢᴀɢᴀʟ ᴅᴏᴡɴʟᴏᴀᴅ ɢᴀᴍʙᴀʀ.\n╰┈┈┈┈┈┈┈┈⬡`);
        return;
    }
    const result = await createMeme(buffer, { topText: top, bottomText: bottom });
    await conn.sendMessage(m.chat, { image: result }, { quoted: m.raw });
};
handler.help = ['meme teksatas|teksbawah'];
handler.tags = ['maker'];
handler.command = /^meme$/i;
handler.limit = true;
export default handler;
