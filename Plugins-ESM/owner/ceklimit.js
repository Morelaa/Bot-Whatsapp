'use strict';
import config from '../../config.js';
import db from '../../Database/db.js';
import usagelimit from '../../Database/usagelimit.js';
import { toPhoneJid } from '../../Library/resolve.js';
const handler = async (m, { text }) => {
    const botName = config.botName;
    const arg = (text || '').trim().toLowerCase();
    if (arg !== 'all') {
        await m.reply(
            `╭┈┈⬡「 *ᴄᴀʀᴀ ᴄᴇᴋʟɪᴍɪᴛ* 」\n┃\n` +
            `┃ ✧ ꜰᴏʀᴍᴀᴛ : *.ᴄᴇᴋʟɪᴍɪᴛ ᴀʟʟ*\n┃\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n꒰ © ${botName} ꒱`
        );
        return;
    }
    const limit = config.defaultUsageLimit;
    const allUsers = db.getUsers();
    // Data usage_limit kadang kesimpen pakai jid "@lid" (bukan "@s.whatsapp.net"),
    // tergantung format apa yang kepakai pas command dijalankan. Normalize dulu
    // ke jid phone-based biar nyambung sama data di tabel users, nggak nyasar
    // jadi baris terpisah / ketimpa 0.
    const usageMap = {};
    for (const row of usagelimit.getAllUsageToday()) {
        const canonicalJid = toPhoneJid(row.jid) || row.jid;
        usageMap[canonicalJid] = (usageMap[canonicalJid] || 0) + row.used;
    }
    const jids = new Set([...Object.keys(allUsers), ...Object.keys(usageMap)]);
    if (jids.size === 0) {
        await m.reply(`╭┈┈⬡「 *ᴄᴇᴋ ʟɪᴍɪᴛ ᴀʟʟ* 」\n┃\n┃ ✧ ʙᴇʟᴜᴍ ᴀᴅᴀ ᴅᴀᴛᴀ ʟɪᴍɪᴛ ᴜꜱᴇʀ\n┃\n╰┈┈┈┈┈┈┈┈⬡\n\n꒰ © ${botName} ꒱`);
        return;
    }
    // Urutkan dari yang pemakaiannya paling banyak biar langsung kelihatan siapa yang paling aktif hari ini.
    const sortedJids = [...jids].sort((a, b) => (usageMap[b] || 0) - (usageMap[a] || 0));
    let txt = `╭┈┈⬡「 *ᴄᴇᴋ ʟɪᴍɪᴛ ꜱᴇᴍᴜᴀ ᴜꜱᴇʀ* 」\n┃\n┃ ✧ ᴛᴏᴛᴀʟ : *${sortedJids.length} ᴜꜱᴇʀ*\n┃\n`;
    let i = 1;
    for (const jid of sortedJids) {
        const u = allUsers[jid];
        const isPrem = !!u?.premium;
        const used = usageMap[jid] || 0;
        const nomor = jid.replace('@s.whatsapp.net', '').replace('@lid', '').replace(/[^0-9]/g, '');
        const nama = u?.name || nomor;
        const pemakaian = isPrem ? ` Unlimited` : `${used}/${limit}`;
        txt += `┃ ✧ *${i}.* ${nama}\n┃ ✧ +${nomor}\n┃ ✧ ${pemakaian}\n┃\n`;
        i++;
    }
    txt += `╰┈┈┈┈┈┈┈┈⬡\n\n꒰ © ${botName} ꒱`;
    await m.reply(txt);
};
handler.help = ['ceklimit all'];
handler.tags = ['owner'];
handler.noLimit = true;
handler.command = /^(ceklimit)$/i;
handler.owner = true;
export default handler;
