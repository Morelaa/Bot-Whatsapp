'use strict';
import axios from 'axios';
import crypto from 'crypto';
import config from '../../config.js';
import { findMediaMessage, downloadMessageMedia } from '../../Library/handle.js';
const EZREMOVE_BASE = 'https://api.ezremove.ai/api';
async function removeWatermark(buffer, mimeType = 'image/jpeg') {
    const productSerial = crypto.randomBytes(16).toString('hex');
    const form = new FormData();
    form.append('image_file', new Blob([buffer], { type: mimeType }), 'image.jpg');
    form.append('model_name', 'v2');
    const createRes = await axios.post(`${EZREMOVE_BASE}/ez-remove/watermark-remove/create-job`, form, {
        headers: { 'Product-Serial': productSerial },
        timeout: 60000,
    });
    const jobId = createRes.data?.result?.job_id;
    if (!jobId) throw new Error(createRes.data?.message?.en || 'Gagal membuat job di ezremove.ai');
    const started = Date.now();
    while (Date.now() - started < 90000) {
        await new Promise((r) => setTimeout(r, 2000));
        const jobRes = await axios.get(`${EZREMOVE_BASE}/ez-remove/watermark-remove/get-job/${jobId}`, { timeout: 30000 });
        const code = jobRes.data?.code;
        if (code === 100000) {
            const output = jobRes.data?.result?.output?.[0];
            if (output) return output;
            throw new Error('Job selesai tapi tidak ada hasil.');
        }
        if (code !== 300001) {
            throw new Error(jobRes.data?.message?.en || 'Job gagal diproses di ezremove.ai.');
        }
    }
    throw new Error('Timeout menunggu hasil (90 detik).');
}
const handler = async (m, { conn, usedPrefix, command }) => {
    const media = findMediaMessage(m);
    if (!media || media.type !== 'imageMessage') {
        return m.reply(
            `╭┈┈⬡「 *ʀᴇᴍᴏᴠᴇ ᴡᴀᴛᴇʀᴍᴀʀᴋ* 」\n┃\n` +
            `┃ ✧ ᴋɪʀɪᴍ ᴀᴛᴀᴜ ʀᴇᴘʟʏ ꜰᴏᴛᴏ ʟᴀʟᴜ ᴋᴇᴛɪᴋ:\n` +
            `┃ ✧ *${usedPrefix}${command}*\n┃\n` +
            `┃ ✧ ᴄᴀᴛᴀᴛᴀɴ:\n` +
            `┃ ✧ ᴍᴀᴋꜱ ᴜᴋᴜʀᴀɴ ɢᴀᴍʙᴀʀ: 20 ᴍʙ\n` +
            `┃ ✧ ᴘʀᴏꜱᴇꜱ 15–30 ᴅᴇᴛɪᴋ\n┃\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        );
    }
    const img = media.message;
    if ((img.fileLength || 0) > 20 * 1024 * 1024) {
        return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ɢᴀᴍʙᴀʀ ᴛᴇʀʟᴀʟᴜ ʙᴇꜱᴀʀ, ᴍᴀᴋꜱɪᴍᴀʟ *20 ᴍʙ*\n╰┈┈┈┈┈┈┈┈⬡`);
    }
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
    let buffer;
    try {
        buffer = await downloadMessageMedia(m, conn);
        if (!buffer?.length) throw new Error('Buffer kosong');
    } catch (e) {
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        return m.reply(`╭┈┈⬡「 *ɢᴀɢᴀʟ ᴅᴏᴡɴʟᴏᴀᴅ ɢᴀᴍʙᴀʀ* 」\n┃\n┃ ✧ ${e.message}\n╰┈┈┈┈┈┈┈┈⬡`);
    }
    await conn.sendMessage(m.chat, { react: { text: '⚙️', key: m.key } });
    try {
        const resultUrl = await removeWatermark(buffer);
        const resRes = await axios.get(resultUrl, { responseType: 'arraybuffer', timeout: 60000 });
        const resultBuf = Buffer.from(resRes.data);
        await conn.sendMessage(m.chat, { image: resultBuf, caption: ' Remove Watermark' }, { quoted: m.raw });
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
    } catch (e) {
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        return m.reply(`╭┈┈⬡「 *ᴘʀᴏꜱᴇꜱ ʀᴇᴍᴏᴠᴇ ᴡᴀᴛᴇʀᴍᴀʀᴋ ɢᴀɢᴀʟ* 」\n┃\n┃ ✧ ${e.message}\n╰┈┈┈┈┈┈┈┈⬡`);
    }
};
handler.help = ['removewm <reply foto>'];
handler.tags = ['tools', 'ai'];
handler.command = /^(removewm|nowm|hapuswm)$/i;
handler.limit = true;
export default handler;