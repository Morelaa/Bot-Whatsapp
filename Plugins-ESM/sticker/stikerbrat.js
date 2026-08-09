'use strict';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import config from '../../config.js';
import { buildFkontak } from '../../Library/utils.js';
const TMP = path.join(config.mediaDir, 'cewekbrat');
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });
const toWebp = (input, output) =>
    new Promise((resolve, reject) => {
        ffmpeg(input)
            .outputOptions(['-vcodec', 'libwebp', '-vf', 'scale=512:512:force_original_aspect_ratio=decrease', '-loop', '0', '-an', '-vsync', '0'])
            .on('end', resolve)
            .on('error', reject)
            .save(output);
    });
const handler = async (m, { conn, text }) => {
    const from = m.chat;
    if (!text?.trim()) return m.reply(`╭┈┈⬡「 *ᴄᴏɴᴛᴏʜ:* 」\n┃ ✧ .ꜱᴛɪᴋᴇʀʙʀᴀᴛ ʜᴀɪɪɪ ꜱᴀʏᴀɴɢ\n╰┈┈┈┈┈┈┈┈⬡`);
    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
    const id = Date.now();
    const img = path.join(TMP, `${id}.png`);
    const webp = path.join(TMP, `${id}.webp`);
    try {
        const url = 'https://api.deline.web.id/maker/cewekbrat?text=' + encodeURIComponent(text.trim());
        const res = await axios.get(url, { responseType: 'arraybuffer' });
        fs.writeFileSync(img, res.data);
        await toWebp(img, webp);
        await conn.sendMessage(from, { sticker: fs.readFileSync(webp) }, { quoted: (await buildFkontak(conn, config).catch(() => null)) || m.raw });
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
    } catch (e) {
        console.error(e);
        m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ɢᴀɢᴀʟ ᴍᴇᴍʙᴜᴀᴛ ꜱᴛɪᴋᴇʀ ʙʀᴀᴛ.\n╰┈┈┈┈┈┈┈┈⬡`);
    } finally {
        try { fs.unlinkSync(img); } catch {}
        try { fs.unlinkSync(webp); } catch {}
    }
};
handler.command = /^stikerbrat$/i;
handler.tags = ['sticker'];
handler.help = ['stikerbrat <teks>'];
handler.limit = true;
export default handler;
