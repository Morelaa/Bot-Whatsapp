'use strict';
import axios from 'axios';
import { fileTypeFromBuffer } from 'file-type';
import config from '../../config.js';
import { findMediaMessage, downloadMessageMedia } from '../../Library/handle.js';
import { Toolkit } from '../../Library/MessageBuilder.js';
import { buildFkontak, formatBytes } from '../../Library/utils.js';
const FOOTER = `© ${config.copyrightName || config.botName || 'Bot'}`;
function bufferToBlob(buffer, mimeType) {
    return new Blob([buffer], { type: mimeType });
}
async function uploadCdnWA(buffer, fileName, ext, mime, conn) {
    const mediaType = mime.startsWith('video') ? 'video'
        : mime.startsWith('audio') ? 'audio'
            : mime.startsWith('image') ? 'image'
                : 'document';
    const url = await Toolkit.toUrl(conn, buffer, mediaType);
    if (!url) throw new Error('CDN WA tidak mengembalikan URL');
    return url;
}
async function uploadOrnzora(buffer, fileName, ext, mime) {
    const form = new FormData();
    form.append('file', bufferToBlob(buffer, mime), `${fileName}.${ext}`);
    const res = await fetch('https://cdn.ornzora.eu.cc/upload', { method: 'POST', body: form });
    const data = await res.json().catch(() => null);
    const url = data?.url || data?.data?.url || data?.link || data?.data?.link ||
        (typeof data === 'string' && data.startsWith('https://') ? data.trim() : null);
    if (!url) throw new Error('Ornzora tidak mengembalikan URL');
    return url;
}
async function uploadLitterbox(buffer, fileName, ext, mime) {
    const form = new FormData();
    form.append('fileToUpload', bufferToBlob(buffer, mime), `${fileName}.${ext}`);
    form.append('reqtype', 'fileupload');
    form.append('time', '72h');
    const res = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', { method: 'POST', body: form });
    const text = await res.text();
    if (text.startsWith('https://')) return text.trim();
    throw new Error(text || 'Litterbox gagal');
}
async function uploadGofile(buffer, fileName, ext, mime) {
    const srvRes = await fetch('https://api.gofile.io/servers');
    const srvData = await srvRes.json();
    const server = srvData?.data?.servers?.[0]?.name;
    if (!server) throw new Error('Gofile server gagal');
    const form = new FormData();
    form.append('file', bufferToBlob(buffer, mime), `${fileName}.${ext}`);
    const res = await fetch(`https://${server}.gofile.io/uploadFile`, { method: 'POST', body: form });
    const data = await res.json();
    if (!data?.data?.downloadPage) throw new Error('Gofile upload gagal');
    return data.data.downloadPage;
}
async function uploadQuax(buffer, fileName, ext, mime) {
    const form = new FormData();
    form.append('file', bufferToBlob(buffer, mime), `${fileName}.${ext}`);
    const res = await fetch('https://qu.ax/upload.php', { method: 'POST', body: form });
    const data = await res.json();
    if (!data?.success || !data?.files?.[0]?.url) throw new Error('Qu.ax gagal');
    return data.files[0].url;
}
async function uploadTmpFiles(buffer, fileName, ext, mime) {
    const form = new FormData();
    form.append('file', bufferToBlob(buffer, mime), `${fileName}.${ext}`);
    const res = await fetch('https://tmpfiles.org/api/v1/upload', { method: 'POST', body: form });
    const data = await res.json();
    if (data.status === 'success' && data.data?.url) {
        const parts = data.data.url.split('/');
        return `https://tmpfiles.org/dl/${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
    }
    throw new Error('TmpFiles gagal');
}
async function uploadImgBB(buffer) {
    const key = config.apiKeys?.imgbb;
    if (!key) throw new Error('API key ImgBB belum diatur');
    const base64 = buffer.toString('base64');
    const res = await axios.post(
        `https://api.imgbb.com/1/upload?key=${key}`,
        new URLSearchParams({ image: base64 }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 30000 }
    );
    const url = res.data?.data?.url;
    if (!url) throw new Error('ImgBB gagal');
    return url;
}
async function uploadPutIcu(buffer, fileName, ext, mime) {
    const res = await fetch('https://put.icu/upload/', {
        method: 'PUT',
        body: buffer,
        headers: { Accept: 'application/json', 'Content-Type': mime || 'application/octet-stream' },
    });
    if (!res.ok) throw new Error('Put.icu gagal');
    const data = await res.json();
    if (data?.direct_url) return data.direct_url;
    if (data?.url) return data.url;
    throw new Error('Put.icu: Invalid response');
}
const SERVICES = [
    { name: 'CDN WA', emoji: '💬', fn: uploadCdnWA, note: 'WhatsApp CDN', imageOnly: false },
    { name: 'Ornzora', emoji: '🌐', fn: uploadOrnzora, note: 'CDN Publik Permanen', imageOnly: false },
    { name: 'Litterbox', emoji: '🗃️', fn: uploadLitterbox, note: 'Expires 72 jam', imageOnly: false },
    { name: 'Gofile', emoji: '🗂️', fn: uploadGofile, note: 'Permanen', imageOnly: false },
    { name: 'Qu.ax', emoji: '🔗', fn: uploadQuax, note: 'Permanen', imageOnly: false },
    { name: 'TmpFiles', emoji: '⏳', fn: uploadTmpFiles, note: 'Expires 24 jam', imageOnly: false },
    { name: 'ImgBB', emoji: '🌅', fn: uploadImgBB, note: 'Khusus gambar', imageOnly: true },
    { name: 'Put.icu', emoji: '📡', fn: uploadPutIcu, note: 'Expires 1 hari', imageOnly: false },
];
const handler = async (m, { conn, usedPrefix }) => {
    const media = findMediaMessage(m);
    if (!media) {
        return m.reply(
            `╭┈┈⬡「 *ᴜᴘʟᴏᴀᴅ ꜰɪʟᴇ* 」\n┃\n` +
            `┃ ✧ ᴋɪʀɪᴍ ᴀᴛᴀᴜ ʀᴇᴘʟʏ ꜰɪʟᴇ/ꜰᴏᴛᴏ/ᴠɪᴅᴇᴏ\n` +
            `┃ ✧ ᴅᴇɴɢᴀɴ ᴄᴀᴘᴛɪᴏɴ *${usedPrefix}ᴛᴏᴜʀʟ*\n┃\n` +
            `┃ ✧ ʟᴀʏᴀɴᴀɴ ᴛᴇʀꜱᴇᴅɪᴀ:\n` +
            `┃ ✧ 💬 ᴄᴅɴ ᴡᴀ    — ᴡʜᴀᴛꜱᴀᴘᴘ ᴄᴅɴ\n` +
            `┃ ✧ 🌐 ᴏʀɴᴢᴏʀᴀ   — ᴄᴅɴ ᴘᴜʙʟɪᴋ ᴘᴇʀᴍᴀɴᴇɴ\n` +
            `┃ ✧ 🗃️ ʟɪᴛᴛᴇʀʙᴏx — ᴇxᴘɪʀᴇꜱ 72 ᴊᴀᴍ\n` +
            `┃ ✧ 🗂️ ɢᴏꜰɪʟᴇ    — ᴘᴇʀᴍᴀɴᴇɴ\n` +
            `┃ ✧ 🔗 ǫᴜ.ᴀx     — ᴘᴇʀᴍᴀɴᴇɴ\n` +
            `┃ ✧ ⏳ ᴛᴍᴘꜰɪʟᴇꜱ  — ᴇxᴘɪʀᴇꜱ 24 ᴊᴀᴍ\n` +
            `┃ ✧ 🌅 ɪᴍɢʙʙ     — ᴋʜᴜꜱᴜꜱ ɢᴀᴍʙᴀʀ\n` +
            `┃ ✧ 📡 ᴘᴜᴛ.ɪᴄᴜ   — ᴇxᴘɪʀᴇꜱ 1 ʜᴀʀɪ\n┃\n` +
            `┃ ✧ ꜱᴇᴍᴜᴀ ᴅɪᴜᴘʟᴏᴀᴅ ꜱᴇᴋᴀʟɪɢᴜꜱ!\n┃\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        );
    }
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
    let buffer;
    try {
        buffer = await downloadMessageMedia(m, conn);
        if (!buffer?.length) throw new Error('Buffer kosong');
    } catch (e) {
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        return m.reply(`╭┈┈⬡「 *ɢᴀɢᴀʟ ᴅᴏᴡɴʟᴏᴀᴅ ᴍᴇᴅɪᴀ* 」\n┃\n┃ ✧ ${e.message}\n╰┈┈┈┈┈┈┈┈⬡`);
    }
    const ft = await fileTypeFromBuffer(buffer);
    const ext = ft?.ext || 'bin';
    const mime = ft?.mime || 'application/octet-stream';
    const fileName = `upload-${Date.now()}`;
    const size = formatBytes(buffer.length);
    const isImage = mime.startsWith('image');
    await conn.sendMessage(m.chat, { react: { text: '⚙️', key: m.key } });
    const services = SERVICES.filter((svc) => !svc.imageOnly || isImage);
    const results = await Promise.allSettled(
        services.map((svc) => svc.fn(buffer, fileName, ext, mime, conn))
    );
    const lines = [
        `╭┈┈⬡「 📤 *ᴜᴘʟᴏᴀᴅ ʀᴇꜱᴜʟᴛ* 」`,
        `┃ ✧ 📁 \`${fileName}.${ext}\` • ${size}`,
        `┃ ✧ `,
    ];
    const buttons = [];
    let anySuccess = false;
    for (let i = 0; i < services.length; i++) {
        const svc = services[i];
        const res = results[i];
        if (res.status === 'fulfilled') {
            anySuccess = true;
            lines.push(`┃ ✧ ${svc.emoji} *${svc.name}* ✅ — ${svc.note}`);
            lines.push(`┃ ✧ `);
            buttons.push({
                name: 'cta_copy',
                buttonParamsJson: JSON.stringify({ display_text: `Salin ${svc.name}`, copy_code: res.value }),
            });
        } else {
            lines.push(`┃ ✧ ${svc.emoji} *${svc.name}* ❌ — ${res.reason?.message || 'gagal'}`);
            lines.push(`┃ ✧ `);
        }
    }
    lines.push(`╰┈┈┈┈┈┈┈┈⬡`);
    if (!buttons.length) {
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        return m.reply([...lines, FOOTER].join('\n'));
    }
    const fkontak = await buildFkontak(conn, config);
    await conn.relayMessage(m.chat, {
        interactiveMessage: {
            header: { hasMediaAttachment: false },
            body: { text: lines.join('\n') },
            footer: { text: FOOTER },
            contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                quotedMessage: fkontak.message,
                participant: fkontak.key.participant,
                stanzaId: fkontak.key.id,
                remoteJid: fkontak.key.remoteJid,
            },
            nativeFlowMessage: { messageParamsJson: '{}', buttons },
        },
    }, { messageId: conn.generateMessageTag() });
    await conn.sendMessage(m.chat, { react: { text: anySuccess ? '✅' : '❌', key: m.key } });
};
handler.help = ['tourl (kirim/reply file, foto, atau video)'];
handler.tags = ['tools'];
handler.command = /^(tourl|upload)$/i;
handler.limit = true;
export default handler;
