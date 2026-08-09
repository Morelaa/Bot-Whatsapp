'use strict';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import axios from 'axios';
import { spawn } from 'child_process';
import { getYoutubeResources, pickAudio } from '../../Library/vidssave.js';

const EXT_BY_FORMAT = { M4A: 'm4a', OPUS: 'opus', WEBM: 'weba' };
const MIME_BY_FORMAT = { M4A: 'audio/mp4', OPUS: 'audio/ogg', WEBM: 'audio/webm' };

function remuxAudio(buffer, inExt, outExt) {
    return new Promise((resolve, reject) => {
        const id = crypto.randomBytes(6).toString('hex');
        const inPath = path.join(os.tmpdir(), `ytmp3_${id}_in.${inExt}`);
        const outPath = path.join(os.tmpdir(), `ytmp3_${id}_out.${outExt}`);
        const cleanup = () => {
            try { fs.unlinkSync(inPath); } catch { }
            try { fs.unlinkSync(outPath); } catch { }
        };
        fs.writeFileSync(inPath, buffer);
        const args = ['-i', inPath, '-vn', '-acodec', 'copy', '-y', outPath];
        const ff = spawn('ffmpeg', args);
        let stderr = '';
        ff.stderr?.on('data', (d) => { stderr += d.toString(); });
        const timer = setTimeout(() => {
            ff.kill();
            cleanup();
            reject(new Error('ffmpeg timeout saat remux audio'));
        }, 60000);
        ff.on('close', (code) => {
            clearTimeout(timer);
            if (code === 0) {
                try {
                    const out = fs.readFileSync(outPath);
                    cleanup();
                    resolve(out);
                }
                catch (e) {
                    cleanup();
                    reject(e);
                }
            }
            else {
                cleanup();
                reject(new Error(`ffmpeg remux gagal (exit ${code}): ${stderr.slice(-300)}`));
            }
        });
        ff.on('error', (e) => { clearTimeout(timer); cleanup(); reject(e); });
    });
}

const handler = async (m, { conn, args }) => {
    const url = args[0];
    if (!url || !/(youtube\.com|youtu\.be)/.test(url)) {
        await m.reply(`╭┈┈⬡「 *ᴋᴀꜱɪʜ ʟɪɴᴋ ʏᴏᴜᴛᴜʙᴇ ʏᴀɴɢ ᴠᴀʟɪᴅ.* 」\n┃ ✧ ᴄᴏɴᴛᴏʜ: .ʏᴛᴍᴘ3 ʜᴛᴛᴘꜱ://ʏᴏᴜᴛᴜ.ʙᴇ/xxxxx\n╰┈┈┈┈┈┈┈┈⬡`);
        return;
    }
    await conn.sendMessage(m.chat, { react: { text: '', key: m.key } });
    let audioOut;
    try {
        const { title, thumbnail, resources } = await getYoutubeResources(url);
        const chosen = pickAudio(resources);
        if (!chosen) throw new Error('Tidak ada resource audio yang tersedia dari sumber.');
        const formatKey = String(chosen.format || '').toUpperCase();
        if (formatKey === 'WEBM') throw new Error('Format WEBM/Opus dari sumber ini sering gagal diputar di WhatsApp. Coba link lain.');
        const ext = EXT_BY_FORMAT[formatKey];
        const mimetype = MIME_BY_FORMAT[formatKey];
        if (!ext || !mimetype) throw new Error(`Format audio tidak dikenali: "${chosen.format}"`);
        const tempDir = path.join(process.cwd(), 'media', 'temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
        const stamp = Date.now();
        audioOut = path.join(tempDir, `${stamp}.${ext}`);
        const audioRes = await axios.get(chosen.download_url, {
            responseType: 'arraybuffer',
            timeout: 120000,
            headers: {
                Referer: 'https://id.vidssave.com/',
                Origin: 'https://id.vidssave.com',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });
        const contentType = String(audioRes.headers?.['content-type'] || '');
        const dataBuf = Buffer.from(audioRes.data);
        if (contentType.includes('text/html') || contentType.includes('application/json') || dataBuf.length < 10000) {
            throw new Error(`Link download dari vidssave sepertinya bukan file audio (content-type: ${contentType || 'unknown'}, size: ${dataBuf.length} bytes). Coba ulangi atau pakai link lain.`);
        }
        const fixedBuf = await remuxAudio(dataBuf, ext, ext);
        fs.writeFileSync(audioOut, fixedBuf);
        const sizeMB = fs.statSync(audioOut).size / 1024 / 1024;
        await conn.sendMessage(m.chat, { react: { text: '', key: m.key } });
        await conn.sendMessage(m.chat, {
            image: { url: thumbnail },
            caption: ` *${title}*\n ${chosen.quality} ${chosen.format}\n ${sizeMB.toFixed(2)} MB`,
        }, { quoted: m.raw });
        await conn.sendMessage(m.chat, {
            audio: fs.readFileSync(audioOut),
            mimetype,
            fileName: `${title}.${ext}`,
        }, { quoted: m.raw });
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
    }
    catch (err) {
        console.error('[YTMP3 ERROR]', err);
        await conn.sendMessage(m.chat, { react: { text: '', key: m.key } }).catch(() => { });
        await m.reply(' Gagal download audio: ' + err.message);
    }
    finally {
        try { if (audioOut && fs.existsSync(audioOut)) fs.unlinkSync(audioOut); } catch { }
    }
};
handler.help = ['ytmp3 <link YouTube>'];
handler.tags = ['downloader'];
handler.command = /^(ytmp3|yta|mp3)$/i;
handler.limit = true;
export default handler;