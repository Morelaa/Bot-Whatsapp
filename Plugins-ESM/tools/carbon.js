'use strict';
import axios from 'axios';
const CARBON_URL = 'https://carbonara.solopov.dev/api/cook';
const MAX_LEN = 5000;
function computeFontSize(length) {
    if (length > 2000) return '10px';
    if (length > 1500) return '12px';
    if (length > 1000) return '14px';
    if (length > 600) return '16px';
    if (length > 300) return '18px';
    return '20px';
}
const handler = async (m, { conn, args, usedPrefix, command }) => {
    const inlineText = args.join(' ').trim();
    let code = inlineText || m.quoted?.text || '';
    if (!code.trim()) {
        await m.reply(`╭┈┈⬡「 *ᴄᴀʀʙᴏɴ* 」\n┃ ✧ ʀᴇᴘʟʏ ᴘᴇꜱᴀɴ/ᴋᴏᴅᴇ ʟᴀʟᴜ ᴋᴇᴛɪᴋ:\n┃ ✧ *${usedPrefix}${command}*\n┃\n┃ ✧ ᴀᴛᴀᴜ ʟᴀɴɢꜱᴜɴɢ:\n┃ ✧ *${usedPrefix}${command} <ᴋᴏᴅᴇ>*\n╰┈┈┈┈┈┈┈┈⬡`);
        return;
    }
    let truncatedNotice = '';
    if (code.length > MAX_LEN) {
        code = code.slice(0, MAX_LEN);
        truncatedNotice = `\n\n⚠️ Teks dipotong ke ${MAX_LEN} karakter biar gambarnya tetap bisa dibuat & dikirim.`;
    }
    const fontSize = computeFontSize(code.length);
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
    try {
        const res = await axios.post(
            CARBON_URL,
            { code, backgroundColor: '#0D1117', fontSize },
            { responseType: 'arraybuffer', timeout: 60000, maxContentLength: Infinity, maxBodyLength: Infinity }
        );
        await conn.sendMessage(m.chat, { image: Buffer.from(res.data), caption: `🖼️ Carbon${truncatedNotice}` }, { quoted: m.raw });
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
    }
    catch (err) {
        console.error('[CARBON]', err.message);
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => { });
        await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ɢᴀɢᴀʟ ʙɪᴋɪɴ ɢᴀᴍʙᴀʀ ᴄᴀʀʙᴏɴ: ${err.message}${truncatedNotice}\n╰┈┈┈┈┈┈┈┈⬡`);
    }
};
handler.help = ['carbon (reply pesan/kode)', 'carbon <kode langsung>'];
handler.tags = ['tools'];
handler.command = /^(carbon|snip|codesnip)$/i;
handler.limit = true;
export default handler;
