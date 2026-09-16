//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import sharp from 'sharp';
import { findMediaMessage, downloadMessageMedia } from '../../Library/handle.js';
const handler = async (m, { conn }) => {
    const media = findMediaMessage(m);
    if (!media || media.type !== 'stickerMessage') {
        await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ʀᴇᴘʟʏ ꜱᴛɪᴄᴋᴇʀ-ɴʏᴀ ᴅᴇɴɢᴀɴ ᴄᴀᴘᴛɪᴏɴ .ᴛᴏɪᴍɢ ʏᴀ.\n╰┈┈┈┈┈┈┈┈⬡`);
        return;
    }
    const buffer = await downloadMessageMedia(m, conn);
    if (!buffer?.length) {
        await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ɢᴀɢᴀʟ ᴅᴏᴡɴʟᴏᴀᴅ ꜱᴛɪᴄᴋᴇʀ.\n╰┈┈┈┈┈┈┈┈⬡`);
        return;
    }
    const png = await sharp(buffer).png().toBuffer();
    await conn.sendMessage(m.chat, { image: png, caption: ' Berhasil diubah jadi gambar.' }, { quoted: m.raw });
};
handler.help = ['toimg'];
handler.tags = ['sticker'];
handler.command = /^(toimg|toimage)$/i;
handler.limit = true;
export default handler;
