//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import axios from 'axios';
import sharp from 'sharp';
import { spawn } from 'child_process';
import * as baileys from '@itsliaaa/baileys';
import { getYoutubeResources, pickAudio } from '../../Library/vidssave.js';
async function buildOrderQuote({ thumbnailUrl, title, orderTitle }) {
    let thumbBuf = Buffer.alloc(0);
    try {
        const res = await axios.get(thumbnailUrl, { responseType: 'arraybuffer', timeout: 15000 });
        thumbBuf = await sharp(Buffer.from(res.data))
            .trim()
            .resize(300, 300, { fit: 'cover', position: 'center' })
            .jpeg({ quality: 80 })
            .toBuffer();
    }
    catch (e) {
        console.error('[THUMBNAIL ERROR]', e);
    }
    return {
        participant: '0@s.whatsapp.net',
        remoteJid: 'status@broadcast',
        quotedMessage: {
            orderMessage: {
                orderId: String(Date.now()),
                thumbnail: thumbBuf,
                itemCount: 1,
                status: 0,
                surface: 0,
                message: title,
                orderTitle,
                sellerJid: '0@s.whatsapp.net',
                totalAmount1000: '0',
                totalCurrencyCode: 'IDR',
            },
        },
    };
}
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
        const orderQuote = await buildOrderQuote({
            thumbnailUrl: thumbnail,
            title,
            orderTitle: `🎵 ${chosen.quality} ${chosen.format} • ${sizeMB.toFixed(2)} MB`,
        });
        const audioBuf = fs.readFileSync(audioOut);
        const media = await baileys.prepareWAMessageMedia({ audio: audioBuf, mimetype, ptt: false }, { upload: conn.waUploadToServer });
        await conn.relayMessage(
            m.chat,
            {
                audioMessage: {
                    ...media.audioMessage,
                    fileName: `${title}.${ext}`,
                    contextInfo: orderQuote,
                },
            },
            { messageId: conn.generateMessageTag() }
        );
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
