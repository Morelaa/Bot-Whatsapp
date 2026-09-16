//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import config from '../../config.js';
import { findMediaMessage, downloadMessageMedia } from '../../Library/handle.js';
import { buildFkontak } from '../../Library/utils.js';
const PIXELCUT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'origin': 'https://www.pixa.com',
};
function bufferToBlob(buffer, mimeType) {
    return new Blob([buffer], { type: mimeType });
}
async function removeBg(buffer, mime) {
    const form = new FormData();
    form.append('image', bufferToBlob(buffer, mime), 'image.jpg');
    form.append('format', 'png');
    form.append('model', 'v1');
    const res = await fetch('https://api2.pixelcut.app/image/matte/v1', {
        method: 'POST',
        headers: PIXELCUT_HEADERS,
        body: form,
    });
    if (!res.ok) throw new Error(`Pixelcut error (${res.status})`);
    return Buffer.from(await res.arrayBuffer());
}
const handler = async (m, { conn, usedPrefix, command }) => {
    const media = findMediaMessage(m);
    if (!media || media.type !== 'imageMessage') {
        return m.reply(`Kirim/Reply foto dengan caption ${usedPrefix}${command}`);
    }
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
    let buffer;
    try {
        buffer = await downloadMessageMedia(m, conn);
        const resultBuffer = await removeBg(buffer, 'image/jpeg');
        const sizeBefore = (buffer.length / 1024).toFixed(1);
        const sizeAfter = (resultBuffer.length / 1024).toFixed(1);
        const fk = await buildFkontak(conn, config);
        const caption = `╭┈┈⬡「 *ꜱᴇʟᴇꜱᴀɪ* 」\n┃ ✧ *Ukuran Awal*: ${sizeBefore} KB\n┃ ✧ *Ukuran Hasil*: ${sizeAfter} KB\n┃ ✧ *Format*: PNG\n╰┈┈┈┈┈┈┈┈⬡`;
        await conn.sendMessage(m.chat, { 
            image: resultBuffer, 
            caption: caption,
            mimetype: 'image/png',
            contextInfo: {
                isForwarded: true,
                forwardingScore: 125,
                forwardedAiBotMessageInfo: {
                    botName: "AI Remove BG", 
                    botJid: "950173647007884@bot" 
                },
                forwardOrigin: 4
            }
        }, { quoted: fk });
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
    } catch (e) {
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        return m.reply(`Gagal: ${e.message}`);
    }
};
handler.help = ['removebg'];
handler.tags = ['tools'];
handler.command = /^(removebg|pixa|nobg|nobackground)$/i;
handler.limit = true;
export default handler;
