'use strict';
import axios from 'axios';
import config from '../../config.js';
import { findMediaMessage, downloadMessageMedia } from '../../Library/handle.js';
import { ButtonV2 } from '../../Library/MessageBuilder.js';
import { buildFkontak } from '../../Library/utils.js';
const sessions = new Map();
function bufferToBlob(buffer, mimeType) {
    return new Blob([buffer], { type: mimeType });
}
async function imageUpscaler(buffer, filename, multiplier = 2) {
    const pageRes = await fetch('https://www.iloveimg.com/id/tingkatkan-gambar', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    const html = await pageRes.text();
    const token = html.match(/"token":"([^"]+)"/)?.[1];
    const taskId = html.match(/ilovepdfConfig\.taskId\s*=\s*'([^']+)'/)?.[1];
    if (!token || !taskId) throw new Error('Gagal ambil token/taskId dari iloveimg');
    const uploadForm = new FormData();
    uploadForm.append('name', filename);
    uploadForm.append('chunk', '0');
    uploadForm.append('chunks', '1');
    uploadForm.append('task', taskId);
    uploadForm.append('preview', '1');
    uploadForm.append('pdfinfo', '0');
    uploadForm.append('pdfforms', '0');
    uploadForm.append('pdfresetforms', '0');
    uploadForm.append('v', 'web.0');
    uploadForm.append('file', bufferToBlob(buffer, 'image/jpeg'), filename);
    const uploadRes = await fetch('https://api1g.iloveimg.com/v1/upload', {
        method: 'POST',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            Authorization: `Bearer ${token}`,
        },
        body: uploadForm,
    });
    const uploadData = await uploadRes.json();
    const serverFilename = uploadData?.server_filename;
    if (!serverFilename) throw new Error('Upload ke iloveimg gagal');
    const processForm = new FormData();
    processForm.append('packaged_filename', 'iloveimg-upscaled');
    processForm.append('multiplier', String(multiplier));
    processForm.append('task', taskId);
    processForm.append('tool', 'upscaleimage');
    processForm.append('files[0][server_filename]', serverFilename);
    processForm.append('files[0][filename]', filename);
    const processRes = await fetch('https://api1g.iloveimg.com/v1/process', {
        method: 'POST',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            Authorization: `Bearer ${token}`,
            Origin: 'https://www.iloveimg.com',
        },
        body: processForm,
    });
    const processData = await processRes.json();
    if (processData?.status !== 'TaskSuccess') throw new Error('Processing gagal: ' + JSON.stringify(processData));
    const downloadRes = await axios.get(`https://api1g.iloveimg.com/v1/download/${taskId}`, {
        responseType: 'arraybuffer',
        headers: {
            Authorization: `Bearer ${token}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 60000,
    });
    return Buffer.from(downloadRes.data);
}
const handler = async (m, { conn, command }) => {
    if (command === 'hd_2x' || command === 'hd_4x') {
        const multiplier = command === 'hd_4x' ? 4 : 2;
        const sessionData = sessions.get(m.sender);
        if (!sessionData) {
            return m.reply(`╭┈┈⬡「 *ꜱᴇꜱɪᴏɴ ᴇxᴘɪʀᴇᴅ* 」\n┃\n┃ ✧ ᴋɪʀɪᴍ ᴜʟᴀɴɢ ɢᴀᴍʙᴀʀ ᴅᴇɴɢᴀɴ *.ʜᴅ*\n╰┈┈┈┈┈┈┈┈⬡`);
        }
        sessions.delete(m.sender);
        await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
        try {
            const resultBuffer = await imageUpscaler(sessionData.buffer, sessionData.filename, multiplier);
            const sizeBefore = (sessionData.buffer.length / 1024).toFixed(1);
            const sizeAfter = (resultBuffer.length / 1024).toFixed(1);
            const fk = await buildFkontak(conn, config);
            await conn.sendMessage(m.chat, {
                image: resultBuffer,
                caption: ` HD Upscaler ${multiplier}x | ${sizeBefore} KB  ${sizeAfter} KB`,
            }, { quoted: fk });
            await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        }
        catch (e) {
            await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            await m.reply(`╭┈┈⬡「 *ᴜᴘꜱᴄᴀʟᴇ ɢᴀɢᴀʟ* 」\n┃\n┃ ✧ ${e.message}\n╰┈┈┈┈┈┈┈┈⬡`);
        }
        return;
    }
    const media = findMediaMessage(m);
    if (!media || media.type !== 'imageMessage') {
        return m.reply(`╭┈┈⬡「 *ʜᴅ ᴜᴘꜱᴄᴀʟᴇʀ* 」\n┃\n┃ ✧ ᴋɪʀɪᴍ ᴀᴛᴀᴜ ʀᴇᴘʟʏ ꜰᴏᴛᴏ ᴅᴇɴɢᴀɴ\n┃ ✧ ᴄᴀᴘᴛɪᴏɴ *.ʜᴅ*\n╰┈┈┈┈┈┈┈┈⬡`);
    }
    const img = media.message;
    if ((img.fileLength || 0) > 5 * 1024 * 1024) {
        return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ɢᴀᴍʙᴀʀ ᴛᴇʀʟᴀʟᴜ ʙᴇꜱᴀʀ! ᴍᴀᴋꜱɪᴍᴀʟ *5ᴍʙ*\n╰┈┈┈┈┈┈┈┈⬡`);
    }
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
    let buffer;
    try {
        buffer = await downloadMessageMedia(m, conn);
        if (!buffer?.length) throw new Error('Buffer kosong');
        if (buffer.length < 1000) throw new Error('Gambar terlalu kecil / corrupt');
    }
    catch (e) {
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        return m.reply(`╭┈┈⬡「 *ɢᴀɢᴀʟ ᴅᴏᴡɴʟᴏᴀᴅ ɢᴀᴍʙᴀʀ* 」\n┃\n┃ ✧ ${e.message}\n╰┈┈┈┈┈┈┈┈⬡`);
    }
    sessions.set(m.sender, { buffer, filename: `image_${Date.now()}.jpg` });
    try {
        const fk = await buildFkontak(conn, config);
        await new ButtonV2(conn)
            .setTitle(' Image Upscaler')
            .setSubtitle(` ${(buffer.length / 1024).toFixed(1)} KB`)
            .setBody('Pilih level upscale:')
            .setFooter(' 2x Cepat & ringan | 4x Kualitas maksimal')
            .setThumbnail(config.menuImage)
            .addButton(' 2x', '.hd_2x')
            .addButton(' 4x', '.hd_4x')
            .send(m.chat, { quoted: fk });
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
    }
    catch (e) {
        console.error('[HD] ButtonV2 error:', e.message);
        await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ɢᴀɢᴀʟ ᴛᴀᴍᴘɪʟᴋᴀɴ ᴘɪʟɪʜᴀɴ: ${e.message}\n╰┈┈┈┈┈┈┈┈⬡`);
    }
};
handler.help = ['hd <reply foto>'];
handler.tags = ['tools'];
handler.command = /^(hd|hd_2x|hd_4x)$/i;
handler.limit = true;
export default handler;