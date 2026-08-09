'use strict';
import pluginManager from '../_pluginmanager.js';
const handler = async (m, { text }) => {
    const name = (text || '').trim();
    if (!name) {
        await m.reply(
            `╭┈┈⬡「 *ᴅᴇʟ ᴘʟᴜɢɪɴ* 」\n┃\n` +
            `┃ ✧ ꜰᴏʀᴍᴀᴛ : *.ᴅᴇʟᴘʟᴜɢɪɴ <ɴᴀᴍᴀ>*\n` +
            `┃ ✧ ᴄᴏɴᴛᴏʜ : *.ᴅᴇʟᴘʟᴜɢɪɴ ʙᴀᴄᴋᴜᴘ*\n` +
            `┃ ✧ ᴄᴏɴᴛᴏʜ : *.ᴅᴇʟᴘʟᴜɢɪɴ ᴏᴡɴᴇʀ/ʙᴀᴄᴋᴜᴘ*\n┃\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        );
        return;
    }
    const result = pluginManager.deletePlugin(name);
    if (!result.success) {
        await m.reply(`╭┈┈⬡「 *ᴅᴇʟ ᴘʟᴜɢɪɴ* 」\n┃\n┃ ✧ ${result.error}\n┃\n╰┈┈┈┈┈┈┈┈⬡`);
        return;
    }
    await m.reply(
        `╭┈┈⬡「 *ᴅᴇʟ ᴘʟᴜɢɪɴ* 」\n┃\n` +
        `┃ ✧ ʙᴇʀʜᴀꜱɪʟ ᴅɪʜᴀᴘᴜꜱ & ʟᴀɴɢꜱᴜɴɢ ɴᴏɴᴀᴋᴛɪꜰ.\n┃\n` +
        `┃ ✧ ${result.rel}.ᴊꜱ\n┃\n` +
        `╰┈┈┈┈┈┈┈┈⬡`
    );
};
handler.help = ['delplugin <nama>'];
handler.tags = ['owner'];
handler.command = /^(delplugin|deleteplugin)$/i;
handler.mainOwner = true;
handler.ignoreRateLimit = true;
handler.limit = true;
export default handler;
