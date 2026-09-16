//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';
import { PassThrough, Readable } from 'stream';
import { Carousel, Button } from '../../Library/MessageBuilder.js';
import { buildFkontak, sleep } from '../../Library/utils.js';
import config from '../../config.js';
const TT_URL_REGEX = /https?:\/\/(?:www\.|v[tm]\.)?tiktok\.com\/[^\s]+/i;
const API_BASE = 'https://api.legionteknologi.my.id/download';
function numFmt(n) {
    const num = parseInt(n) || 0;
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    return String(num);
}
function progressBar(progress) {
    progress = Math.max(0, Math.min(100, Math.round(progress)));
    const totalBars = 10;
    const filled = Math.round((progress / 100) * totalBars);
    return '█'.repeat(filled) + '░'.repeat(totalBars - filled);
}
async function updateProgress(conn, chat, statusKey, progress, statusText) {
    try {
        const editKey = {
            remoteJid: chat,
            id: statusKey.id,
            fromMe: true,
            ...(statusKey.participant ? { participant: statusKey.participant } : {}),
        };
        await conn.relayMessage(
            chat,
            {
                protocolMessage: {
                    key: editKey,
                    type: 14,
                    editedMessage: {
                        conversation: `╭┈┈⬡「 *ᴛɪᴋᴛᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ* 」\n┃ ✧ ${statusText}\n┃ ✧ [${progressBar(progress)}] ${progress}%\n╰┈┈┈┈┈┈┈┈⬡`,
                    },
                },
            },
            {}
        );
    } catch (err) {
        console.error('[TTDL] gagal update progress:', err.message);
    }
}
export async function fetchTiktok(url) {
    let res = await axios.get(`${API_BASE}/tiktok?url=${encodeURIComponent(url)}`, { timeout: 30000 }).catch(() => null);
    let data = res?.data;
    if (!data || !data.status) {
        res = await axios.get(`${API_BASE}/tiktokv2?url=${encodeURIComponent(url)}`, { timeout: 30000 }).catch(() => null);
        data = res?.data;
    }
    if (!data || !data.status) {
        throw new Error('Gagal mengambil media dari link TikTok tersebut.');
    }
    return data;
}
export async function downloadBuffer(fileUrl) {
    const res = await axios.get(fileUrl, {
        responseType: 'arraybuffer',
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 90000,
        maxRedirects: 10,
    });
    return Buffer.from(res.data);
}
function toOpusPTT(mp3Buffer) {
    return new Promise((resolve, reject) => {
        const input = new Readable({ read() {} });
        input.push(mp3Buffer);
        input.push(null);
        const output = new PassThrough();
        const chunks = [];
        output.on('data', (chunk) => chunks.push(chunk));
        output.on('end', () => resolve(Buffer.concat(chunks)));
        output.on('error', reject);
        ffmpeg(input)
            .audioCodec('libopus')
            .audioChannels(1)
            .audioFrequency(48000)
            .format('ogg')
            .on('error', (err) => reject(new Error(`ffmpeg error: ${err.message}`)))
            .pipe(output, { end: true });
    });
}
async function sendAudio(conn, chat, m, audioUrl, contextInfo) {
    if (!audioUrl) return;
    try {
        const mp3Buffer = await downloadBuffer(audioUrl);
        try {
            const opusBuffer = await toOpusPTT(mp3Buffer);
            await conn.sendMessage(
                chat,
                { audio: opusBuffer, mimetype: 'audio/ogg; codecs=opus', ptt: true, contextInfo },
                { quoted: m.raw }
            );
        } catch (convErr) {
            console.error('[TTDL] gagal convert ke opus, fallback mp3:', convErr.message);
            await conn.sendMessage(chat, { audio: mp3Buffer, mimetype: 'audio/mpeg', ptt: false, contextInfo }, { quoted: m.raw });
        }
    } catch (err) {
        console.error('[TTDL] gagal kirim audio:', err.message);
    }
}
async function sendErrorCard(conn, m, message) {
    try {
        const err = new Button(conn)
            .setBody(`╭┈┈⬡「 *ᴛɪᴋᴛᴏᴋ ɢᴀɢᴀʟ* 」\n┃ ✧ ${String(message).slice(0, 150)}\n╰┈┈┈┈┈┈┈┈⬡`)
            .setFooter(`© ${config.botName}`)
            .addCopy('📋 Salin Pesan Error', String(message));
        await err.send(m.chat);
    } catch {
        await m.reply(`╭┈┈⬡「 *ᴛɪᴋᴛᴏᴋ ɢᴀɢᴀʟ* 」\n┃ ✧ ${String(message).slice(0, 150)}\n╰┈┈┈┈┈┈┈┈⬡`);
    }
}
const handler = async (m, { conn, args, usedPrefix, command }) => {
    let url = args[0]?.trim();
    if (!url && m.quoted?.text) {
        const match = m.quoted.text.match(TT_URL_REGEX);
        if (match) url = match[0];
    }
    if (!url || !TT_URL_REGEX.test(url)) {
        const contoh = new Button(conn)
            .setBody(
                `╭┈┈⬡「 *ᴛɪᴋᴛᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ* 」\n┃ ✧ ᴍᴀꜱᴜᴋᴋᴀɴ ᴜʀʟ ᴠɪᴅᴇᴏ/ꜱʟɪᴅᴇ ᴛɪᴋᴛᴏᴋ ʏᴀɴɢ ᴠᴀʟɪᴅ!\n┃ ✧ ᴄᴏɴᴛᴏʜ: ${usedPrefix}${command} https://vt.tiktok.com/xxxx/\n╰┈┈┈┈┈┈┈┈⬡`
            )
            .setFooter(`© ${config.botName}`)
            .addCopy('📋 Salin Contoh Format', `${usedPrefix}${command} https://vt.tiktok.com/xxxx/`);
        return contoh.send(m.chat);
    }
    if (conn.reactSafe) await conn.reactSafe(m.chat, m.key, '⏳');
    let statusMsg;
    try {
        statusMsg = await m.reply(`╭┈┈⬡「 *ᴛɪᴋᴛᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ* 」\n┃ ✧ ᴍᴇᴍᴘʀᴏꜱᴇꜱ ᴜʀʟ ᴛɪᴋᴛᴏᴋ...\n┃ ✧ [${progressBar(0)}] 0%\n╰┈┈┈┈┈┈┈┈⬡`);
        await updateProgress(conn, m.chat, statusMsg.key, 30, 'ᴍᴇɴɢʜᴜʙᴜɴɢɪ ᴀᴘɪ ᴛɪᴋᴛᴏᴋ...');
        await sleep(500);
        const data = await fetchTiktok(url);
        await updateProgress(conn, m.chat, statusMsg.key, 100, 'ᴍᴇᴅɪᴀ ʙᴇʀʜᴀꜱɪʟ ᴅɪᴅᴀᴘᴀᴛᴋᴀɴ!');
        await sleep(400);
        if (conn.reactSafe) await conn.reactSafe(m.chat, m.key, '📥');
        const fkontak = await buildFkontak(conn, config);
        const fkontakContext = {
            quotedMessage: fkontak.message,
            participant: fkontak.key.participant,
            stanzaId: fkontak.key.id,
            remoteJid: fkontak.key.remoteJid,
        };
        try {
            await conn.sendMessage(m.chat, { delete: statusMsg.key });
        } catch {}
        const author = data.author?.nickname || data.author?.fullname || '-';
        const authorHandle = data.author?.fullname ? `@${data.author.fullname}` : '';
        const audioUrl = data.music_info?.url || data.audio;
        const photos = Array.isArray(data.data) ? data.data.filter((v) => v.type === 'photo') : [];
        const fotoArr = Array.isArray(data.foto) ? data.foto : [];
        if (photos.length || fotoArr.length) {
            const imgUrls = photos.length ? photos.map((p) => p.url) : fotoArr;
            const caption =
                `╭┈┈⬡「 *ᴛɪᴋᴛᴏᴋ ꜱʟɪᴅᴇ* 」\n` +
                `┃ ✧ ᴀᴜᴛʜᴏʀ: ${author} ${authorHandle}\n` +
                `┃ ✧ ᴛᴏᴛᴀʟ: ${imgUrls.length} ꜰᴏᴛᴏ\n` +
                `╰┈┈┈┈┈┈┈┈⬡\n\n_© ${config.botName}_`;
            const cards = [];
            for (let i = 0; i < imgUrls.length; i++) {
                try {
                    const cardBuilder = new Button(conn).setImage(imgUrls[i]).addUrl('🔗 Lihat Gambar Asli', imgUrls[i]);
                    if (i === 0) cardBuilder.setTitle(author).setSubtitle(authorHandle);
                    cards.push(await cardBuilder.toCard());
                } catch (e) {
                    console.error('[TTDL] gagal siapkan slide ke-', i, e.message);
                }
            }
            if (cards.length) {
                try {
                    const carousel = new Carousel(conn).setBody(caption).setContextInfo(fkontakContext).addCard(cards);
                    await carousel.send(m.chat);
                } catch (e) {
                    console.error('[TTDL] gagal kirim carousel, fallback gambar biasa:', e.message);
                    for (let i = 0; i < imgUrls.length; i++) {
                        try {
                            const buf = await downloadBuffer(imgUrls[i]);
                            await conn.sendMessage(m.chat, { image: buf, caption: i === 0 ? caption : undefined, contextInfo: fkontakContext });
                        } catch {}
                    }
                }
            }
            await sendAudio(conn, m.chat, m, audioUrl, fkontakContext);
            if (conn.reactSafe) await conn.reactSafe(m.chat, m.key, '✅');
            return;
        }
        const videoUrl =
            (Array.isArray(data.data) && (data.data.find((v) => v.type === 'nowatermark_hd')?.url || data.data.find((v) => v.type === 'nowatermark')?.url)) ||
            data.mp4_hd ||
            data.mp4;
        if (!videoUrl) throw new Error('Media tidak ditemukan.');
        const caption =
            `╭┈┈⬡「 *ᴛɪᴋᴛᴏᴋ ʀᴇꜱᴜʟᴛ (ʜᴅ)* 」\n` +
            `┃ ✧ ᴊᴜᴅᴜʟ: ${data.title || '-'}\n` +
            `┃ ✧ ᴀᴜᴛʜᴏʀ: ${author} ${authorHandle}\n` +
            `┃ ✧ ᴅᴜʀᴀꜱɪ: ${data.duration || '-'}\n` +
            `┃ ✧ ᴠɪᴇᴡꜱ: ${numFmt(data.stats?.views)} | ʟɪᴋᴇꜱ: ${numFmt(data.stats?.likes)}\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n_© ${config.botName}_`;
        await conn.sendMessage(m.chat, { video: { url: videoUrl }, caption, contextInfo: fkontakContext }, { quoted: m.raw });
        await sendAudio(conn, m.chat, m, audioUrl, fkontakContext);
        if (conn.reactSafe) await conn.reactSafe(m.chat, m.key, '✅');
    } catch (error) {
        console.error('[TTDL ERROR]', error);
        if (statusMsg?.key) {
            try {
                await conn.sendMessage(m.chat, { delete: statusMsg.key });
            } catch {}
        }
        if (conn.reactSafe) await conn.reactSafe(m.chat, m.key, '❌');
        await sendErrorCard(conn, m, error.message || 'Terjadi kesalahan.');
    }
};
handler.help = ['ttdl <link tiktok>'];
handler.tags = ['downloader'];
handler.command = /^(ttdl|ttnowm|tthd)$/i;
handler.limit = true;
export default handler;
