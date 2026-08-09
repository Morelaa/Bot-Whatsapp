'use strict';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import config from '../../config.js';
import { buildFkontak } from '../../Library/utils.js';
const TMP = path.join(config.mediaDir, 'bratvid');
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const toWebp = (input, output) =>
    new Promise((resolve, reject) => {
        ffmpeg(input)
            .outputOptions(['-vcodec', 'libwebp', '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,fps=15', '-loop', '0', '-an', '-vsync', '0'])
            .on('end', resolve)
            .on('error', reject)
            .save(output);
    });
const handler = async (m, { conn, text, usedPrefix }) => {
    if (!text?.trim()) return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴄᴏɴᴛᴏʜ: ${usedPrefix}ʙʀᴀᴛᴠɪᴅ ʜᴀʜᴀʜᴀʜᴀ ᴋɴᴘᴀᴀᴀ\n╰┈┈┈┈┈┈┈┈⬡`);
    const id = Date.now();
    const mp4 = path.join(TMP, `${id}.mp4`);
    const webp = path.join(TMP, `${id}.webp`);
    try { await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }); } catch {}
    try {
        const res = await axios.get('https://api.deline.web.id/maker/bratvid?text=' + encodeURIComponent(text.trim()), { responseType: 'arraybuffer' });
        fs.writeFileSync(mp4, res.data);
        await toWebp(mp4, webp);
        await sleep(500);
        await conn.sendMessage(m.chat, { sticker: fs.readFileSync(webp) }, { quoted: (await buildFkontak(conn, config).catch(() => null)) || m.raw });
        await sleep(500);
        try { await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } }); } catch {}
    } catch (e) {
        console.error('[BRATVID]', e);
        try { await conn.sendMessage(m.chat, { react: { text: '', key: m.key } }); } catch {}
        m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ɢᴀɢᴀʟ ᴍᴇᴍʙᴜᴀᴛ ꜱᴛɪᴋᴇʀ ʙʀᴀᴛᴠɪᴅ.\n╰┈┈┈┈┈┈┈┈⬡`);
    } finally {
        try { fs.unlinkSync(mp4); } catch {}
        try { fs.unlinkSync(webp); } catch {}
    }
};
handler.command = /^(bratvid|bratvideo)$/i;
handler.tags = ['sticker'];
handler.help = ['bratvid <teks>'];
handler.limit = true;
export default handler;
