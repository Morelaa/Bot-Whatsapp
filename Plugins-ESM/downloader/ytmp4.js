//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import sharp from 'sharp';
import * as baileys from '@itsliaaa/baileys';
import { getYoutubeResources, pickVideo } from '../../Library/vidssave.js';
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
const handler = async (m, { conn, args }) => {
    const url = args[0];
    const wantedQuality = args[1] ? args[1].toUpperCase().replace(/P$/, '') + 'P' : null;
    if (!url || !/(youtube\.com|youtu\.be)/.test(url)) {
        await m.reply(`╭┈┈⬡「 *ᴋᴀꜱɪʜ ʟɪɴᴋ ʏᴏᴜᴛᴜʙᴇ ʏᴀɴɢ ᴠᴀʟɪᴅ.* 」\n┃ ✧ ᴄᴏɴᴛᴏʜ: .ʏᴛᴍᴘ4 ʜᴛᴛᴘꜱ://ʏᴏᴜᴛᴜ.ʙᴇ/xxxxx [720]\n╰┈┈┈┈┈┈┈┈⬡`);
        return;
    }
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
    let videoOut;
    try {
        const { title, thumbnail, resources } = await getYoutubeResources(url);
        const chosen = pickVideo(resources, wantedQuality);
        if (!chosen) throw new Error('Tidak ada resource video yang tersedia dari sumber.');
        const tempDir = path.join(process.cwd(), 'media', 'temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
        const stamp = Date.now();
        videoOut = path.join(tempDir, `${stamp}.mp4`);
        const videoRes = await axios.get(chosen.download_url, { responseType: 'arraybuffer', timeout: 120000 });
        fs.writeFileSync(videoOut, Buffer.from(videoRes.data));
        const sizeMB = fs.statSync(videoOut).size / 1024 / 1024;
        const orderQuote = await buildOrderQuote({
            thumbnailUrl: thumbnail,
            title,
            orderTitle: `🎬 ${chosen.quality} ${chosen.format} • ${sizeMB.toFixed(2)} MB`,
        });
        const videoBuf = fs.readFileSync(videoOut);
        const media = await baileys.prepareWAMessageMedia(
            { video: videoBuf },
            { upload: conn.waUploadToServer }
        );
        await conn.sendMessage(m.chat, { react: { text: '', key: m.key } });
        await conn.relayMessage(
            m.chat,
            {
                videoMessage: {
                    ...media.videoMessage,
                    caption: ` *${title}*\n ${chosen.quality} ${chosen.format}\n ${sizeMB.toFixed(2)} MB`, 
                    contextInfo: orderQuote,
                },
            },
            { messageId: conn.generateMessageTag() }
        );
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
    }
    catch (err) {
        console.error('[YTMP4 ERROR]', err);
        await conn.sendMessage(m.chat, { react: { text: '', key: m.key } }).catch(() => {});
        await m.reply(' Gagal download video: ' + err.message);
    }
    finally {
        try { if (videoOut && fs.existsSync(videoOut)) fs.unlinkSync(videoOut); } catch {}
    }
};
handler.help = ['ytmp4 <link YouTube> [kualitas: 144/240/360/480/720/1080]'];
handler.tags = ['downloader'];
handler.command = /^(ytmp4|ytv|mp4)$/i;
handler.limit = true;
export default handler;
