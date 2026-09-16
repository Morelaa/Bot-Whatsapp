//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import config from '../../config.js';
import { buildFkontak } from '../../Library/utils.js';
const API_URL = 'https://api-evelyne.vercel.app';
const API_KEY = config.apiKeys?.evelyne || 'FreeLimit';
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
        const res = await axios.get(
            `${API_URL}/api/maker/bratvid?text=${encodeURIComponent(text.trim())}&apikey=${API_KEY}`,
            { responseType: 'arraybuffer', timeout: 30000 }
        );
        const contentType = res.headers['content-type'] || '';
        if (contentType.includes('application/json') || contentType.includes('text/')) {
            const json = JSON.parse(Buffer.from(res.data).toString());
            throw new Error(json.message || json.error || 'API error');
        }
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
