//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import ffmpeg from 'fluent-ffmpeg';
import { findMediaMessage, downloadMessageMedia } from '../../Library/handle.js';
import config from '../../config.js';
export const pendingTovid = new Map();
const TIMEOUT_MS = 3 * 60 * 1000; 
function tmpFile(ext) {
    return path.join(os.tmpdir(), `tovid-${crypto.randomBytes(6).toString('hex')}.${ext}`);
}
async function combineImageAudio(imageBuffer, audioBuffer) {
    const imgPath = tmpFile('jpg');
    const audioPath = tmpFile('m4a');
    const outPath = tmpFile('mp4');
    fs.writeFileSync(imgPath, imageBuffer);
    fs.writeFileSync(audioPath, audioBuffer);
    try {
        await new Promise((resolve, reject) => {
            ffmpeg()
                .input(imgPath)
                .inputOptions(['-loop 1'])
                .input(audioPath)
                .outputOptions([
                    '-vf scale=trunc(iw/2)*2:trunc(ih/2)*2',
                    '-c:v libx264',
                    '-tune stillimage',
                    '-c:a aac',
                    '-b:a 192k',
                    '-pix_fmt yuv420p',
                    '-shortest',
                    '-movflags +faststart',
                ])
                .on('error', reject)
                .on('end', resolve)
                .save(outPath);
        });
        return fs.readFileSync(outPath);
    } finally {
        for (const p of [imgPath, audioPath, outPath]) {
            try { fs.unlinkSync(p); } catch {}
        }
    }
}
async function combineVideoAudio(videoBuffer, audioBuffer) {
    const videoPath = tmpFile('mp4');
    const audioPath = tmpFile('m4a');
    const outPath = tmpFile('mp4');
    fs.writeFileSync(videoPath, videoBuffer);
    fs.writeFileSync(audioPath, audioBuffer);
    try {
        await new Promise((resolve, reject) => {
            ffmpeg()
                .input(videoPath)
                .input(audioPath)
                .outputOptions([
                    '-map 0:v:0',
                    '-map 1:a:0',
                    '-c:v copy',
                    '-c:a aac',
                    '-b:a 192k',
                    '-shortest',
                    '-movflags +faststart',
                ])
                .on('error', reject)
                .on('end', resolve)
                .save(outPath);
        });
        return fs.readFileSync(outPath);
    } finally {
        for (const p of [videoPath, audioPath, outPath]) {
            try { fs.unlinkSync(p); } catch {}
        }
    }
}
function clearPending(sender) {
    const p = pendingTovid.get(sender);
    if (p?.timer) clearTimeout(p.timer);
    pendingTovid.delete(sender);
}
const onText = async (m, { conn }) => {
    if (m.fromMe) return false;
    const sender = m.sender;
    const pending = pendingTovid.get(sender);
    if (!pending) return false;
    if (m.chat !== pending.chat) return false;
    const media = findMediaMessage(m);
    const mimetype = media?.message?.mimetype || '';
    const isAudio = media?.type === 'audioMessage' || (media?.type === 'documentMessage' && mimetype.startsWith('audio/'));
    if (!isAudio) {
        return false;
    }
    clearPending(sender);
    await conn.sendMessage(m.chat, { react: { text: '🕒', key: m.key } });
    try {
        const audioBuffer = await downloadMessageMedia(m, conn);
        if (!audioBuffer) throw new Error('Gagal download audio.');
        const videoBuffer =
            pending.type === 'video'
                ? await combineVideoAudio(pending.mediaBuffer, audioBuffer)
                : await combineImageAudio(pending.mediaBuffer, audioBuffer);
        await conn.sendMessage(
            m.chat,
            { video: videoBuffer, caption: `꒰ © ${config.botName} ꒱`, mimetype: 'video/mp4' },
            { quoted: m.raw }
        );
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
    } catch (err) {
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        await m.reply(
            `╭┈┈⬡「 *ɢᴀɢᴀʟ* 」\n┃ ✧ ᴛɪᴅᴀᴋ ʙɪsᴀ ɢᴀʙᴜɴɢ ᴍᴇᴅɪᴀ + ᴀᴜᴅɪᴏ.\n┃ ✧ ${err?.message || 'Unknown error'}\n╰┈┈┈┈┈┈┈┈⬡`
        );
    }
    return true;
};
const handler = async (m, { conn, command }) => {
    if (command === 'canceltovid') {
        if (!pendingTovid.has(m.sender)) {
            return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴛɪᴅᴀᴋ ᴀᴅᴀ ᴘʀᴏsᴇs ᴛᴏᴠɪᴅ ʏᴀɴɢ ʙᴇʀᴊᴀʟᴀɴ.\n╰┈┈┈┈┈┈┈┈⬡`);
        }
        clearPending(m.sender);
        return m.reply(`╭┈┈⬡「 *ᴅɪʙᴀᴛᴀʟᴋᴀɴ* 」\n┃\n┃ ✧ ᴘʀᴏsᴇs ᴛᴏᴠɪᴅ sᴜᴅᴀʜ ᴅɪʙᴀᴛᴀʟᴋᴀɴ.\n╰┈┈┈┈┈┈┈┈⬡`);
    }
    const media = findMediaMessage(m);
    const isImage = media?.type === 'imageMessage';
    const isVideo = media?.type === 'videoMessage';
    if (!media || (!isImage && !isVideo)) {
        return m.reply(
            `╭┈┈⬡「 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n┃\n` +
            `┃ ✧ ᴋɪʀɪᴍ/ʀᴇᴘʟʏ ꜰᴏᴛᴏ ᴀᴛᴀᴜ ᴠɪᴅᴇᴏ ᴅᴇɴɢᴀɴ ᴄᴀᴘᴛɪᴏɴ *.ᴛᴏᴠɪᴅ*\n` +
            `┃ ✧ ʙᴏᴛ ᴀᴋᴀɴ ᴍɪɴᴛᴀ ᴀᴜᴅɪᴏ sᴇᴛᴇʟᴀʜ ɪᴛᴜ\n` +
            `┃ ✧ ᴋᴀʟᴀᴜ ᴠɪᴅᴇᴏ sᴜᴅᴀʜ ᴀᴅᴀ ʟᴀɢᴜ, ᴏᴛᴏᴍᴀᴛɪs ᴅɪɢᴀɴᴛɪ ᴅᴇɴɢᴀɴ ʏᴀɴɢ ᴋᴀᴍᴜ ᴜᴘʟᴏᴀᴅ\n┃\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        );
    }
    const mediaBuffer = await downloadMessageMedia(m, conn);
    if (!mediaBuffer) return m.reply(`╭┈┈⬡「 *ɢᴀɢᴀʟ* 」\n┃ ✧ ᴛɪᴅᴀᴋ ʙɪsᴀ ᴍᴇɴɢᴀᴍʙɪʟ ${isVideo ? 'ᴠɪᴅᴇᴏ' : 'ꜰᴏᴛᴏ'}.\n╰┈┈┈┈┈┈┈┈⬡`);
    clearPending(m.sender);
    const timer = setTimeout(() => {
        clearPending(m.sender);
    }, TIMEOUT_MS);
    pendingTovid.set(m.sender, {
        type: isVideo ? 'video' : 'image',
        mediaBuffer,
        chat: m.chat,
        timestamp: Date.now(),
        timer,
    });
    return m.reply(
        `╭┈┈⬡「 *${isVideo ? 'ᴠɪᴅᴇᴏ' : 'ꜰᴏᴛᴏ'} ᴅɪᴛᴇʀɪᴍᴀ* 」\n┃\n` +
        `┃ ✧ sᴇᴋᴀʀᴀɴɢ ᴋɪʀɪᴍ ᴀᴜᴅɪᴏ/ᴠᴏɪᴄᴇ ɴᴏᴛᴇ-ɴʏᴀ\n` +
        `┃ ✧ ʙᴏᴛ ᴀᴋᴀɴ ɢᴀʙᴜɴɢ ᴏᴛᴏᴍᴀᴛɪs${isVideo ? ' (ʟᴀɢᴜ ʟᴀᴍᴀ ᴅɪ ᴠɪᴅᴇᴏ ᴀᴋᴀɴ ᴅɪɢᴀɴᴛɪ)' : ' ᴊᴀᴅɪ ᴠɪᴅᴇᴏ'}\n` +
        `┃ ✧ ᴋᴇᴛɪᴋ *.ᴄᴀɴᴄᴇʟᴛᴏᴠɪᴅ* ᴜɴᴛᴜᴋ ʙᴀᴛᴀʟ\n┃\n` +
        `╰┈┈┈┈┈┈┈┈⬡\n\n꒰ © ${config.botName} ꒱`
    );
};
handler.onText = onText;
handler.help = ['tovid (reply/kirim foto/video)', 'canceltovid'];
handler.tags = ['tools'];
handler.command = /^(tovid|fotoaudio|imgaudio|canceltovid)$/i;
handler.limit = true;
export default handler;
