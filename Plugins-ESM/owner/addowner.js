'use strict';
import { resolveTarget, normNum } from '../../Library/resolve.js';
import { addOwner, removeOwner, getExtraOwners } from '../../System/ownerlist.js';
const handler = async (m, { conn, command, args }) => {
    if (command === 'listaddedowner') {
        const list = getExtraOwners();
        if (!list.length) {
            return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ʙᴇʟᴜᴍ ᴀᴅᴀ ᴏᴡɴᴇʀ ᴛᴀᴍʙᴀʜᴀɴ ʏᴀɴɢ ᴅɪᴛᴀᴍʙᴀʜᴋᴀɴ ʟᴇᴡᴀᴛ .ᴀᴅᴅᴏᴡɴᴇʀ.\n╰┈┈┈┈┈┈┈┈⬡`);
        }
        const text = list.map((n, i) => `┃ ✧ ${i + 1}. +${n}`).ᴊᴏɪɴ('\n');
        return m.reply(`╭┈┈⬡「 *ᴏᴡɴᴇʀ ᴛᴀᴍʙᴀʜᴀɴ* 」\n${text}\n╰┈┈┈┈┈┈┈┈⬡`);
    }
    const resolved = resolveTarget(m, args, { minDigits: 8 });
    const targetJid = resolved.jid;
    if (!targetJid) {
        const isAdd = command === 'addowner';
        return m.reply(
            `${isAdd ? '' : ''} *${isAdd ? 'Tambah' : 'Hapus'} Owner*\n\n` +
            `╭┈┈⬡「 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
            `┃ ✧ .${command} 628xxx\n┃ ✧ .${command} @ᴍᴇɴᴛɪᴏɴ\n┃ ✧ ʀᴇᴘʟʏ ᴘᴇꜱᴀɴ + .${command}\n╰┈┈┈┈┈┈┈┈⬡`
        );
    }
    const targetNum = normNum(targetJid);
    if (command === 'addowner') {
        const ok = addOwner(targetNum);
        if (!ok) {
            return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ɴᴏᴍᴏʀ +${targetNum} ꜱᴜᴅᴀʜ ᴊᴀᴅɪ ᴏᴡɴᴇʀ ꜱᴇʙᴇʟᴜᴍɴʏᴀ.\n╰┈┈┈┈┈┈┈┈⬡`);
        }
        return m.reply(
            ` *Owner Ditambahkan!*\n\n╭┈┈⬡「 *ʀᴇꜱᴜʟᴛ* 」\n┃ ✧ ɴᴏᴍᴏʀ  : +${targetNum}\n┃ ✧ ꜱᴛᴀᴛᴜꜱ : ᴏᴡɴᴇʀ\n╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `Nomor ini sekarang punya akses owner (persist, tetap ada walau bot restart).`
        );
    }
    if (command === 'delowner') {
        const ok = removeOwner(targetNum);
        if (!ok) {
            return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ɴᴏᴍᴏʀ +${targetNum} ʙᴜᴋᴀɴ ᴏᴡɴᴇʀ ᴛᴀᴍʙᴀʜᴀɴ (ᴍᴜɴɢᴋɪɴ ᴍᴀɪɴ ᴏᴡɴᴇʀ ᴀᴛᴀᴜ ᴍᴇᴍᴀɴɢ ʙᴇʟᴜᴍ ᴏᴡɴᴇʀ).\n╰┈┈┈┈┈┈┈┈⬡`);
        }
        return m.reply(`╭┈┈⬡「 *ᴏᴡɴᴇʀ ᴅɪʜᴀᴘᴜꜱ!* 」\n┃\n┃ ✧ ɴᴏᴍᴏʀ +${targetNum} ᴛɪᴅᴀᴋ ʟᴀɢɪ ᴊᴀᴅɪ ᴏᴡɴᴇʀ.\n╰┈┈┈┈┈┈┈┈⬡`);
    }
};
handler.help = ['addowner <nomor/reply/mention>', 'delowner <nomor/reply/mention>', 'listaddedowner'];
handler.tags = ['owner'];
handler.command = /^(addowner|delowner|listaddedowner)$/i;
handler.mainOwner = true;
handler.limit = true;
export default handler;
