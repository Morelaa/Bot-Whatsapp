'use strict';
import { resolveTarget, findParticipant } from '../../Library/resolve.js';
const handler = async (m, { conn, args, participants }) => {
    let list = participants;
    if (!list) {
        try {
            list = (await conn.groupMetadata(m.chat)).participants;
        }
        catch {
            await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ɢᴀɢᴀʟ ᴀᴍʙɪʟ ᴅᴀᴛᴀ ᴍᴇᴍʙᴇʀ ɢʀᴜᴘ.\n╰┈┈┈┈┈┈┈┈⬡`);
            return;
        }
    }
    const resolved = resolveTarget(m, args, { minDigits: 8 });
    if (!resolved.raw) {
        await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ʀᴇᴘʟʏ, ᴛᴀɢ (@ᴜꜱᴇʀ), ᴀᴛᴀᴜ ᴋᴀꜱɪʜ ɴᴏᴍᴏʀ ᴍᴇᴍʙᴇʀ ʏᴀɴɢ ᴍᴀᴜ ᴅɪᴊᴀᴅɪᴋᴀɴ ᴀᴅᴍɪɴ.\n╰┈┈┈┈┈┈┈┈⬡`);
        return;
    }
    const targetP = findParticipant(list, resolved.raw);
    if (!targetP) {
        await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴍᴇᴍʙᴇʀ ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ ᴅɪ ɢʀᴜᴘ ɪɴɪ.\n╰┈┈┈┈┈┈┈┈⬡`);
        return;
    }
    try {
        await conn.groupParticipantsUpdate(m.chat, [targetP.id], 'promote');
        await m.reply({ text: ` @${targetP.id.split('@')[0]} sekarang jadi admin.`, mentions: [targetP.id] });
    }
    catch (err) {
        await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ɢᴀɢᴀʟ ᴘʀᴏᴍᴏᴛᴇ: ${err?.message || err}\n╰┈┈┈┈┈┈┈┈⬡`);
    }
};
handler.help = ['promote @user'];
handler.tags = ['admin'];
handler.command = /^(promote|jadikanadmin)$/i;
handler.admin = true;
handler.group = true;
handler.botAdmin = true;
handler.limit = true;
export default handler;
