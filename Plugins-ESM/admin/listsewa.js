//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import { DateTime } from 'luxon';
import db from '../../Database/db.js';
function formatSisaWaktu(now, target) {
    let months = (target.year - now.year) * 12 + (target.month - now.month);
    let days = target.day - now.day;
    if (target.toMillis() < now.toMillis()) return { label: 'ꜱᴜᴅᴀʜ ʜᴀʙɪꜱ', expired: true };
    if (days < 0) {
        months -= 1;
        const prevMonth = target.minus({ months: 1 });
        days += prevMonth.daysInMonth;
    }
    if (months < 0) months = 0;
    const parts = [];
    if (months > 0) parts.push(`${months} bulan`);
    if (days > 0 || parts.length === 0) parts.push(`${days} hari`);
    return { label: parts.join(' '), expired: false };
}
const handler = async (m, { command }) => {
    if (command !== 'listsewa') return;
    const dbGroups = db.getAllGroups();
    const now = DateTime.now().setZone('Asia/Jakarta');
    const rented = Object.keys(dbGroups)
        .map((jid) => ({ jid, name: dbGroups[jid]?.name || jid, sewa: dbGroups[jid]?.settings?.sewa }))
        .filter((g) => g.sewa?.active && g.sewa?.untilAt)
        .map((g) => {
            const target = DateTime.fromMillis(g.sewa.untilAt).setZone('Asia/Jakarta');
            const sisa = formatSisaWaktu(now, target);
            return {
                jid: g.jid,
                name: g.name,
                untilAt: g.sewa.untilAt,
                tanggalHabis: target.toFormat('d MMMM yyyy'),
                sisaLabel: sisa.label,
                mauHabis: !sisa.expired && target.diff(now, 'days').days <= 3,
                expired: sisa.expired,
            };
        })
        .sort((a, b) => a.untilAt - b.untilAt);
    if (!rented.length) {
        return m.reply(`╭┈┈⬡「 *ʟɪꜱᴛ ꜱᴇᴡᴀ ʙᴏᴛ* 」\n┃ ✧ ᴛɪᴅᴀᴋ ᴀᴅᴀ ɢʀᴜᴘ ʏᴀɴɢ ꜱᴇᴅᴀɴɢ ᴅᴀʟᴀᴍ ᴍᴀꜱᴀ ꜱᴇᴡᴀ.\n╰┈┈┈┈┈┈┈┈⬡`);
    }
    let body = `╭┈┈⬡「 *ʟɪꜱᴛ ꜱᴇᴡᴀ ʙᴏᴛ* 」\n┃\n┃ ✧ ᴛᴏᴛᴀʟ ɢʀᴜᴘ ᴅɪꜱᴇᴡᴀ : ${rented.length}\n┃\n`;
    rented.forEach((g, i) => {
        const mark = g.expired ? '⛔' : g.mauHabis ? '⚠️' : '🟢';
        body += `┃ ${mark} *${i + 1}. ${g.name}*\n`;
        body += `┃    ᴊɪᴅ    : ${g.jid.replace('@g.us', '')}\n`;
        body += `┃    ʜᴀʙɪꜱ  : ${g.tanggalHabis}\n`;
        body += `┃    ꜱɪꜱᴀ   : ${g.sisaLabel}\n`;
        if (i < rented.length - 1) body += `┃\n`;
    });
    body += `╰┈┈┈┈┈┈┈┈⬡\n\n🟢 ᴀᴋᴛɪꜰ  ⚠️ ᴋᴜʀᴀɴɢ ᴅᴀʀɪ 3 ʜᴀʀɪ  ⛔ ꜱᴜᴅᴀʜ ʜᴀʙɪꜱ (ᴍᴇɴᴜɴɢɢᴜ ᴘʀᴏꜱᴇꜱ ᴋᴇʟᴜᴀʀ)`;
    return m.reply(body);
};
handler.command = /^listsewa$/i;
handler.owner = true;
handler.tags = ['owner'];
handler.help = ['listsewa'];
handler.limit = true;
export default handler;
