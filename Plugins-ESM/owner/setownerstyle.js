'use strict';
import { getOwnerStyle, setOwnerStyle } from '../../System/ownerstyle.js';
const handler = async (m, { text }) => {
    const arg = (text || '').trim().toLowerCase();
    if (!arg) {
        const current = getOwnerStyle();
        await m.reply(`╭┈┈⬡「 *ᴏᴡɴᴇʀ ꜱᴛʏʟᴇ ꜱᴀᴀᴛ ɪɴɪ: *${current}* 」\n┃\n┃ ✧ ᴠ1 -> ᴄᴏɴᴛᴀᴄᴛ ᴄᴀʀᴅ (ᴠᴄᴀʀᴅ), ɢᴀʏᴀ ᴋᴀʀᴛᴜ ᴋᴏɴᴛᴀᴋ ꜱɪᴍᴘᴇʟ\n┃ ✧ ᴠ2 -> ɪɴᴛᴇʀᴀᴄᴛɪᴠᴇ ʙᴏᴏᴋɪɴɢ ᴄᴀʀᴅ (ᴛᴏᴍʙᴏʟ/ɴᴀᴛɪᴠᴇ ꜰʟᴏᴡ), ɢᴀʏᴀ ᴋᴀʀᴛᴜ ᴘʀᴏꜰɪʟᴇ\n┃\n┃ ✧ ᴘᴀᴋᴀɪ: .ꜱᴇᴛᴏᴡɴᴇʀꜱᴛʏʟᴇ ᴠ1 / .ꜱᴇᴛᴏᴡɴᴇʀꜱᴛʏʟᴇ ᴠ2\n╰┈┈┈┈┈┈┈┈⬡`);
        return;
    }
    if (arg !== 'v1' && arg !== 'v2') {
        await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ꜰᴏʀᴍᴀᴛ ꜱᴀʟᴀʜ. ᴘᴀᴋᴀɪ: .ꜱᴇᴛᴏᴡɴᴇʀꜱᴛʏʟᴇ ᴠ1 / .ꜱᴇᴛᴏᴡɴᴇʀꜱᴛʏʟᴇ ᴠ2\n╰┈┈┈┈┈┈┈┈⬡`);
        return;
    }
    const updated = setOwnerStyle(arg);
    await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴏᴡɴᴇʀ ꜱᴛʏʟᴇ ᴅɪɢᴀɴᴛɪ ᴋᴇ *${updated}*.\n╰┈┈┈┈┈┈┈┈⬡`);
};
handler.help = ['setownerstyle <v1/v2>'];
handler.tags = ['owner'];
handler.command = /^(setownerstyle|ownerstyle)$/i;
handler.owner = true;
handler.ignoreRateLimit = true;
handler.limit = true;
export default handler;
