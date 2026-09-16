//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import axios from 'axios';
import config from '../../config.js';
const SPACE_BASE = 'https://hugging-apps-kroma-krea2-lora-demo.hf.space';
const API_NAME = 'generate';
function getTokenList() {
    const raw = config.apiKeys?.huggingface;
    const list = Array.isArray(raw) ? raw.filter(Boolean) : raw ? [raw] : [];
    return list;
}
function authHeaders(token) {
    return token ? { Authorization: `Bearer ${token}` } : {};
}
async function callInfer(prompt, token) {
    const dataArray = [prompt, '', 0, true, 1024, 1024, 8, 0, 1];
    const postRes = await axios.post(
        `${SPACE_BASE}/gradio_api/call/${API_NAME}`,
        { data: dataArray },
        { timeout: 30000, headers: { 'Content-Type': 'application/json', ...authHeaders(token) } }
    );
    const eventId = postRes.data?.event_id;
    if (!eventId) throw new Error('Space tidak mengembalikan event_id (kemungkinan quota GPU habis).');
    const streamRes = await axios.get(`${SPACE_BASE}/gradio_api/call/${API_NAME}/${eventId}`, {
        responseType: 'text',
        timeout: 120000,
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
async function extractResultBuffer(output, token) {
    const first = Array.isArray(output) ? output[0] : output;
    if (!first) return null;
    if (typeof first === 'string') {
        const match = first.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/);
        if (match) return Buffer.from(match[1], 'base64');
        return null;
    }
    const url = first.url || (first.path ? `${SPACE_BASE}/file=${first.path}` : null);
    if (!url) return null;
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 60000, headers: authHeaders(token) });
    return Buffer.from(res.data);
}
async function processWithToken(prompt, token) {
    const output = await callInfer(prompt, token);
    const buffer = await extractResultBuffer(output, token);
    if (!buffer?.length) throw new Error('Response space tidak berisi gambar hasil.');
    return buffer;
}
async function processGenerate(prompt) {
    const tokens = getTokenList();
    if (!tokens.length) {
        throw new Error('Space ini butuh token HuggingFace (anonim selalu gagal). Isi apiKeys.huggingface di config.js.');
    }
    let lastErr;
    for (let i = 0; i < tokens.length; i++) {
        try {
            return await processWithToken(prompt, tokens[i]);
        }
        catch (e) {
            lastErr = e;
            if (!isQuotaError(e)) throw e;
            console.log(`[NANOBANANA] token index ${i} kena limit, coba token berikutnya...`);
        }
    }
    throw lastErr || new Error('QUOTA_HABIS');
}
const handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) {
        return m.reply(`Contoh:\n${usedPrefix + command} foto cewe cantik`);
    }
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
    try {
        const resultBuffer = await processGenerate(text);
        await conn.sendMessage(
            m.chat,
            { image: resultBuffer, mimetype: 'image/png', caption: `🍌 *Nano Banana*\n✧ Prompt: ${text}` },
            { quoted: m }
        );
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
    } catch (e) {
        console.error('[NANO BANANA]', e.message);
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
        if (isQuotaError(e)) {
            return m.reply('❌ Kuota ZeroGPU habis, semua token kena limit. Coba lagi beberapa saat lagi.');
        }
        return m.reply(`❌ Gagal membuat gambar: ${e.message}`);
    }
};
handler.help = ['nanobanana <prompt>'];
handler.tags = ['ai'];
handler.command = /^(nanobanana|nano)$/i;
export default handler;
