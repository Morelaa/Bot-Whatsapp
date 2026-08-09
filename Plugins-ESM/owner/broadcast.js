'use strict';
import db from '../../Database/sqlite.js';
import { sleep } from '../../Library/utils.js';
const handler = async (m, { conn, text }) => {
    if (!text) {
        await m.reply(`╭┈┈⬡「 *ɪꜱɪ ᴘᴇꜱᴀɴ ʙʀᴏᴀᴅᴄᴀꜱᴛ-ɴʏᴀ ᴅᴏɴɢ.* 」\n┃ ✧ ᴄᴏɴᴛᴏʜ: .ʙʀᴏᴀᴅᴄᴀꜱᴛ ᴀᴅᴀ ᴍᴀɪɴᴛᴇɴᴀɴᴄᴇ ᴊᴀᴍ 10 ᴍᴀʟᴀᴍ ɪɴɪ.\n╰┈┈┈┈┈┈┈┈⬡`);
        return;
    }
    const users = db.prepare('SELECT jid FROM users').all();
    await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴍᴇɴɢɪʀɪᴍ ʙʀᴏᴀᴅᴄᴀꜱᴛ ᴋᴇ ${users.length} ᴜꜱᴇʀ...\n╰┈┈┈┈┈┈┈┈⬡`);
    let success = 0;
    for (const { jid } of users) {
        try {
            await conn.sendMessage(jid, { text: ` *Broadcast*\n\n${text}` });
            success++;
        }
        catch {
        }
        await sleep(300);
    }
    await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ʙʀᴏᴀᴅᴄᴀꜱᴛ ꜱᴇʟᴇꜱᴀɪ. ᴛᴇʀᴋɪʀɪᴍ ᴋᴇ ${success}/${users.length} ᴜꜱᴇʀ.\n╰┈┈┈┈┈┈┈┈⬡`);
};
handler.help = ['broadcast <pesan>'];
handler.tags = ['owner'];
handler.command = /^(broadcast|bc)$/i;
handler.owner = true;
handler.ignoreRateLimit = true;
handler.limit = true;
export default handler;
