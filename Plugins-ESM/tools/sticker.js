//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import { findMediaMessage, downloadMessageMedia } from '../../Library/handle.js';
import { makeSticker, imageToWebp, videoToWebp } from '../../Library/sticker.js';
import { sendStickerPack } from '../../Library/stickerPackHelper.js';
import { findAlbumChildren, unwrapAssociatedChild } from '../../Library/albumMedia.js';
import config from '../../config.js';
async function convertAlbumChildToSticker(child, conn) {
    const mediaType = Object.keys(child.message || {}).find((k) => k === 'imageMessage' || k === 'videoMessage');
    if (!mediaType) return null;
    const isVideo = mediaType === 'videoMessage';
    if (isVideo && (child.message[mediaType]?.seconds || 0) > 15) return null;
    const buffer = await conn.downloadMedia({ key: child.key, message: child.message });
    if (!buffer?.length) return null;
    const webp = isVideo ? await videoToWebp(buffer) : await imageToWebp(buffer);
    return { buffer: webp, ext: 'webp', mimetype: 'image/webp', isAnimated: isVideo, isLottie: false };
}
async function processAlbumToPack(m, conn, children, packName) {
    await m.reply(`╭┈┈⬡「 *ᴀʟʙᴜᴍ* 」\n┃ ✧ ᴅɪᴛᴇᴍᴜᴋᴀɴ ${children.length} ᴍᴇᴅɪᴀ, ʟᴀɢɪ ᴅɪᴘʀᴏꜱᴇꜱ ᴊᴀᴅɪ ꜱᴛɪᴄᴋᴇʀ ᴘᴀᴄᴋ...\n╰┈┈┈┈┈┈┈┈⬡`);
    const items = [];
    for (const raw of children) {
        const child = unwrapAssociatedChild(raw);
        try {
            const item = await convertAlbumChildToSticker(child, conn);
            if (item) items.push(item);
        } catch {
        }
    }
    if (!items.length) {
        await m.reply(`╭┈┈⬡「 *ᴇʀʀᴏʀ* 」\n┃ ✧ ɢᴀɢᴀʟ ᴘʀᴏꜱᴇꜱ ꜱᴇᴍᴜᴀ ᴍᴇᴅɪᴀ ᴅɪ ᴀʟʙᴜᴍ ɪɴɪ.\n╰┈┈┈┈┈┈┈┈⬡`);
        return;
    }
    return sendStickerPack(conn, m.chat, items, {
        name: packName || config.botName,
        publisher: m.pushName || config.copyrightName,
        description: 'Sticker pack dari album',
        quoted: m.raw,
    });
}
const handler = async (m, { conn, text }) => {
    const quotedId = m.quoted?.key?.id;
    if (quotedId) {
        const quotedChat = m.quoted.key.remoteJid || m.chat;
        const children = findAlbumChildren(quotedChat, quotedId);
        if (children.length) {
            return processAlbumToPack(m, conn, children, text);
        }
    }
    const media = findMediaMessage(m);
    if (!media) {
        await m.reply(`╭┈┈⬡「 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n┃ ✧ ᴋɪʀɪᴍ ᴀᴛᴀᴜ ʀᴇᴘʟʏ ɢᴀᴍʙᴀʀ/ᴠɪᴅᴇᴏ ᴅᴇɴɢᴀɴ ᴄᴀᴘᴛɪᴏɴ .ꜱᴛɪᴄᴋᴇʀ ʏᴀ.\n╰┈┈┈┈┈┈┈┈⬡`);
        return;
    }
    await conn.setTyping(m.chat);
    const buffer = await downloadMessageMedia(m, conn);
    if (!buffer?.length) {
        await m.reply(`╭┈┈⬡「 *ᴇʀʀᴏʀ* 」\n┃ ✧ ɢᴀɢᴀʟ ᴅᴏᴡɴʟᴏᴀᴅ ᴍᴇᴅɪᴀ, ᴄᴏʙᴀ ʟᴀɢɪ.\n╰┈┈┈┈┈┈┈┈⬡`);
        return;
    }
    const isVideo = media.type === 'videoMessage';
    if (isVideo && (media.message.seconds || 0) > 15) {
        await m.reply(`╭┈┈⬡「 *ᴇʀʀᴏʀ* 」\n┃ ✧ ᴠɪᴅᴇᴏ ᴋᴇᴘᴀɴᴊᴀɴɢᴀɴ, ᴍᴀᴋꜱɪᴍᴀʟ 15 ᴅᴇᴛɪᴋ ʏᴀ.\n╰┈┈┈┈┈┈┈┈⬡`);
        return;
    }
    const webp = await makeSticker(buffer, { isVideo, packName: config.botName, authorName: m.pushName || config.copyrightName });
    await conn.sendMessage(m.chat, { sticker: webp }, { quoted: m.raw });
};
handler.help = ['sticker'];
handler.tags = ['tools'];
handler.command = /^(sticker|s|stiker)$/i;
handler.limit = true;
export default handler;
