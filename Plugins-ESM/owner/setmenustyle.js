'use strict';
import { getMenuStyle, setMenuStyle } from '../../System/menustyle.js';
const handler = async (m, { text }) => {
    const arg = (text || '').trim().toLowerCase();
    if (!arg) {
        const current = getMenuStyle();
        await m.reply(`╭┈┈⬡「 *ᴍᴇɴᴜ ꜱᴛʏʟᴇ ꜱᴀᴀᴛ ɪɴɪ: *${current}* 」\n┃\n┃ ✧ ᴠ1 -> ᴍᴇɴᴜ ɪɴᴛᴇʀᴀᴋᴛɪꜰ ꜱɪɴɢʟᴇ_ꜱᴇʟᴇᴄᴛ (ʟɪꜱᴛ ᴋᴀᴛᴇɢᴏʀɪ ᴅɪ ʙᴏᴅʏ)\n┃ ✧ ᴠ2 -> ᴍᴇɴᴜ ʙᴜᴛᴛᴏɴ ᴠ2 (ᴘᴘ ᴘᴇɴɢɪʀɪᴍ/ʙᴏᴛ + ɪɴꜰᴏ ᴅɪ ꜰᴏᴏᴛᴇʀ)\n┃\n┃ ✧ ᴘᴀᴋᴀɪ: .ꜱᴇᴛᴍᴇɴᴜꜱᴛʏʟᴇ ᴠ1 / .ꜱᴇᴛᴍᴇɴᴜꜱᴛʏʟᴇ ᴠ2\n╰┈┈┈┈┈┈┈┈⬡`);
        return;
    }
    if (arg !== 'v1' && arg !== 'v2') {
        await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ꜰᴏʀᴍᴀᴛ ꜱᴀʟᴀʜ. ᴘᴀᴋᴀɪ: .ꜱᴇᴛᴍᴇɴᴜꜱᴛʏʟᴇ ᴠ1 / .ꜱᴇᴛᴍᴇɴᴜꜱᴛʏʟᴇ ᴠ2\n╰┈┈┈┈┈┈┈┈⬡`);
        return;
    }
    const updated = setMenuStyle(arg);
    await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴍᴇɴᴜ ꜱᴛʏʟᴇ ᴅɪɢᴀɴᴛɪ ᴋᴇ *${updated}*.\n╰┈┈┈┈┈┈┈┈⬡`);
};
handler.help = ['setmenustyle <v1/v2>'];
handler.tags = ['owner'];
handler.command = /^(setmenustyle|menustyle)$/i;
handler.owner = true;
handler.ignoreRateLimit = true;
handler.limit = true;
export default handler;
