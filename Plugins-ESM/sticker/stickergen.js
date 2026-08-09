'use strict';
import axios from 'axios';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import config from '../../config.js';
const NEOXR_KEY = config.apiKeys.neoxr;
const TEMP_DIR = path.join(process.cwd(), 'media', 'temp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
const toWebp = (buffer) =>
    new Promise((resolve, reject) => {
        const stamp = Date.now() + Math.random();
        const input = path.join(TEMP_DIR, `sgen_in_${stamp}.jpg`);
        const output = path.join(TEMP_DIR, `sgen_out_${stamp}.webp`);
        fs.writeFileSync(input, buffer);
        ffmpeg(input)
            .on('error', (e) => {
                try { fs.unlinkSync(input); } catch {}
                try { fs.unlinkSync(output); } catch {}
                reject(e);
            })
            .on('end', () => {
                try { fs.unlinkSync(input); } catch {}
                const webp = fs.readFileSync(output);
                try { fs.unlinkSync(output); } catch {}
                resolve(webp);
            })
            .outputOptions([
                '-vcodec', 'libwebp',
                '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,fps=15',
                '-loop', '0',
                '-preset', 'default',
                '-an',
                '-vsync', '0',
            ])
            .save(output);
    });
const handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) {
        await m.reply(
            ` *STICKER GENERATOR AI*\n\n` +
            `> Generate stiker AI dari deskripsi teks!\n\n` +
            `╭┈┈⬡「  ᴄᴀʀᴀ ᴘᴀᴋᴀɪ 」\n` +
            `┃ ✧ ${usedPrefix}${command} <ᴅᴇꜱᴋʀɪᴘꜱɪ>\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `*Contoh:*\n` +
            `> ${usedPrefix}${command} cat eat banana\n` +
            `> ${usedPrefix}${command} anime girl with sword\n` +
            `> ${usedPrefix}${command} cute dog playing ball`
        );
        return;
    }
    await m.reply(`╭┈┈⬡「 *ɢᴇɴᴇʀᴀᴛɪɴɢ ꜱᴛɪᴋᴇʀ...* 」\n┃ ✧ *${text}*\n╰┈┈┈┈┈┈┈┈⬡`);
    try {
        const res = await axios.get('https://api.neoxr.eu/api/sticker-gen', {
            params: { q: text, apikey: NEOXR_KEY },
            timeout: 60000,
        });
        if (!res.data?.status) throw new Error(res.data?.message || 'API gagal');
        const images = res.data?.data?.image || [];
        if (!images.length) throw new Error('Tidak ada gambar yang dihasilkan');
        const webpBuffers = [];
        for (const url of images) {
            const imgBuf = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 })
                .then(r => Buffer.from(r.data));
            webpBuffers.push(await toWebp(imgBuf));
        }
        if (!webpBuffers.length) throw new Error('Semua gambar gagal dikonversi');
        const packName = text.length > 30 ? text.slice(0, 27) + '...' : text;
        await conn.sendMessage(m.chat, {
            stickerPack: {
                name: packName,
                publisher: config.botName,
                packId: crypto.randomUUID(),
                description: `AI Sticker: ${packName}`,
                cover: webpBuffers[0],
                stickers: webpBuffers.map(buf => ({
                    sticker: buf,
                    emojis: [''],
                    accessibilityLabel: packName,
                })),
            },
        }, { quoted: m.raw });
    } catch (e) {
        await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ɢᴀɢᴀʟ: ${e.message}\n╰┈┈┈┈┈┈┈┈⬡`);
    }
};
handler.help = ['stickergen <deskripsi>'];
handler.tags = ['sticker'];
handler.command = /^(stickergen|sgai|buatstiker|genstiker)$/i;
handler.limit = true;
export default handler;
