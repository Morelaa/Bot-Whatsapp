'use strict';
import axios from 'axios';
import config from '../../config.js';
import { buildFkontak } from '../../Library/utils.js';
function randomTime() {
    const h = Math.floor(Math.random() * 24).toString().padStart(2, '0');
    const m = Math.floor(Math.random() * 60).toString().padStart(2, '0');
    return `${h}:${m}`;
}
const handler = async (m, { conn, text }) => {
    const input = text?.trim();
    if (!input) {
        return m.reply(
            `╭┈┈⬡「 *ɪǫᴄ* 」\n┃\n┃ ✧ ᴍᴀꜱᴜᴋᴋᴀɴ ᴛᴇᴋꜱ ꜱᴇᴛᴇʟᴀʜ ᴄᴏᴍᴍᴀɴᴅ\n┃ ✧ ᴄᴏɴᴛᴏʜ: *.ɪǫᴄ ᴘᴜᴛʀᴀ*\n┃\n╰┈┈┈┈┈┈┈┈⬡`
        );
    }
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
    try {
        const res = await axios.get('https://api.deline.web.id/maker/iqc', {
            params: {
                text: input,
                chatTime: randomTime(),
                statusBarTime: randomTime(),
            },
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/120 Safari/537.36',
                Accept: 'image/*',
            },
            timeout: 30000,
        });
        const type = res.headers['content-type'] || '';
        if (!type.startsWith('image/')) throw new Error('Bukan gambar');
        const imgBuf = Buffer.from(res.data);
        const fk = await buildFkontak(conn, config);
        await conn.sendMessage(m.chat, {
            image: imgBuf,
        }, { quoted: fk });
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
    } catch (e) {
        console.error('[IQC ERROR]', e.message);
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        m.reply(
            `╭┈┈⬡「 *ɢᴀɢᴀʟ* 」\n┃\n┃ ✧ ʀᴇǫᴜᴇꜱᴛ ᴋᴀᴍᴜ ᴍᴜɴɢᴋɪɴ ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ\n┃ ✧ ᴇʀʀᴏʀ : ${e.message}\n┃\n╰┈┈┈┈┈┈┈┈⬡`
        );
    }
};
handler.command = /^iqc$/i;
handler.tags = ['tools'];
handler.help = ['iqc <teks>'];
handler.limit = true;
export default handler;
