'use strict';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { getYoutubeResources, pickVideo } from '../../Library/vidssave.js';

const handler = async (m, { conn, args }) => {
    const url = args[0];
    const wantedQuality = args[1] ? args[1].toUpperCase().replace(/P$/, '') + 'P' : null;
    if (!url || !/(youtube\.com|youtu\.be)/.test(url)) {
        await m.reply(`╭┈┈⬡「 *ᴋᴀꜱɪʜ ʟɪɴᴋ ʏᴏᴜᴛᴜʙᴇ ʏᴀɴɢ ᴠᴀʟɪᴅ.* 」\n┃ ✧ ᴄᴏɴᴛᴏʜ: .ʏᴛᴍᴘ4 ʜᴛᴛᴘꜱ://ʏᴏᴜᴛᴜ.ʙᴇ/xxxxx [720]\n╰┈┈┈┈┈┈┈┈⬡`);
        return;
    }
    await conn.sendMessage(m.chat, { react: { text: '', key: m.key } });
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
        await conn.sendMessage(m.chat, { react: { text: '', key: m.key } });
        await conn.sendMessage(m.chat, {
            video: fs.readFileSync(videoOut),
            caption: ` *${title}*\n ${chosen.quality} ${chosen.format}\n ${sizeMB.toFixed(2)} MB`,
            thumbnail: thumbnail ? { url: thumbnail } : undefined,
        }, { quoted: m.raw });
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
