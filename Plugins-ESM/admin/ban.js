'use strict';
import db from '../../Database/db.js';
import { resolveTarget, normNum } from '../../Library/resolve.js';
const handler = async (m, { command, args }) => {
    if (command === 'banlist') {
        const usersRaw = db.getAllUsersRaw();
        const banned = Object.values(usersRaw).filter((u) => u.banned === 1);
        if (!banned.length) {
            return m.reply(`╭┈┈⬡「 *ʙᴀɴ ʟɪꜱᴛ* 」\n┃\n┃ ✧ ᴛɪᴅᴀᴋ ᴀᴅᴀ ᴜꜱᴇʀ ʏᴀɴɢ ᴅɪ-ʙᴀɴ ꜱᴀᴀᴛ ɪɴɪ.\n╰┈┈┈┈┈┈┈┈⬡`);
        }
        const list = banned.map((u, i) => {
            const num = u.phone || u.jid?.replace('@s.whatsapp.net', '') || '???';
            const nama = u.name || db.getPushName(num) || db.getPushName(u.jid || '') || 'User';
            return `┃ ✧ ${i + 1}. +${num} — ${nama}`;
        }).join('\n');
        return m.reply(
            `╭┈┈⬡「 *ʙᴀɴ ʟɪꜱᴛ* 」\n${list}\n╰┈┈┈┈┈┈┈┈⬡\n\n` +
            ` Total banned: *${banned.length} user*`
        );
    }
    const resolved = resolveTarget(m, args, { minDigits: 10 });
    const targetJid = resolved.jid;
    if (!targetJid) {
        const isBan = command === 'ban';
        return m.reply(
            `${isBan ? '' : ''} *${isBan ? 'Ban' : 'Unban'} User*\n\n` +
            `╭┈┈⬡「 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
            `┃ ✧ .${command} 628xxx\n┃ ✧ .${command} @ᴍᴇɴᴛɪᴏɴ\n┃ ✧ ʀᴇᴘʟʏ ᴘᴇꜱᴀɴ + .${command}\n╰┈┈┈┈┈┈┈┈⬡`
        );
    }
    const targetNum = normNum(targetJid);
    if (m.sender && targetJid === m.sender) {
        return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴛɪᴅᴀᴋ ʙɪꜱᴀ ʙᴀɴ ᴅɪʀɪ ꜱᴇɴᴅɪʀɪ!\n╰┈┈┈┈┈┈┈┈⬡`);
    }
    const userData = db.getUser(targetJid);
    const namaTarget = userData?.name || db.getPushName(targetNum) || db.getPushName(targetJid) || 'User';
    const sudahBanned = userData?.banned === 1;
    if (command === 'ban') {
        if (sudahBanned) {
            return m.reply(`╭┈┈⬡「 *ꜱᴜᴅᴀʜ ᴅɪ-ʙᴀɴ!* 」\n┃\n┃ ✧ ɴᴏᴍᴏʀ : +${targetNum}\n┃ ✧ ɴᴀᴍᴀ  : ${namaTarget}\n┃\n┃ ✧ ᴜꜱᴇʀ ɪɴɪ ꜱᴜᴅᴀʜ ᴅɪ-ʙᴀɴ ꜱᴇʙᴇʟᴜᴍɴʏᴀ.\n┃ ✧ ɢᴜɴᴀᴋᴀɴ *.ᴜɴʙᴀɴ* ᴜɴᴛᴜᴋ ᴍᴇɴᴄᴀʙᴜᴛ ʙᴀɴ.\n╰┈┈┈┈┈┈┈┈⬡`);
        }
        db.setBanned(targetJid, true);
        return m.reply(
            ` *User Di-ban!*\n\n╭┈┈⬡「 *ʀᴇꜱᴜʟᴛ* 」\n┃ ✧ ɴᴏᴍᴏʀ  : +${targetNum}\n┃ ✧ ɴᴀᴍᴀ   : ${namaTarget}\n┃ ✧ ꜱᴛᴀᴛᴜꜱ : ʙᴀɴɴᴇᴅ\n╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `User tidak bisa menggunakan bot lagi.\nGunakan *.unban* untuk mencabut.`
        );
    }
    if (command === 'unban') {
        if (!sudahBanned) {
            return m.reply(`╭┈┈⬡「 *ᴛɪᴅᴀᴋ ᴅɪ-ʙᴀɴ!* 」\n┃\n┃ ✧ ɴᴏᴍᴏʀ : +${targetNum}\n┃ ✧ ɴᴀᴍᴀ  : ${namaTarget}\n┃\n┃ ✧ ᴜꜱᴇʀ ɪɴɪ ᴛɪᴅᴀᴋ ꜱᴇᴅᴀɴɢ ᴅɪ-ʙᴀɴ.\n╰┈┈┈┈┈┈┈┈⬡`);
        }
        db.setBanned(targetJid, false);
        return m.reply(
            ` *User Di-unban!*\n\n╭┈┈⬡「 *ʀᴇꜱᴜʟᴛ* 」\n┃ ✧ ɴᴏᴍᴏʀ  : +${targetNum}\n┃ ✧ ɴᴀᴍᴀ   : ${namaTarget}\n┃ ✧ ꜱᴛᴀᴛᴜꜱ : ᴀᴋᴛɪꜰ ᴋᴇᴍʙᴀʟɪ\n╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `User sudah bisa menggunakan bot lagi.`
        );
    }
};
handler.help = ['ban <nomor/reply/mention>', 'unban <nomor/reply/mention>', 'banlist'];
handler.tags = ['owner'];
handler.command = /^(ban|unban|banlist)$/i;
handler.owner = true;
handler.limit = true;
export default handler;
