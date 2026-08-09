'use strict';
import { isPrivateModeOn, setPrivateMode } from '../../System/privatemode.js';
const handler = async (m, { text }) => {
    const arg = (text || '').trim().toLowerCase();
    if (!arg) {
        const status = isPrivateModeOn() ? 'ON' : 'OFF';
        await m.reply(`╭┈┈⬡「 *ᴘʀɪᴠᴀᴛᴇ ᴍᴏᴅᴇ ꜱᴀᴀᴛ ɪɴɪ: *${status}* 」\n┃\n┃ ✧ ᴘᴀᴋᴀɪ: .ᴘʀɪᴠᴀᴛᴇᴍᴏᴅᴇ ᴏɴ / .ᴘʀɪᴠᴀᴛᴇᴍᴏᴅᴇ ᴏꜰꜰ\n╰┈┈┈┈┈┈┈┈⬡`);
        return;
    }
    if (['on', '1', 'true', 'aktif'].includes(arg)) {
        setPrivateMode(true);
        await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴘʀɪᴠᴀᴛᴇ ᴍᴏᴅᴇ ᴅɪᴀᴋᴛɪꜰᴋᴀɴ. ᴄᴜᴍᴀ ᴍᴀɪɴ ᴏᴡɴᴇʀ & ᴏᴡɴᴇʀ ʏᴀɴɢ ʙɪꜱᴀ ᴄʜᴀᴛ ᴋᴇ ʙᴏᴛ ʟᴇᴡᴀᴛ ᴅᴍ ꜱᴇᴋᴀʀᴀɴɢ.\n╰┈┈┈┈┈┈┈┈⬡`);
        return;
    }
    if (['off', '0', 'false', 'nonaktif'].includes(arg)) {
        setPrivateMode(false);
        await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴘʀɪᴠᴀᴛᴇ ᴍᴏᴅᴇ ᴅɪᴍᴀᴛɪᴋᴀɴ. ꜱᴇᴍᴜᴀ ᴏʀᴀɴɢ ʙɪꜱᴀ ᴄʜᴀᴛ ᴋᴇ ʙᴏᴛ ʟᴇᴡᴀᴛ ᴅᴍ ʟᴀɢɪ.\n╰┈┈┈┈┈┈┈┈⬡`);
        return;
    }
    await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ꜰᴏʀᴍᴀᴛ ꜱᴀʟᴀʜ. ᴘᴀᴋᴀɪ: .ᴘʀɪᴠᴀᴛᴇᴍᴏᴅᴇ ᴏɴ / .ᴘʀɪᴠᴀᴛᴇᴍᴏᴅᴇ ᴏꜰꜰ\n╰┈┈┈┈┈┈┈┈⬡`);
};
handler.help = ['privatemode <on/off>'];
handler.tags = ['owner'];
handler.command = /^(privatemode|pmode)$/i;
handler.owner = true;
handler.ignoreRateLimit = true;
handler.limit = true;
export default handler;
