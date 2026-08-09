'use strict';
import config from '../../config.js';
import { resolveTarget, normNum } from '../../Library/resolve.js';
const FOOTER = `© ${config.copyrightName || config.botName || 'Bot'}`;
function withTimeout(p, ms) {
    return Promise.race([
        p,
        new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout')), ms)),
    ]);
}
const handler = async (m, { conn, args }) => {
    const resolved = resolveTarget(m, args, { senderJid: m.senderPn || m.sender, fallbackSelf: true, minDigits: 8 });
    const targetJid = resolved.jid;
    if (!targetJid) {
        return m.reply(`╭┈┈⬡「 *ʀᴇᴘʟʏ/ᴍᴇɴᴛɪᴏɴ ᴏʀᴀɴɢɴʏᴀ, ᴀᴛᴀᴜ ᴋᴇᴛɪᴋ ɴᴏᴍᴏʀɴʏᴀ.* 」\n┃\n┃ ✧ ᴄᴏɴᴛᴏʜ: *.ɢᴇᴛᴘᴘ 628xxx*\n╰┈┈┈┈┈┈┈┈⬡`);
    }
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
    try {
        let url = null;
        try {
            url = await withTimeout(conn.profilePictureUrl(targetJid, 'image'), 10_000);
        } catch {
            url = await withTimeout(conn.profilePictureUrl(targetJid, 'preview'), 10_000).catch(() => null);
        }
        if (!url) throw new Error('No URL');
        const num = normNum(targetJid);
        await conn.sendMessage(m.chat, {
            image: { url },
            caption: `╭┈┈⬡「 🖼️ *ᴘʀᴏꜰɪʟᴇ ᴘɪᴄᴛᴜʀᴇ* 」\n┃ ✧ *ɴᴏᴍᴏʀ:* +${num}\n╰┈┈┈┈┈┈┈┈⬡\n\n${FOOTER}`,
        }, { quoted: m.raw });
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
    } catch {
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ꜰᴏᴛᴏ ᴘʀᴏꜰɪʟ ᴛɪᴅᴀᴋ ʙɪꜱᴀ ᴅɪᴀᴋꜱᴇꜱ (ᴘʀɪᴠᴀᴛᴇ ᴀᴛᴀᴜ ᴛɪᴅᴀᴋ ᴀᴅᴀ)\n╰┈┈┈┈┈┈┈┈⬡`);
    }
};
handler.command = /^(getpp|pp|profpic)$/i;
handler.tags = ['tools'];
handler.help = ['getpp — reply/mention/ketik nomor'];
handler.limit = true;
export default handler;
