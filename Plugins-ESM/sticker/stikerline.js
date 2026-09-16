//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import axios from 'axios';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import config from '../../config.js';
import { sendStickerPack } from '../../Library/stickerPackHelper.js';
const NEOXR_KEY = config.apiKeys.neoxr;
const TEMP_DIR = path.join(process.cwd(), 'media', 'temp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
function toWebpBuffer(inputBuf, animated) {
    return new Promise((resolve, reject) => {
        const id = crypto.randomBytes(6).toString('hex');
        const ext = animated ? 'gif' : 'png';
        const inp = path.join(TEMP_DIR, `line_${id}.${ext}`);
        const out = path.join(TEMP_DIR, `line_${id}.webp`);
        const cleanup = () => {
            try { fs.unlinkSync(inp); } catch { }
            try { fs.unlinkSync(out); } catch { }
        };
        fs.writeFileSync(inp, inputBuf);
        ffmpeg(inp)
            .outputOptions([
                '-vcodec', 'libwebp',
                '-vf', animated
                    ? 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000'
                    : 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,format=rgba',
                '-loop', '0', '-an', '-vsync', '0',
                ...(animated ? ['-t', '8'] : ['-frames:v', '1']),
                '-quality', '80', '-compression_level', '4', '-preset', 'photo',
            ])
            .on('end', () => {
                try {
                    const buf = fs.readFileSync(out);
                    cleanup();
                    resolve(buf);
                } catch (e) { cleanup(); reject(e); }
            })
            .on('error', (e) => { cleanup(); reject(e); })
            .save(out);
    });
}
async function downloadBuffer(url) {
    const res = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    return Buffer.from(res.data);
}
const handler = async (m, { conn, args, usedPrefix, command, fkontak }) => {
    const url = args[0]?.trim();
    if (!url || !url.includes('store.line.me')) {
        return m.reply(
            `🎨 *ʟɪɴᴇ sᴛɪᴄᴋᴇʀ ᴘᴀᴄᴋ*\n\n` +
            `> Download LINE sticker pack\n\n` +
            `╭┈┈⬡「 📋 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
            `┃ ${usedPrefix}${command} <url>\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `*ᴄᴀʀᴀ ᴅᴀᴘᴀᴛ ᴜʀʟ:*\n` +
            `> 1. Buka https://store.line.me\n` +
            `> 2. Pilih sticker pack\n` +
            `> 3. Copy URL dari browser\n\n` +
            `*ᴄᴏɴᴛᴏʜ:*\n` +
            `> ${usedPrefix}${command} https://store.line.me/stickershop/product/9801/en`
        );
    }
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
    try {
        const apiUrl = `https://api.neoxr.eu/api/linesticker?url=${encodeURIComponent(url)}&apikey=${NEOXR_KEY}`;
        const res = await axios.get(apiUrl, { timeout: 60000 });
        if (!res.data?.status || !res.data?.data) {
            await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return m.reply(`❌ Gagal mengambil sticker dari URL tersebut!`);
        }
        const data = res.data.data;
        const title = data.title || 'LINE Sticker';
        const author = data.author || 'Unknown';
        const isAnimated = !!(data.animated);
        const stickerUrls = isAnimated && data.sticker_animation_url?.length
            ? data.sticker_animation_url
            : data.sticker_url || [];
        if (!stickerUrls.length) {
            await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return m.reply(`❌ Tidak ada sticker ditemukan!`);
        }
        const total = Math.min(stickerUrls.length, 30);
        await m.reply(
            `🎨 *ʟɪɴᴇ sᴛɪᴄᴋᴇʀ ᴘᴀᴄᴋ*\n\n` +
            `╭┈┈⬡「 📦 *ɪɴꜰᴏ* 」\n` +
            `┃ 📝 *Title:* ${title}\n` +
            `┃ 👤 *Author:* ${author}\n` +
            `┃ 🎬 *Animated:* ${isAnimated ? 'Ya' : 'Tidak'}\n` +
            `┃ 📊 *Total:* ${total} stiker\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `> ⏳ Mengunduh & memproses...`
        );
        const stickerBuffers = [];
        for (let i = 0; i < total; i++) {
            try {
                const raw = await downloadBuffer(stickerUrls[i]);
                const buf = await toWebpBuffer(raw, isAnimated);
                stickerBuffers.push(buf);
            } catch (e) {
                console.error(`[LINE] stiker ${i + 1} gagal:`, e?.message);
            }
        }
        if (!stickerBuffers.length) {
            await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return m.reply(`❌ Semua stiker gagal diunduh!`);
        }
        await sendStickerPack(conn, m.chat, stickerBuffers.map((buf) => ({ buffer: buf, emojis: ['🌟'] })), { name: title, publisher: author, description: `LINE Sticker: ${title}`, quoted: fkontak || m.raw });
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
    } catch (error) {
        console.error('[LineSticker] Error:', error?.message);
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error?.message}`);
    }
};
handler.command = /^(linesticker|linepack|line)$/i;
handler.help = ['linesticker <url store.line.me>'];
handler.tags = ['sticker'];
handler.premium = true;
handler.limit = true;
export default handler;
