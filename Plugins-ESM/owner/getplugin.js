'use strict';
import path from 'path';
import pluginManager from '../_pluginmanager.js';
import { AIRich } from '../../Library/MessageBuilder.js';
const handler = async (m, { conn, text }) => {
    const name = (text || '').trim();
    if (!name) {
        await m.reply(
            `╭┈┈⬡「 *ɢᴇᴛ ᴘʟᴜɢɪɴ* 」\n┃\n` +
            `┃ ✧ ꜰᴏʀᴍᴀᴛ : *.ɢᴇᴛᴘʟᴜɢɪɴ <ɴᴀᴍᴀ>*\n` +
            `┃ ✧ ᴄᴏɴᴛᴏʜ : *.ɢᴇᴛᴘʟᴜɢɪɴ ʙᴀᴄᴋᴜᴘ*\n` +
            `┃ ✧ ᴄᴏɴᴛᴏʜ : *.ɢᴇᴛᴘʟᴜɢɪɴ ᴏᴡɴᴇʀ/ʙᴀᴄᴋᴜᴘ*\n┃\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        );
        return;
    }
    const result = pluginManager.getPluginSource(name);
    if (!result.success) {
        await m.reply(`╭┈┈⬡「 *ɢᴇᴛ ᴘʟᴜɢɪɴ* 」\n┃\n┃ ✧ ${result.error}\n┃\n╰┈┈┈┈┈┈┈┈⬡`);
        return;
    }
    const { rel, code } = result;
    try {
        const rich = new AIRich(conn)
            .addText(` *${rel}.js*`)
            .addCode('javascript', code);
        await rich.send(m.chat, { quoted: m.raw });
    }
    catch (err) {
        await conn.sendMessage(
            m.chat,
            {
                document: Buffer.from(code),
                mimetype: 'text/javascript',
                fileName: `${path.basename(rel)}.js`,
                caption:
                    ` *${rel}.js*\n\n` +
                    ` Gagal render syntax highlight, dikirim sebagai file.\n` +
                    `${err?.message || err}`,
            },
            { quoted: m.raw }
        );
    }
};
handler.help = ['getplugin <nama>'];
handler.tags = ['owner'];
handler.command = /^(getplugin|catplugin)$/i;
handler.mainOwner = true;
handler.ignoreRateLimit = true;
handler.limit = true;
export default handler;
