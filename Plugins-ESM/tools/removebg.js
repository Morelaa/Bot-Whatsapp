'use strict';
import config from '../../config.js';
import { findMediaMessage, downloadMessageMedia } from '../../Library/handle.js';
import { AIRich, Toolkit } from '../../Library/MessageBuilder.js';
import { buildFkontak } from '../../Library/utils.js';
const OWNER_WA = `https://wa.me/${config.mainOwner}`;
const PIXELCUT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'sec-ch-ua': '"Chromium";v="139", "Not;A=Brand";v="99"',
    'x-locale': 'en',
    'x-client-version': 'web:pixa.com:4a5b0af2',
    'sec-ch-ua-mobile': '?1',
    'sec-ch-ua-platform': '"Android"',
    'origin': 'https://www.pixa.com',
    'sec-fetch-site': 'cross-site',
    'sec-fetch-mode': 'cors',
    'sec-fetch-dest': 'empty',
    'referer': 'https://www.pixa.com/',
    'accept-language': 'id-ID,id;q=0.9,en-AU;q=0.8,en;q=0.7,en-US;q=0.6',
};
function bufferToBlob(buffer, mimeType) {
    return new Blob([buffer], { type: mimeType });
}
async function uploadImage(buffer, conn) {
    try {
        const url = await Toolkit.toUrl(conn, buffer, 'image');
        if (url) return url;
        throw new Error('CDN WA tidak mengembalikan URL');
    } catch {
        const form = new FormData();
        form.append('file', bufferToBlob(buffer, 'image/jpeg'), 'image.jpg');
        const res = await fetch('https://cdn.ornzora.eu.cc/upload', { method: 'POST', body: form });
        const data = await res.json().catch(() => null);
        const url = data?.url || data?.data?.url || data?.link || data?.data?.link ||
            (typeof data === 'string' && data.startsWith('https://') ? data.trim() : null);
        if (url) return url;
        throw new Error('Upload gagal (CDN WA & Ornzora)');
    }
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
    const result = Buffer.from(await res.arrayBuffer());
    if (!result.length) throw new Error('Buffer hasil kosong');
    return result;
}
const handler = async (m, { conn, usedPrefix, command }) => {
    const media = findMediaMessage(m);
    if (!media || media.type !== 'imageMessage') {
        return m.reply(
            `╭┈┈⬡「 🖼️ *ʀᴇᴍᴏᴠᴇ ʙᴀᴄᴋɢʀᴏᴜɴᴅ* 」\n┃\n┃ ✧ ʀᴇᴘʟʏ ɢᴀᴍʙᴀʀ ᴜɴᴛᴜᴋ ᴍᴇɴɢʜᴀᴘᴜꜱ\n┃ ✧ ʟᴀᴛᴀʀ ʙᴇʟᴀᴋᴀɴɢɴʏᴀ ꜱᴇᴄᴀʀᴀ ᴏᴛᴏᴍᴀᴛɪꜱ.\n┃\n┃ ✧ ꜰᴏʀᴍᴀᴛ:\n┃ ✧ ʀᴇᴘʟʏ ꜰᴏᴛᴏ + ${usedPrefix}${command}\n┃\n╰┈┈┈┈┈┈┈┈⬡`
        );
    }
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
    let buffer;
    try {
        buffer = await downloadMessageMedia(m, conn);
        if (!buffer?.length) throw new Error('Buffer kosong');
    } catch (e) {
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ɢᴀɢᴀʟ ᴅᴏᴡɴʟᴏᴀᴅ ɢᴀᴍʙᴀʀ: ${e.message}\n╰┈┈┈┈┈┈┈┈⬡`);
    }
    let resultBuffer;
    try {
        resultBuffer = await removeBg(buffer, 'image/jpeg');
    } catch (e) {
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        return m.reply(`╭┈┈⬡「 *ɢᴀɢᴀʟ ᴘʀᴏꜱᴇꜱ ɢᴀᴍʙᴀʀ* 」\n┃\n┃ ✧ ${e.message}\n╰┈┈┈┈┈┈┈┈⬡`);
    }
    try {
        const resultUrl = await uploadImage(resultBuffer, conn);
        const sizeBefore = (buffer.length / 1024).toFixed(1);
        const sizeAfter = (resultBuffer.length / 1024).toFixed(1);
        const fk = await buildFkontak(conn, config);
        const ppUrl = await conn.profilePictureUrl(conn.user.id, 'image').catch(() => config.thumbnail);
        await new AIRich(conn)
            .setTitle(` Remove Background Selesai | ${sizeBefore} KB  ${sizeAfter} KB`)
            .addProduct({
                title: 'Format: PNG',
                brand: config.botName,
                price: 'Remove Background',
                sale_price: '',
                product_url: OWNER_WA,
                icon_url: ppUrl,
                image_url: ppUrl,
            })
            .addTip(' ')
            .addImage(resultUrl, { mimeType: 'image/png' })
            .addSource([
                ['https://www.google.com/s2/favicons?domain=whatsapp.com&sz=16', OWNER_WA, config.botName],
                ['https://www.google.com/s2/favicons?domain=pixa.com&sz=16', 'https://www.pixa.com', 'Pixelcut API'],
            ])
            .send(m.chat, { quoted: fk });
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
    } catch (e) {
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ɢᴀɢᴀʟ ᴋɪʀɪᴍ ʜᴀꜱɪʟ: ${e.message}\n╰┈┈┈┈┈┈┈┈⬡`);
    }
};
handler.help = ['removebg <reply foto>'];
handler.tags = ['tools'];
handler.command = /^(removebg|pixa|nobg|nobackground)$/i;
handler.limit = true;
export default handler;
