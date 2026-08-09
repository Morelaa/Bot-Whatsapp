'use strict';
import config from '../../config.js';
import db from '../../Database/db.js';
import { Button } from '../../Library/MessageBuilder.js';
const handler = async (m, { conn, text }) => {
    const botName = config.botName;
    const arg = (text || '').trim();
    if (arg) {
        const targetJid = arg;
        const allUsers = db.getUsers();
        const targetUser =
            allUsers[targetJid] ||
            Object.values(allUsers).find((u) => u.phone === targetJid.replace('@s.whatsapp.net', ''));
        if (!targetUser) {
            await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴜꜱᴇʀ ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ ᴅɪ ᴅᴀꜰᴛᴀʀ ᴘᴇɴᴅᴀꜰᴛᴀʀ.\n╰┈┈┈┈┈┈┈┈⬡`);
            return;
        }
        const namaTarget = targetUser.name || '-';
        const ok = db.unregisterUser(targetUser.jid);
        if (!ok) {
            await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ɢᴀɢᴀʟ ᴜɴʀᴇɢ ᴜꜱᴇʀ. ᴄᴏʙᴀ ʟᴀɢɪ.\n╰┈┈┈┈┈┈┈┈⬡`);
            return;
        }
        await conn.sendMessage(m.chat, { react: { text: '', key: m.key } });
        await m.reply(
            `╭┈┈⬡「 *ᴜɴʀᴇɢ ʙᴇʀʜᴀꜱɪʟ* 」\n┃\n` +
            `┃ ✧ ᴀᴋᴜɴ *${namaTarget}* ᴅɪʜᴀᴘᴜꜱ ᴏʟᴇʜ ᴏᴡɴᴇʀ\n┃\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n꒰ © ${botName} ꒱`
        );
        return;
    }
    const allUsers = db.getUsers();
    const total = db.countUsers();
    if (total === 0) {
        await m.reply(`╭┈┈⬡「 *ʟɪᴀᴛ ᴅᴀꜰᴛᴀʀ* 」\n┃\n┃ ✧ ʙᴇʟᴜᴍ ᴀᴅᴀ ᴜꜱᴇʀ ᴛᴇʀᴅᴀꜰᴛᴀʀ\n┃\n╰┈┈┈┈┈┈┈┈⬡\n\n꒰ © ${botName} ꒱`);
        return;
    }
    const sorted = Object.values(allUsers).sort((a, b) => (b.registered_at || 0) - (a.registered_at || 0));
    const btn = new Button(conn)
        .setBody(
            `乂 *ʟɪᴀᴛ ᴅᴀꜰᴛᴀʀ ᴘᴇɴᴅᴀꜰᴛᴀʀ*\n\n` +
            ` Total : *${total} user*\n` +
            ` Tap salah satu nama di bawah untuk *unreg* user tersebut.`
        )
        .setFooter(`© ${botName} • Owner Panel`)
        .addSelection(' Lihat Daftar', {})
        .makeSection('Daftar Pendaftar', 'Pilih User');
    sorted.forEach((u) => {
        const status = u.premium ? ' Premium' : '🆓 User Biasa';
        btn.makeRow(status, u.name || 'User', 'Tap untuk unreg user ini', `.liatdaftar ${u.jid}`);
    });
    await btn.send(m.chat, { quoted: m.raw });
};
handler.help = ['liatdaftar'];
handler.tags = ['owner'];
handler.noLimit = true;
handler.command = /^(liatdaftar)$/i;
handler.owner = true;
export default handler;
