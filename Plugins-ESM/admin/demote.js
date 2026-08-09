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
        await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ʀᴇᴘʟʏ, ᴛᴀɢ (@ᴜꜱᴇʀ), ᴀᴛᴀᴜ ᴋᴀꜱɪʜ ɴᴏᴍᴏʀ ᴀᴅᴍɪɴ ʏᴀɴɢ ᴍᴀᴜ ᴅɪᴛᴜʀᴜɴᴋᴀɴ.\n╰┈┈┈┈┈┈┈┈⬡`);
        return;
    }
    const targetP = findParticipant(list, resolved.raw);
    if (!targetP) {
        await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴍᴇᴍʙᴇʀ ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ ᴅɪ ɢʀᴜᴘ ɪɴɪ.\n╰┈┈┈┈┈┈┈┈⬡`);
        return;
    }
    try {
        await conn.groupParticipantsUpdate(m.chat, [targetP.id], 'demote');
        await m.reply({ text: ` @${targetP.id.split('@')[0]} diturunkan jadi member biasa.`, mentions: [targetP.id] });
    }
    catch (err) {
        await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ɢᴀɢᴀʟ ᴅᴇᴍᴏᴛᴇ: ${err?.message || err}\n╰┈┈┈┈┈┈┈┈⬡`);
    }
};
handler.help = ['demote @user'];
handler.tags = ['admin'];
handler.command = /^(demote|turunkanadmin)$/i;
handler.admin = true;
handler.group = true;
handler.botAdmin = true;
handler.limit = true;
export default handler;
