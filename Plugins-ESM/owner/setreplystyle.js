'use strict';
import { getReplyStyle, setReplyStyle } from '../../System/replystyle.js';
const handler = async (m, { text }) => {
    const arg = (text || '').trim().toLowerCase();
    if (!arg) {
        const current = getReplyStyle();
        await m.reply(`╭┈┈⬡「 *ʀᴇᴘʟʏ ꜱᴛʏʟᴇ ꜱᴀᴀᴛ ɪɴɪ: *${current}* 」\n┃\n┃ ✧ ᴠ1 -> ᴇxᴛᴇɴᴅᴇᴅᴛᴇxᴛᴍᴇꜱꜱᴀɢᴇ (ʟɪɴᴋ ᴘʀᴇᴠɪᴇᴡ ᴄᴀʀᴅ, ɢᴀʏᴀ ʟᴀᴍᴀ)\n┃ ✧ ᴠ2 -> ɪɴᴛᴇʀᴀᴄᴛɪᴠᴇᴍᴇꜱꜱᴀɢᴇ (ᴠɪᴇᴡᴏɴᴄᴇᴍᴇꜱꜱᴀɢᴇ, ɢᴀʏᴀ ʙᴜᴛᴛᴏɴ/ᴄᴀʀᴅ ʙᴀʀᴜ)\n┃\n┃ ✧ ᴘᴀᴋᴀɪ: .ꜱᴇᴛʀᴇᴘʟʏꜱᴛʏʟᴇ ᴠ1 / .ꜱᴇᴛʀᴇᴘʟʏꜱᴛʏʟᴇ ᴠ2\n╰┈┈┈┈┈┈┈┈⬡`);
        return;
    }
    if (arg !== 'v1' && arg !== 'v2') {
        await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ꜰᴏʀᴍᴀᴛ ꜱᴀʟᴀʜ. ᴘᴀᴋᴀɪ: .ꜱᴇᴛʀᴇᴘʟʏꜱᴛʏʟᴇ ᴠ1 / .ꜱᴇᴛʀᴇᴘʟʏꜱᴛʏʟᴇ ᴠ2\n╰┈┈┈┈┈┈┈┈⬡`);
        return;
    }
    const updated = setReplyStyle(arg);
    await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ʀᴇᴘʟʏ ꜱᴛʏʟᴇ ᴅɪɢᴀɴᴛɪ ᴋᴇ *${updated}*.\n╰┈┈┈┈┈┈┈┈⬡`);
};
handler.help = ['setreplystyle <v1/v2>'];
handler.tags = ['owner'];
handler.command = /^(setreplystyle|setreply)$/i;
handler.owner = true;
handler.ignoreRateLimit = true;
handler.limit = true;
export default handler;
