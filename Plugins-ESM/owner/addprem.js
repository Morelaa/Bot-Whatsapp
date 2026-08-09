'use strict';
import db from '../../Database/db.js';
import { resolveTarget, normNum } from '../../Library/resolve.js';
const handler = async (m, { command, args }) => {
    const resolved = resolveTarget(m, args, { minDigits: 8 });
    const targetJid = resolved.jid;
    if (!targetJid) {
        const isAdd = command === 'addprem';
        return m.reply(
            `${isAdd ? '' : ''} *${isAdd ? 'Tambah' : 'Hapus'} Premium*\n\n` +
            `╭┈┈⬡「 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
            `┃ ✧ .${command} 628xxx\n┃ ✧ .${command} @ᴍᴇɴᴛɪᴏɴ\n┃ ✧ ʀᴇᴘʟʏ ᴘᴇꜱᴀɴ + .${command}\n╰┈┈┈┈┈┈┈┈⬡`
        );
    }
    const targetNum = normNum(targetJid);
    const userData = db.getUser(targetJid);
    const namaTarget = userData?.name || db.getPushName(targetNum) || db.getPushName(targetJid) || 'User';
    const sudahPremium = !!userData?.premium;
    if (command === 'addprem') {
        if (sudahPremium) {
            return m.reply(`╭┈┈⬡「 *ꜱᴜᴅᴀʜ ᴘʀᴇᴍɪᴜᴍ!* 」\n┃\n┃ ✧ ɴᴏᴍᴏʀ : +${targetNum}\n┃ ✧ ɴᴀᴍᴀ  : ${namaTarget}\n┃\n┃ ✧ ᴜꜱᴇʀ ɪɴɪ ꜱᴜᴅᴀʜ ᴘʀᴇᴍɪᴜᴍ ꜱᴇʙᴇʟᴜᴍɴʏᴀ.\n╰┈┈┈┈┈┈┈┈⬡`);
        }
        db.setPremium(targetJid, true);
        return m.reply(
            ` *User Jadi Premium!*\n\n╭┈┈⬡「 *ʀᴇꜱᴜʟᴛ* 」\n┃ ✧ ɴᴏᴍᴏʀ  : +${targetNum}\n┃ ✧ ɴᴀᴍᴀ   : ${namaTarget}\n┃ ✧ ꜱᴛᴀᴛᴜꜱ : ᴘʀᴇᴍɪᴜᴍ\n╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `User sekarang bebas dari limit harian.\nGunakan *.delprem* untuk mencabut.`
        );
    }
    if (command === 'delprem') {
        if (!sudahPremium) {
            return m.reply(`╭┈┈⬡「 *ʙᴇʟᴜᴍ ᴘʀᴇᴍɪᴜᴍ!* 」\n┃\n┃ ✧ ɴᴏᴍᴏʀ : +${targetNum}\n┃ ✧ ɴᴀᴍᴀ  : ${namaTarget}\n┃\n┃ ✧ ᴜꜱᴇʀ ɪɴɪ ʙᴜᴋᴀɴ ᴘʀᴇᴍɪᴜᴍ.\n╰┈┈┈┈┈┈┈┈⬡`);
        }
        db.setPremium(targetJid, false);
        return m.reply(
            ` *Premium Dicabut!*\n\n╭┈┈⬡「 *ʀᴇꜱᴜʟᴛ* 」\n┃ ✧ ɴᴏᴍᴏʀ  : +${targetNum}\n┃ ✧ ɴᴀᴍᴀ   : ${namaTarget}\n┃ ✧ ꜱᴛᴀᴛᴜꜱ : ɴᴏɴ-ᴘʀᴇᴍɪᴜᴍ\n╰┈┈┈┈┈┈┈┈⬡`
        );
    }
};
handler.help = ['addprem <nomor/reply/mention>', 'delprem <nomor/reply/mention>'];
handler.tags = ['owner'];
handler.command = /^(addprem|delprem)$/i;
handler.owner = true;
handler.limit = true;
export default handler;
