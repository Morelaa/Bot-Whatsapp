'use strict';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';
import config from '../../config.js';
import { buildFkontak } from '../../Library/utils.js';
const API_URL = 'https://api-evelyne.vercel.app';
const TMP = path.join(config.mediaDir, 'brat');
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });
const imageToWebp = (input, output) =>
    new Promise((resolve, reject) => {
        ffmpeg(input)
            .outputOptions([
                '-vcodec', 'libwebp',
                '-vf', 'scale=1024:1024:force_original_aspect_ratio=decrease,pad=1024:1024:(ow-iw)/2:(oh-ih)/2:white,scale=512:512',
                '-loop', '0', '-an', '-vsync', '0',
                '-frames:v', '1', '-quality', '100',
                '-compression_level', '0', '-preset', 'photo',
            ])
            .on('end', resolve)
            .on('error', (err) => reject(err))
            .save(output);
    });
const handler = async (m, { conn, text, usedPrefix }) => {
    if (!text?.trim())
        return m.reply(
            `╭┈┈⬡「 *ʙʀᴀᴛ ᴛʀᴇɴ* 」\n` +
            `┃\n` +
            `┃ ✧ ᴍᴀꜱᴜᴋᴋᴀɴ ᴛᴇᴋꜱ!\n` +
            `┃\n` +
            `┃ ✧ *ᴄᴏɴᴛᴏʜ:*\n` +
            `┃ ✧ ${usedPrefix}ʙʀᴀᴛᴛʀᴇɴ ʜᴀʟᴏ ᴅᴜɴɪᴀ\n` +
            `┃\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        );
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
    const id = Date.now();
    const img = path.join(TMP, `${id}.png`);
    const webp = path.join(TMP, `${id}.webp`);
    try {
        const res = await axios.get(`${API_URL}/api/maker/bratcewe2?text=${encodeURIComponent(text)}`, { responseType: 'arraybuffer', timeout: 20000 });
        const contentType = res.headers['content-type'] || '';
        if (!contentType.includes('image')) throw new Error(`Bukan gambar (${contentType})`);
        fs.writeFileSync(img, res.data);
        await imageToWebp(img, webp);
        await conn.sendMessage(m.chat, { sticker: fs.readFileSync(webp) }, { quoted: (await buildFkontak(conn, config).catch(() => null)) || m.raw });
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
    } catch (e) {
        console.error('[BRATTREN]', e?.message || e);
        await conn.sendMessage(m.chat, { react: { text: '', key: m.key } });
        m.reply(' Gagal membuat stiker: ' + (e?.message || 'unknown error'));
    } finally {
        try { fs.unlinkSync(img); } catch {}
        try { fs.unlinkSync(webp); } catch {}
    }
};
handler.command = /^brattren$/i;
handler.tags = ['sticker'];
handler.help = ['brattren <teks>'];
handler.limit = true;
export default handler;
