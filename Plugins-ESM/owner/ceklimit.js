//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import config from '../../config.js';
import db from '../../Database/db.js';
import usagelimit from '../../Database/usagelimit.js';
import { toPhoneJid, resolveLidToPhone } from '../../Library/resolve.js';
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
    const rawUsers = db.getUsers();
    const allUsers = {};
    for (const [jid, row] of Object.entries(rawUsers)) {
        const phoneFromRow = row?.phone ? row.phone.replace(/[^0-9]/g, '') : '';
        const canonicalJid = toPhoneJid(jid) ||
            (phoneFromRow ? phoneFromRow + '@s.whatsapp.net' : null) ||
            jid;
        if (!allUsers[canonicalJid] || (!allUsers[canonicalJid].name && row.name)) {
            allUsers[canonicalJid] = row;
        }
    }
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
    const sortedJids = [...jids].sort((a, b) => (usageMap[b] || 0) - (usageMap[a] || 0));
    let txt = `╭┈┈⬡「 *ᴄᴇᴋ ʟɪᴍɪᴛ ꜱᴇᴍᴜᴀ ᴜꜱᴇʀ* 」\n┃\n┃ ✧ ᴛᴏᴛᴀʟ : *${sortedJids.length} ᴜꜱᴇʀ*\n┃\n`;
    let i = 1;
    for (const jid of sortedJids) {
        const u = allUsers[jid];
        const isPrem = !!u?.premium;
        const used = usageMap[jid] || 0;
        let nomor = jid.replace('@s.whatsapp.net', '').replace('@lid', '').replace(/[^0-9]/g, '');
        if (jid.endsWith('@lid')) {
            const resolved = resolveLidToPhone(jid) || (u?.phone ? u.phone.replace(/[^0-9]/g, '') : null);
            if (resolved)
                nomor = resolved;
        }
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
