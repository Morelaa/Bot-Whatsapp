'use strict';
import axios from 'axios';
const TT_URL_REGEX =
    /https?:\/\/(?:www\.|m\.|vm\.|vt\.|v\.)?tiktok\.com(?:\/[^\s]*)?|https?:\/\/(?:vm|vt)\.tiktok\.com\/[^\s]*/i;
const TIKWM_BASE = 'https://www.tikwm.com';
function absUrl(u) {
    if (!u) return u;
    return u.startsWith('http') ? u : `${TIKWM_BASE}${u}`;
}
function numFmt(n) {
    const num = parseInt(n) || 0;
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    return String(num);
}
async function fetchTikwm(url) {
    const res = await axios.post(`${TIKWM_BASE}/api/`, new URLSearchParams({
        url, count: '12', cursor: '0', web: '1', hd: '1',
    }), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest',
            Referer: `${TIKWM_BASE}/`,
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        },
        timeout: 30000,
    });
    const d = res.data;
    if (!d || d.code !== 0 || !d.data) throw new Error(d?.msg || 'Tikwm gagal proses link ini.');
    return d.data;
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
const handler = async (m, { conn, args }) => {
    const url = args[0];
    if (!url || !TT_URL_REGEX.test(url)) {
        await m.reply(`╭┈┈⬡「 *ᴋᴀꜱɪʜ ʟɪɴᴋ ᴛɪᴋᴛᴏᴋ ʏᴀɴɢ ᴠᴀʟɪᴅ.* 」\n┃ ✧ ᴄᴏɴᴛᴏʜ:\n┃ ✧ .ᴛᴛᴠ2 ʜᴛᴛᴘꜱ://ᴠᴛ.ᴛɪᴋᴛᴏᴋ.ᴄᴏᴍ/xxx\n┃ ✧ .ᴛᴛᴠ2 ʜᴛᴛᴘꜱ://ᴠᴍ.ᴛɪᴋᴛᴏᴋ.ᴄᴏᴍ/xxx\n┃ ✧ .ᴛᴛᴠ2 ʜᴛᴛᴘꜱ://ᴡᴡᴡ.ᴛɪᴋᴛᴏᴋ.ᴄᴏᴍ/@ᴜꜱᴇʀ/ᴠɪᴅᴇᴏ/xxx\n╰┈┈┈┈┈┈┈┈⬡`);
        return;
    }
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
    try {
        const data = await fetchTikwm(url);
        await conn.sendMessage(m.chat, { react: { text: '', key: m.key } });
        const authorName = data.author?.nickname || data.author?.unique_id || 'unknown';
        const caption =
            ` *TikTok*\n` +
            `${authorName}${data.author?.unique_id ? ` (@${data.author.unique_id})` : ''}\n` +
            `${(data.title || '').slice(0, 80)}${(data.title || '').length > 80 ? '...' : ''}\n` +
            ` ${numFmt(data.play_count)}   ${numFmt(data.comment_count)}   ${numFmt(data.share_count)}`;
        if (Array.isArray(data.images) && data.images.length) {
            for (let i = 0; i < data.images.length; i++) {
                const buf = await downloadBuffer(absUrl(data.images[i]));
                await conn.sendMessage(m.chat, { image: buf, caption: i === 0 ? caption : undefined }, { quoted: m.raw });
            }
            const audioUrl = data.music_info?.play || absUrl(data.music);
            if (audioUrl) {
                try {
                    const audioBuf = await downloadBuffer(audioUrl);
                    await conn.sendMessage(m.chat, { audio: audioBuf, mimetype: 'audio/mpeg', ptt: false }, { quoted: m.raw });
                }
                catch (e) {
                    console.error('[TTV2] gagal kirim audio slide:', e.message);
                }
            }
        }
        else {
            const videoUrl = absUrl(data.hdplay || data.play);
            const videoBuf = await downloadBuffer(videoUrl);
            const sizeMB = (videoBuf.length / 1024 / 1024).toFixed(2);
            await conn.sendMessage(m.chat, { video: videoBuf, caption: `${caption}\n ${sizeMB} MB` }, { quoted: m.raw });
        }
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
    }
    catch (err) {
        console.error('[TTV2]', err.message);
        await conn.sendMessage(m.chat, { react: { text: '', key: m.key } }).catch(() => { });
        await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ɢᴀɢᴀʟ ᴅᴏᴡɴʟᴏᴀᴅ: ${err.message}\n╰┈┈┈┈┈┈┈┈⬡`);
    }
};
handler.help = ['ttv2 <link tiktok>'];
handler.tags = ['downloader'];
handler.command = /^(ttv2|tt2)$/i;
handler.limit = true;
export default handler;