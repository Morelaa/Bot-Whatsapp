'use strict';
import yts from 'yt-search';
import { renderYtsCard } from '../../Library/canvas-yts.js';
import config from '../../config.js';
function formatNum(n) {
    if (!n) return '0';
    const num = parseInt(String(n).replace(/\D/g, '')) || 0;
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + 'B';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return Math.floor(num / 1_000) + 'K';
    return num.toString();
}
const handler = async (m, { conn, text }) => {
    if (!text) { await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴄᴏɴᴛᴏʜ: .ʏᴛꜱ ʟᴀᴅʏ ɢᴀɢᴀ\n╰┈┈┈┈┈┈┈┈⬡`); return; }
    try {
        const res = await yts(text);
        const rawVideos = res.all.filter((v) => v.type === 'video');
        if (!rawVideos.length) { await m.reply('Tidak ditemukan hasil untuk: ' + text); return; }
        const videos = rawVideos.slice(0, 15).map((v) => ({
            title: v.title || 'Unknown Title',
            channel: v.author?.name || 'Unknown',
            duration: v.timestamp || '0:00',
            views: v.views || 0,
            ago: v.ago || '',
            url: v.url,
        }));
        const listVideos = videos.slice(0, 9);
        const rows = listVideos.flatMap((v, idx) => [
            {
                header: 'Video ' + (idx + 1),
                title: v.title.length > 40 ? v.title.slice(0, 37) + '...' : v.title,
                description: v.duration + '  •  ' + formatNum(v.views) + ' views  •  ' + (v.ago || ''),
                id: '.ytmp4 ' + v.url,
            },
            {
                header: 'Audio ' + (idx + 1),
                title: v.title.length > 40 ? v.title.slice(0, 37) + '...' : v.title,
                description: v.duration + '  •  ' + v.channel,
                id: '.ytmp3 ' + v.url,
            },
        ]);
        const top = videos[0];
        const views = Number(top.views).toLocaleString('id-ID');
        const q = text.charAt(0).toUpperCase() + text.slice(1);
        let imageBuffer = null;
        try {
            imageBuffer = await renderYtsCard({
                title: top.title,
                channel: top.channel,
                thumbnailUrl: rawVideos[0]?.thumbnail,
                duration: top.duration,
                views: top.views,
                uploadedAgo: top.ago,
            });
        } catch {}
        const caption =
`╭┈┈⬡「 *ʏᴏᴜᴛᴜʙᴇ ꜱᴇᴀʀᴄʜ* 」
┃
┃ ✧ ᴋᴀᴛᴀ ᴋᴜɴᴄɪ  » *${q}*
┃ ✧ ᴅɪᴛᴇᴍᴜᴋᴀɴ   » *${videos.length} ᴠɪᴅᴇᴏ*
┃
┣┈┈⬡「 *ᴠɪᴅᴇᴏ ᴛᴇʀᴀᴛᴀꜱ* 」
┃
┃ ✧ ᴊᴜᴅᴜʟ    » ${top.title.length > 35 ? top.title.slice(0, 33) + '..' : top.title}
┃ ✧ ᴄʜᴀɴɴᴇʟ  » ${top.channel}
┃ ✧ ᴅᴜʀᴀꜱɪ   » ${top.duration}
┃ ✧ ᴅɪᴛᴏɴᴛᴏɴ » ${views} ᴋᴀʟɪ
┃ ✧ ᴅɪᴜᴘʟᴏᴀᴅ » ${top.ago || '-'}
┃
╰┈┈┈┈┈┈┈┈⬡
_Ketuk tombol untuk pilih video atau audio_ `;
        const { Button } = await import('../../Library/MessageBuilder.js');
        const btn = new Button(conn);
        if (imageBuffer) btn.setImage(imageBuffer);
        btn.setBody(caption);
        btn.setFooter('© ' + config.botName);
        btn.addSelection('Pilih Video / Audio');
        btn.makeSection(
            'Hasil: ' + (text.length > 22 ? text.slice(0, 20) + '..' : text),
            'Top Results'
        );
        rows.forEach((r) => btn.makeRow(r.header, r.title, r.description, r.id));
        await btn.send(m.chat, { quoted: m.raw });
    } catch (err) {
        console.error('[YTS ERROR]', err);
        await m.reply('Error: ' + err.message);
    }
};
handler.help = ['yts <judul lagu/video>'];
handler.tags = ['downloader'];
handler.command = /^(yts|ytsearch)$/i;
handler.limit = true;
export default handler;
