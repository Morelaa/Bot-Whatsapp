'use strict';
import axios from 'axios';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';
import { spawn } from 'child_process';
import config from '../../config.js';
import { sendStickerPack } from '../../Library/stickerPackHelper.js';
const MAX_STICKERS = 30;
const FGSI_KEY = 'fgsiapi-2baa6be5-6d';
const TG_PACK_REGEX = /(?:https?:\/\/)?t\.me\/(?:addstickers|addemoji)\/([a-zA-Z0-9_]+)/;
const TMP = path.join(os.tmpdir(), 'morela_tele_sticker');
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });
async function isDecodableWebp(buffer) {
    if (!Buffer.isBuffer(buffer) || buffer.length < 20)
        return false;
    try {
        await sharp(buffer, { animated: false }).metadata();
        return true;
    }
    catch {
        return false;
    }
}
async function downloadBuffer(url) {
    const res = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    return Buffer.from(res.data);
}
function toWebpBuffer(inputBuf, ext) {
    return new Promise((resolve, reject) => {
        const id = crypto.randomBytes(6).toString('hex');
        const inp = path.join(TMP, `tele_${id}.${ext || 'bin'}`);
        const out = path.join(TMP, `tele_${id}.webp`);
        const cleanup = () => {
            try { fs.unlinkSync(inp); } catch { }
            try { fs.unlinkSync(out); } catch { }
        };
        fs.writeFileSync(inp, inputBuf);
        const ff = spawn('ffmpeg', [
            '-i', inp,
            '-t', '6',
            '-vcodec', 'libwebp',
            '-vf', 'fps=12,scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:-1:-1:color=0x00000000',
            '-loop', '0', '-preset', 'default', '-an', '-vsync', '0',
            '-y', out,
        ]);
        let stderr = '';
        ff.stderr?.on('data', (d) => { stderr += d.toString(); });
        const timer = setTimeout(() => {
            ff.kill();
            cleanup();
            reject(new Error('ffmpeg timeout'));
        }, 25000);
        ff.on('close', (code) => {
            clearTimeout(timer);
            if (code === 0) {
                try {
                    const buf = fs.readFileSync(out);
                    cleanup();
                    resolve(buf);
                }
                catch (e) {
                    cleanup();
                    reject(e);
                }
            }
            else {
                cleanup();
                reject(new Error(`ffmpeg exit ${code}: ${stderr.slice(-300)}`));
            }
        });
        ff.on('error', (e) => { clearTimeout(timer); cleanup(); reject(e); });
    });
}
function cleanPackTitle(title) {
    return String(title || '')
        .replace(/\s*(?:::|via|\|)\s*@?\w*bot\b\s*$/i, '')
        .trim() || 'Telegram Sticker';
}
const handler = async (m, { conn, args, usedPrefix, command }) => {
    const rawText = args.join(' ');
    const [urlPart, ...customNameParts] = rawText.split('|');
    const url = (urlPart || '').trim();
    const customName = customNameParts.join('|').trim();
    if (!url) {
        return m.reply(
            ` *ᴛᴇʟᴇɢʀᴀᴍ sᴛɪᴄᴋᴇʀ ᴘᴀᴄᴋ*\n\n` +
            `> Download sticker pack Telegram  kirim sebagai pack WA asli!\n\n` +
            `╭┈┈⬡「 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
            `┃ ✧ ${usedPrefix}${command} <ᴜʀʟ>\n` +
            `┃ ✧ ${usedPrefix}${command} <ᴜʀʟ> | <ɴᴀᴍᴀ ᴄᴜꜱᴛᴏᴍ>\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `*ᴄᴀʀᴀ ᴅᴀᴘᴀᴛ ᴜʀʟ:*\n` +
            `> 1. Buka pack di Telegram\n` +
            `> 2. Klik •••  Share\n` +
            `> 3. Copy link t.me/addstickers/...\n\n` +
            `*ᴄᴏɴᴛᴏʜ:*\n` +
            `> ${usedPrefix}${command} https://t.me/addstickers/Sweetjehe3_by_fStikBot\n` +
            `> ${usedPrefix}${command} https://t.me/addstickers/Sweetjehe3_by_fStikBot | Stiker Kesukaanku`
        );
    }
    if (!TG_PACK_REGEX.test(url)) {
        return m.reply(`╭┈┈⬡「 *ᴜʀʟ ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ!* 」\n┃\n┃ ✧ ɢᴜɴᴀᴋᴀɴ ʟɪɴᴋ ᴛᴇʟᴇɢʀᴀᴍ ꜱᴛɪᴄᴋᴇʀ ᴘᴀᴄᴋ.\n┃ ✧ ᴄᴏɴᴛᴏʜ: *ʜᴛᴛᴘꜱ://ᴛ.ᴍᴇ/ᴀᴅᴅꜱᴛɪᴄᴋᴇʀꜱ/ɴᴀᴍᴀᴘᴀᴄᴋ*\n╰┈┈┈┈┈┈┈┈⬡`);
    }
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
    try {
        const res = await axios.get('https://fgsi.dpdns.org/api/tools/stickertelegram', {
            params: { apikey: FGSI_KEY, url },
            headers: { accept: 'application/json' },
            timeout: 60000,
        });
        const json = res.data;
        if (!json?.status || !json?.data) {
            await conn.sendMessage(m.chat, { react: { text: '', key: m.key } });
            return m.reply(`╭┈┈⬡「 *ɢᴀɢᴀʟ ᴍᴇɴɢᴀᴍʙɪʟ ꜱᴛɪᴄᴋᴇʀ ᴘᴀᴄᴋ!* 」\n┃\n┃ ✧ _${json?.message || 'Pastikan link valid dan pack masih tersedia.'}_\n╰┈┈┈┈┈┈┈┈⬡`);
        }
        const data = json.data;
        const rawTitle = data.title || data.name || 'Telegram Sticker';
        const title = customName || config.telestikerPackName || cleanPackTitle(rawTitle);
        const author = data.author || data.creator || config.botName;
        const stickerType = data.sticker_type || data.type || 'regular';
        const stickerList = Array.isArray(data.stickers) ? data.stickers
            : Array.isArray(data.data) ? data.data
                : Array.isArray(data.items) ? data.items
                    : [];
        if (!stickerList.length) {
            await conn.sendMessage(m.chat, { react: { text: '', key: m.key } });
            return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴛɪᴅᴀᴋ ᴀᴅᴀ ꜱᴛɪᴋᴇʀ ᴅɪᴛᴇᴍᴜᴋᴀɴ ᴅᴀʟᴀᴍ ᴘᴀᴄᴋ ɪɴɪ!\n╰┈┈┈┈┈┈┈┈⬡`);
        }
        const total = Math.min(stickerList.length, MAX_STICKERS);
        await m.reply(
            ` *ᴛᴇʟᴇɢʀᴀᴍ sᴛɪᴄᴋᴇʀ ᴘᴀᴄᴋ*\n\n` +
            `╭┈┈⬡「 *ɪɴꜰᴏ* 」\n` +
            `┃ ✧ *ᴛɪᴛʟᴇ:* ${title}\n` +
            `┃ ✧ *ᴀᴜᴛʜᴏʀ:* ${author}\n` +
            `┃ ✧ *ᴛʏᴘᴇ:* ${stickerType}\n` +
            `┃ ✧ *ᴛᴏᴛᴀʟ:* ${total} ꜱᴛɪᴋᴇʀ\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `>  Mengunduh & memproses...`
        );
        const webpBuffers = [];
        const emojiList = [];
        for (let i = 0; i < total; i++) {
            const s = stickerList[i];
            const src = s.dataUrl || s.url || s.file_url || s.file || '';
            if (!src)
                continue;
            const ext = (s.ext || '').replace('.', '') ||
                (src.includes('.tgs') ? 'tgs' : src.includes('.webm') ? 'webm' : 'webp');
            if (ext === 'tgs') {
                console.error(`[TELESTIKER] stiker ${i + 1} dilewati: format .tgs (Lottie) belum didukung`);
                continue;
            }
            try {
                const raw = await downloadBuffer(src);
                const buf = await toWebpBuffer(raw, ext);
                if (!buf || !(await isDecodableWebp(buf))) {
                    console.error(`[TELESTIKER] stiker ${i + 1} dilewati: hasil konversi tidak valid/korup`);
                    continue;
                }
                webpBuffers.push(buf);
                const emojiArr = Array.isArray(s.emojis) ? s.emojis.join('') : (s.emoji || s.emoticon || '');
                emojiList.push(emojiArr || '');
            }
            catch (e) {
                console.error(`[TELESTIKER] stiker ${i + 1} gagal:`, e?.message);
            }
            await new Promise((r) => setTimeout(r, 150));
        }
        if (!webpBuffers.length) {
            await conn.sendMessage(m.chat, { react: { text: '', key: m.key } });
            return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ꜱᴇᴍᴜᴀ ꜱᴛɪᴋᴇʀ ɢᴀɢᴀʟ ᴅɪᴜɴᴅᴜʜ/ᴅɪᴋᴏɴᴠᴇʀꜱɪ!\n╰┈┈┈┈┈┈┈┈⬡`);
        }
        await sendStickerPack(conn, m.chat, webpBuffers.map((buf, i) => ({
            buffer: buf,
            emojis: [emojiList[i] || ''],
        })), { name: title, publisher: author, description: `Telegram Sticker: ${title}`, quoted: m.raw });
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
    }
    catch (error) {
        console.error('[TELESTIKER] Error:', error?.message);
        await conn.sendMessage(m.chat, { react: { text: '', key: m.key } }).catch(() => { });
        await m.reply(`╭┈┈⬡「 *ᴇʀʀᴏʀ* 」\n┃\n┃ ✧ > ${error?.message}\n╰┈┈┈┈┈┈┈┈⬡`);
    }
};
handler.command = /^(stikertele|telesticker|tgsticker|tgpack)$/i;
handler.help = ['stikertele <url t.me/addstickers/...>'];
handler.tags = ['sticker'];
handler.limit = true;
export default handler;