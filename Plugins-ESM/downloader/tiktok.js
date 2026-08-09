'use strict';
import axios from 'axios';
import crypto from 'crypto';
import { Carousel, Button } from '../../Library/MessageBuilder.js';
import { buildFkontak } from '../../Library/utils.js';
import config from '../../config.js';
const TT_URL_REGEX =
    /https?:\/\/(?:www\.|m\.|vm\.|vt\.|v\.)?tiktok\.com(?:\/[^\s]*)?|https?:\/\/(?:vm|vt)\.tiktok\.com\/[^\s]*/i;
const SNAPTIK_BASE = 'https://snaptik.app';
const SNAPTIK_SECRET = 'sn4pt1k_v3r1fy2026';
function numFmt(n) {
    const num = parseInt(n) || 0;
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    return String(num);
}
function solveChallenge(c) {
    switch (c.t) {
        case 'b': return (c.a ^ c.b) >> c.s & 255;
        case 'r': return c.n.reduce((a, b) => a + b, 0) * 2 + 1;
        case 'c': return c.w.charCodeAt(c.i) * c.m;
        case 'm': return (c.a + c.b) % 100 * c.c;
        case 'n': return c.a * c.b + c.b * c.c + c.c * c.a - c.a;
        default: throw new Error(`Tipe challenge tidak dikenal: ${c.t}`);
    }
}
function buildXVerify(id, p) {
    const raw = Buffer.from(p, 'base64');
    const iv = raw.subarray(0, 16);
    const ciphertext = raw.subarray(16);
    const key = crypto.createHash('sha256').update(`${SNAPTIK_SECRET}:${id}`).digest();
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
    const challenge = JSON.parse(plaintext);
    const { _e, _h } = challenge;
    delete challenge._e;
    delete challenge._h;
    const answer = solveChallenge(challenge);
    return `${id}:${answer}:${_e}:${_h}`;
}
async function getXVerify() {
    const res = await axios.post(`${SNAPTIK_BASE}/api/token`, {}, {
        headers: { 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/json' },
        timeout: 15000,
    });
    const { id, p } = res.data || {};
    if (!id || !p) throw new Error('Respons /api/token tidak lengkap (kemungkinan snaptik ganti format).');
    return buildXVerify(id, p);
}
async function fetchSnaptik(url, retry = true) {
    const xVerify = await getXVerify();
    try {
        const res = await axios.get(`${SNAPTIK_BASE}/api/extract`, {
            params: { url },
            headers: { 'X-Requested-With': 'XMLHttpRequest', 'X-Verify': xVerify },
            timeout: 30000,
        });
        const d = res.data;
        if (!d?.success || !d?.data) throw new Error(d?.error || 'Snaptik gagal proses link ini.');
        return d.data;
    }
    catch (err) {
        if (retry && err?.response?.status === 403) return fetchSnaptik(url, false);
        throw new Error(err?.response?.data?.error || err.message);
    }
}
async function downloadBuffer(fileUrl) {
    const res = await axios.get(fileUrl, {
        responseType: 'arraybuffer',
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 90000,
        maxRedirects: 10,
    });
    return Buffer.from(res.data);
}
function extractAudioUrlFromRenderLink(renderUrl) {
    try {
        const token = new URL(renderUrl).searchParams.get('token');
        if (!token) return null;
        const payloadB64 = token.split('.')[1];
        if (!payloadB64) return null;
        const json = Buffer.from(payloadB64, 'base64url').toString('utf8');
        const payload = JSON.parse(json);
        return payload.audio_url || null;
    }
    catch {
        return null;
    }
}
const handler = async (m, { conn, args }) => {
    const url = args[0];
    if (!url || !TT_URL_REGEX.test(url)) {
        await m.reply(`╭┈┈⬡「 *ᴋᴀꜱɪʜ ʟɪɴᴋ ᴛɪᴋᴛᴏᴋ ʏᴀɴɢ ᴠᴀʟɪᴅ.* 」\n┃ ✧ ᴄᴏɴᴛᴏʜ:\n┃ ✧ .ᴛɪᴋᴛᴏᴋ ʜᴛᴛᴘꜱ://ᴠᴛ.ᴛɪᴋᴛᴏᴋ.ᴄᴏᴍ/xxx\n┃ ✧ .ᴛɪᴋᴛᴏᴋ ʜᴛᴛᴘꜱ://ᴠᴍ.ᴛɪᴋᴛᴏᴋ.ᴄᴏᴍ/xxx\n┃ ✧ .ᴛɪᴋᴛᴏᴋ ʜᴛᴛᴘꜱ://ᴡᴡᴡ.ᴛɪᴋᴛᴏᴋ.ᴄᴏᴍ/@ᴜꜱᴇʀ/ᴠɪᴅᴇᴏ/xxx\n╰┈┈┈┈┈┈┈┈⬡`);
        return;
    }
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
    try {
        const data = await fetchSnaptik(url);
        await conn.sendMessage(m.chat, { react: { text: '', key: m.key } });
        const authorName = data.author?.name || data.author?.username || 'unknown';
        const stats = data.stats || {};
        const caption =
            ` *TikTok*\n` +
            `${authorName}${data.author?.username ? ` (@${data.author.username})` : ''}\n` +
            `${(data.title || '').slice(0, 80)}${(data.title || '').length > 80 ? '...' : ''}\n` +
            ` ${numFmt(stats.playCount)}   ${numFmt(stats.commentCount)}   ${numFmt(stats.shareCount)}`;
        const fkontak = await buildFkontak(conn, config);
        const fkontakContext = {
            quotedMessage: fkontak.message,
            participant: fkontak.key.participant,
            stanzaId: fkontak.key.id,
            remoteJid: fkontak.key.remoteJid,
        };
        if (data.type === 'carousel' && Array.isArray(data.images) && data.images.length) {
            const cards = [];
            for (let i = 0; i < data.images.length; i++) {
                const img = data.images[i];
                const buf = await downloadBuffer(img.downloadUrl || img.url);
                const cardBuilder = new Button(conn).setImage(buf);
                if (i === 0) {
                    cardBuilder.setTitle(authorName).setSubtitle(data.author?.username ? `@${data.author.username}` : '');
                }
                cardBuilder.addUrl('Buka di TikTok', url);
                cards.push(await cardBuilder.toCard());
            }
            try {
                const carousel = new Carousel(conn)
                    .setBody(caption)
                    .setContextInfo(fkontakContext)
                    .addCard(cards);
                await carousel.send(m.chat);
            }
            catch (e) {
                console.error('[TT] gagal kirim carousel, fallback ke gambar biasa:', e.message);
                for (let i = 0; i < data.images.length; i++) {
                    const img = data.images[i];
                    const buf = await downloadBuffer(img.downloadUrl || img.url);
                    await conn.sendMessage(m.chat, { image: buf, caption: i === 0 ? caption : undefined, contextInfo: fkontakContext });
                }
            }
            const audioUrl = extractAudioUrlFromRenderLink(data.downloadUrl);
            if (audioUrl) {
                try {
                    const audioBuf = await downloadBuffer(audioUrl);
                    await conn.sendMessage(m.chat, { audio: audioBuf, mimetype: 'audio/mpeg', ptt: false, contextInfo: fkontakContext });
                }
                catch (e) {
                    const status = e?.response?.status;
                    console.error('[TT] gagal kirim audio slide:', status || '', e.message);
                    const info = status
                        ? `_Audio slide gagal diambil (CDN TikTok menolak permintaan, kode ${status}). Gambar tetap terkirim di atas._`
                        : `_Audio slide gagal diambil (${e.message}). Gambar tetap terkirim di atas._`;
                    await m.reply(info).catch(() => { });
                }
            }
            else {
                console.error('[TT] audio_url tidak ditemukan di render token untuk:', data.downloadUrl);
                await m.reply('_Audio slide tidak ditemukan pada sumber ini. Gambar tetap terkirim di atas._').catch(() => { });
            }
        }
        else {
            const videoBuf = await downloadBuffer(data.downloadUrl);
            const sizeMB = (videoBuf.length / 1024 / 1024).toFixed(2);
            await conn.sendMessage(m.chat, { video: videoBuf, caption: `${caption}\n ${sizeMB} MB`, contextInfo: fkontakContext });
        }
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
    }
    catch (err) {
        console.error('[TT]', err.message);
        await conn.sendMessage(m.chat, { react: { text: '', key: m.key } }).catch(() => { });
        await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ɢᴀɢᴀʟ ᴅᴏᴡɴʟᴏᴀᴅ: ${err.message}\n╰┈┈┈┈┈┈┈┈⬡`);
    }
};
handler.help = ['tiktok <link tiktok>'];
handler.tags = ['downloader'];
handler.command = /^(tiktok|tt)$/i;
handler.limit = true;
export default handler;