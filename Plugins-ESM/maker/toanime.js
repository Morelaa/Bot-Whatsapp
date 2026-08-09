'use strict';
import axios from 'axios';
import sharp from 'sharp';
import config from '../../config.js';
import { findMediaMessage, downloadMessageMedia } from '../../Library/handle.js';
import { buildFkontak } from '../../Library/utils.js';

const SPACE_BASE = 'https://prithivmlmods-qwen-image-edit-2511-loras-fast.hf.space';
const LORA_ADAPTER = 'Photo-to-Anime';
const ANIME_PROMPT =
    'convert this photo into anime style, high quality anime art, clean line art, cel shading, ' +
    'vibrant colors, detailed anime illustration, keep the same composition, pose, and subject';

function clampDimension(value, min = 256, max = 2048, multiple = 64) {
    const rounded = Math.round(value / multiple) * multiple;
    return Math.min(max, Math.max(min, rounded));
}

async function padToSquare(buffer) {
    const meta = await sharp(buffer).metadata();
    const origW = meta.width || 1024;
    const origH = meta.height || 1024;
    const size = clampDimension(Math.max(origW, origH));
    const scale = Math.min(size / origW, size / origH);
    const placedW = Math.max(1, Math.round(origW * scale));
    const placedH = Math.max(1, Math.round(origH * scale));
    const offsetX = Math.floor((size - placedW) / 2);
    const offsetY = Math.floor((size - placedH) / 2);
    const resized = await sharp(buffer).resize(placedW, placedH).toBuffer();
    const padded = await sharp({
        create: { width: size, height: size, channels: 3, background: { r: 255, g: 255, b: 255 } },
    })
        .composite([{ input: resized, left: offsetX, top: offsetY }])
        .jpeg()
        .toBuffer();
    return {
        buffer: padded,
        size,
        region: { left: offsetX / size, top: offsetY / size, width: placedW / size, height: placedH / size },
        origW,
        origH,
    };
}

async function unpadResult(resultBuffer, padInfo) {
    const meta = await sharp(resultBuffer).metadata();
    const outW = meta.width || padInfo.size;
    const outH = meta.height || padInfo.size;
    const marginX = Math.round(padInfo.region.width * outW * 0.015);
    const marginY = Math.round(padInfo.region.height * outH * 0.015);
    const rawLeft = Math.round(padInfo.region.left * outW);
    const rawTop = Math.round(padInfo.region.top * outH);
    const rawWidth = Math.round(padInfo.region.width * outW);
    const rawHeight = Math.round(padInfo.region.height * outH);
    const left = Math.max(0, rawLeft + marginX);
    const top = Math.max(0, rawTop + marginY);
    const width = Math.max(1, Math.min(outW - left, rawWidth - marginX * 2));
    const height = Math.max(1, Math.min(outH - top, rawHeight - marginY * 2));
    return sharp(resultBuffer)
        .extract({ left, top, width, height })
        .resize(padInfo.origW, padInfo.origH)
        .jpeg()
        .toBuffer();
}

function getTokenList() {
    const raw = config.apiKeys?.huggingface;
    const list = Array.isArray(raw) ? raw.filter(Boolean) : raw ? [raw] : [];
    return list;
}

function authHeaders(token) {
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function callInfer(paddedBuffer, token) {
    const dataUri = `data:image/jpeg;base64,${paddedBuffer.toString('base64')}`;
    const dataArray = [JSON.stringify([dataUri]), ANIME_PROMPT, LORA_ADAPTER, 0, true, 1, 4];
    const postRes = await axios.post(
        `${SPACE_BASE}/gradio_api/call/infer`,
        { data: dataArray },
        { timeout: 30000, headers: { 'Content-Type': 'application/json', ...authHeaders(token) } }
    );
    const eventId = postRes.data?.event_id;
    if (!eventId) throw new Error('Space tidak mengembalikan event_id (kemungkinan quota GPU habis).');
    const streamRes = await axios.get(`${SPACE_BASE}/gradio_api/call/infer/${eventId}`, {
        responseType: 'text',
        timeout: 180000,
        headers: authHeaders(token),
    });
    const text = String(streamRes.data);
    const blocks = [...text.matchAll(/event:\s*(\w+)[^\n]*\ndata:\s*(.*)/g)];
    const errorEvt = blocks.find((b) => b[1] === 'error');
    if (errorEvt) {
        const rawMsg = errorEvt[2].slice(0, 300);
        if (/quota|zerogpu|gpu.{0,20}(exceed|limit)|rate.?limit|too many requests|^null$/i.test(rawMsg)) {
            throw new Error('QUOTA_HABIS');
        }
        throw new Error(`Space mengembalikan error: ${rawMsg}`);
    }
    const completeEvt = [...blocks].reverse().find((b) => b[1] === 'complete');
    if (!completeEvt) throw new Error('Event "complete" tidak ditemukan di response stream (format space mungkin beda).');
    return JSON.parse(completeEvt[2]);
}

function isQuotaError(e) {
    const status = e?.response?.status;
    const rawMsg = e?.response?.data ? JSON.stringify(e.response.data) : e.message;
    return e.message === 'QUOTA_HABIS' || status === 429 || /quota|zerogpu|gpu.{0,20}(exceed|limit)|rate.?limit/i.test(String(rawMsg));
}

function extractResultUrl(output) {
    const first = Array.isArray(output) ? output[0] : output;
    const fileObj = Array.isArray(first) ? first[0]?.image || first[0] : first;
    return fileObj?.url || (fileObj?.path ? `${SPACE_BASE}/gradio_api/file=${fileObj.path}` : null);
}

async function processWithToken(buffer, token, padInfo) {
    const output = await callInfer(padInfo.buffer, token);
    const resultUrl = extractResultUrl(output);
    if (!resultUrl) throw new Error('Response space tidak berisi gambar hasil.');
    const imgRes = await axios.get(resultUrl, { responseType: 'arraybuffer', timeout: 60000, headers: authHeaders(token) });
    const rawResult = Buffer.from(imgRes.data);
    return unpadResult(rawResult, padInfo);
}

async function processAnime(buffer) {
    const padInfo = await padToSquare(buffer);
    const tokens = getTokenList();
    if (!tokens.length) {
        throw new Error('Space ini butuh token HuggingFace (anonim selalu gagal). Isi apiKeys.huggingface di config.js.');
    }
    let lastErr;
    for (let i = 0; i < tokens.length; i++) {
        try {
            return await processWithToken(buffer, tokens[i], padInfo);
        }
        catch (e) {
            lastErr = e;
            if (!isQuotaError(e)) throw e;
            console.log(`[TOANIME] token index ${i} kena limit, coba token berikutnya...`);
        }
    }
    throw lastErr || new Error('QUOTA_HABIS');
}

const handler = async (m, { conn, usedPrefix, command }) => {
    const media = findMediaMessage(m);
    if (!media || media.type !== 'imageMessage') {
        return m.reply(
            `╭┈┈⬡「 🎨 *ᴛᴏ ᴀɴɪᴍᴇ* 」\n┃\n┃ ✧ ʀᴇᴘʟʏ ɢᴀᴍʙᴀʀ ᴜɴᴛᴜᴋ ᴅɪᴜʙᴀʜ\n┃ ✧ ᴋᴇ ɢᴀʏᴀ ᴀɴɪᴍᴇ ꜱᴇᴄᴀʀᴀ ᴏᴛᴏᴍᴀᴛɪꜱ.\n┃\n┃ ✧ ꜰᴏʀᴍᴀᴛ:\n┃ ✧ ʀᴇᴘʟʏ ꜰᴏᴛᴏ + ${usedPrefix}${command}\n┃\n╰┈┈┈┈┈┈┈┈⬡`
        );
    }
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
    let buffer;
    try {
        buffer = await downloadMessageMedia(m, conn);
        if (!buffer?.length) throw new Error('Buffer kosong');
    }
    catch (e) {
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ɢᴀɢᴀʟ ᴅᴏᴡɴʟᴏᴀᴅ ɢᴀᴍʙᴀʀ: ${e.message}\n╰┈┈┈┈┈┈┈┈⬡`);
    }
    try {
        const resultBuffer = await processAnime(buffer);
        const fk = await buildFkontak(conn, config);
        await conn.sendMessage(
            m.chat,
            { image: resultBuffer, caption: `╭┈┈⬡「 🎨 *ᴛᴏ ᴀɴɪᴍᴇ* 」\n┃ ✧ ʙᴇʀʜᴀꜱɪʟ ᴅɪᴜʙᴀʜ ᴋᴇ ɢᴀʏᴀ ᴀɴɪᴍᴇ\n╰┈┈┈┈┈┈┈┈⬡\n\n_© ${config.botName}_` },
            { quoted: fk }
        );
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
    }
    catch (e) {
        console.error('[TOANIME]', e.message);
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        if (isQuotaError(e)) {
            return m.reply(`╭┈┈⬡「 *ᴋᴜᴏᴛᴀ ʜᴀʙɪꜱ* 」\n┃\n┃ ✧ ꜱᴇᴍᴜᴀ ᴛᴏᴋᴇɴ ᴅɪ ᴄᴏɴꜰɪɢ.ᴊꜱ\n┃ ✧ (apiKeys.huggingface) ꜱᴜᴅᴀʜ ᴋᴇɴᴀ\n┃ ✧ ʟɪᴍɪᴛ ᴋᴜᴏᴛᴀ ᴢᴇʀᴏɢᴘᴜ. ᴄᴏʙᴀ ʟᴀɢɪ\n┃ ✧ ɴᴀɴᴛɪ, ᴀᴛᴀᴜ ᴛᴀᴍʙᴀʜ ᴛᴏᴋᴇɴ ʙᴀʀᴜ.\n╰┈┈┈┈┈┈┈┈⬡`);
        }
        return m.reply(`╭┈┈⬡「 *ɢᴀɢᴀʟ ᴘʀᴏꜱᴇꜱ ᴛᴏ ᴀɴɪᴍᴇ* 」\n┃\n┃ ✧ ${e.message}\n╰┈┈┈┈┈┈┈┈⬡`);
    }
};

handler.help = ['toanime <reply foto>'];
handler.tags = ['maker'];
handler.command = /^(toanime|animeify|jadianime)$/i;
handler.limit = true;
export default handler;