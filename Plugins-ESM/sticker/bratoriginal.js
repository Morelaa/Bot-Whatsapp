'use strict';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import config from '../../config.js';
import { buildFkontak } from '../../Library/utils.js';
const TMP = path.join(config.mediaDir, 'brat');
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const UA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36';
class PicsArtUpscaler {
    constructor() {
        this.authToken = null;
        this.uploadUrl = 'https://upload.picsart.com/files';
        this.enhanceUrl = 'https://ai.picsart.com/gw1/diffbir-enhancement-service/v1.7.6';
        this.jsUrl = 'https://picsart.com/-/landings/4.290.0/static/index-msH24PNW-B73n3SC9.js';
    }
    async getAuthToken() {
        if (this.authToken) return this.authToken;
        const res = await axios.get(this.jsUrl, { headers: { 'User-Agent': UA }, timeout: 10000 });
        const match = res.data.match(/"x-app-authorization":"Bearer ([^"]+)"/);
        if (!match) throw new Error('Token PicsArt tidak ditemukan');
        this.authToken = `Bearer ${match[1]}`;
        return this.authToken;
    }
    async uploadBuffer(buffer) {
        await this.getAuthToken();
        const form = new FormData();
        form.append('type', 'editing-temp-landings');
        form.append('file', new Blob([buffer], { type: 'image/jpeg' }), 'image.jpeg');
        form.append('url', '');
        form.append('metainfo', '');
        const res = await fetch(this.uploadUrl, {
            method: 'POST',
            headers: {
                accept: '*/*',
                origin: 'https://picsart.com',
                referer: 'https://picsart.com/',
                'user-agent': UA,
            },
            body: form,
        });
        const data = await res.json().catch(() => null);
        if (!data?.result?.url) throw new Error('Upload ke PicsArt gagal');
        return data.result.url;
    }
    async enhanceImage(imageUrl, targetScale = 2) {
        const scale = Math.max(1, Math.min(20, targetScale));
        const params = new URLSearchParams({ picsart_cdn_url: imageUrl, format: 'PNG', model: 'REALESERGAN' });
        const payload = {
            image_url: imageUrl,
            colour_correction: { enabled: false, blending: 0.5 },
            face_enhancement: { enabled: false },
            seed: 42,
            upscale: { enabled: true, node: 'esrgan', target_scale: scale },
        };
        const res = await axios.post(`${this.enhanceUrl}?${params.toString()}`, payload, {
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                origin: 'https://picsart.com',
                referer: 'https://picsart.com/',
                'user-agent': UA,
                'x-app-authorization': this.authToken,
                'x-touchpoint': 'widget_EnhancedImage',
                'x-touchpoint-referrer': '/image-upscale/',
            },
            timeout: 30000,
        });
        if (!res.data?.id) throw new Error('Enhance request gagal');
        return res.data;
    }
    async checkStatus(jobId) {
        const res = await axios.get(`${this.enhanceUrl}/${jobId}`, {
            headers: { accept: 'application/json', origin: 'https://picsart.com', referer: 'https://picsart.com/', 'user-agent': UA, 'x-app-authorization': this.authToken },
            timeout: 10000,
        });
        return res.data;
    }
    async waitForCompletion(jobId) {
        let attempts = 0;
        while (attempts < 30) {
            try {
                const status = await this.checkStatus(jobId);
                if (status.status === 'DONE') return status.result.image_url;
                if (status.status === 'FAILED') throw new Error(`PicsArt failed: ${status.error_message || 'Unknown'}`);
                await sleep(2000);
                attempts++;
            } catch (e) {
                if (attempts >= 5) throw e;
                await sleep(3000);
                attempts++;
            }
        }
        throw new Error('Timeout menunggu PicsArt');
    }
    async upscale(buffer, targetScale = 2) {
        const uploadedUrl = await this.uploadBuffer(buffer);
        const enhanceResponse = await this.enhanceImage(uploadedUrl, targetScale);
        const resultUrl = await this.waitForCompletion(enhanceResponse.id);
        const res = await axios.get(resultUrl, { responseType: 'arraybuffer', timeout: 30000 });
        return Buffer.from(res.data);
    }
}
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
            .on('error', reject)
            .save(output);
    });
const handler = async (m, { conn, text, usedPrefix }) => {
    if (!text?.trim()) return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴄᴏɴᴛᴏʜ: ${usedPrefix}ʙʀᴀᴛᴏʀɪɢɪɴᴀʟ ʜᴀʟᴏᴏᴏ ꜱᴇᴍᴜᴀᴀᴀ ɴʏᴀᴀᴀᴀ\n╰┈┈┈┈┈┈┈┈⬡`);
    if (text.length > 800) return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴛᴇxᴛ ᴛᴇʀʟᴀʟᴜ ᴘᴀɴᴊᴀɴɢ! ᴍᴀᴋꜱ *800 ᴋᴀʀᴀᴋᴛᴇʀ*.\n╰┈┈┈┈┈┈┈┈⬡`);
    const id = Date.now();
    const img = path.join(TMP, `${id}.png`);
    const webp = path.join(TMP, `${id}.webp`);
    try { await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }); } catch {}
    try {
        const res = await axios.get(`https://api.deline.web.id/maker/brat?text=${encodeURIComponent(text.trim().slice(0, 800))}`, {
            responseType: 'arraybuffer',
            timeout: 30000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', Accept: 'image/png, image/jpeg, image/*, */*' },
        });
        const contentType = res.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
            const json = JSON.parse(Buffer.from(res.data).toString());
            throw new Error(json.message || json.error || 'API error');
        }
        let buffer = Buffer.from(res.data);
        if (buffer.length < 1000) throw new Error('Generated image terlalu kecil / rusak');
        try {
            const upscaler = new PicsArtUpscaler();
            buffer = await upscaler.upscale(buffer, 2);
        } catch (hdErr) {
            console.warn(
                '[BRAT] HD upscale gagal, pakai original:',
                hdErr?.response?.status || '',
                hdErr?.response?.data ? JSON.stringify(hdErr.response.data) : (hdErr?.message || hdErr)
            );
        }
        fs.writeFileSync(img, buffer);
        await imageToWebp(img, webp);
        await sleep(500);
        const fk = await buildFkontak(conn, config).catch(() => null);
        await conn.sendMessage(m.chat, { sticker: fs.readFileSync(webp) }, { quoted: fk || m.raw });
        await sleep(500);
        try { await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } }); } catch {}
    } catch (e) {
        console.error('[BRAT]', e?.message || e);
        try { await conn.sendMessage(m.chat, { react: { text: '', key: m.key } }); } catch {}
        m.reply(' Gagal buat stiker brat: ' + (e?.message || 'unknown error'));
    } finally {
        try { fs.unlinkSync(img); } catch {}
        try { fs.unlinkSync(webp); } catch {}
    }
};
handler.command = /^(bratoriginal|bratorig)$/i;
handler.tags = ['sticker'];
handler.help = ['bratoriginal <teks>'];
handler.limit = true;
export default handler;
