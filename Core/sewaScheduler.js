//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import { DateTime } from 'luxon';
import config from '../config.js';
import db from '../Database/db.js';
import { logInfo, logWarn, logError } from './logutil.js';
const CHECK_INTERVAL_MS = 15 * 60 * 1000;
const REMINDER_WINDOW_MS = 3 * 24 * 60 * 60 * 1000; 
function ownerMentionJid() {
    const num = String(config.mainOwner || '').replace(/[^0-9]/g, '');
    return num ? `${num}@s.whatsapp.net` : null;
}
function fmtTanggal(ms) {
    return DateTime.fromMillis(ms).setZone('Asia/Jakarta').setLocale('id').toFormat("d MMMM yyyy 'jam' HH:mm");
}
async function checkOnce(sock) {
    let groups;
    try {
        groups = db.getAllGroups();
    } catch (e) {
        logError('[SEWABOT] Gagal ambil daftar grup:', e?.message);
        return;
    }
    const now = Date.now();
    const ownerJid = ownerMentionJid();
    for (const jid of Object.keys(groups)) {
        const g = groups[jid];
        const sewa = g?.settings?.sewa;
        if (!sewa?.active || !sewa?.untilAt) continue;
        try {
            if (now >= sewa.untilAt) {
                const text =
                    `╭┈┈⬡「 *ᴍᴀꜱᴀ ꜱᴇᴡᴀ ʙᴇʀᴀᴋʜɪʀ* 」\n` +
                    `┃\n` +
                    `┃ ✧ ᴍᴀꜱᴀ ꜱᴇᴡᴀ ʙᴏᴛ ᴅɪ ɢʀᴜᴘ ɪɴɪ ꜱᴜᴅᴀʜ ʜᴀʙɪꜱ ᴘᴀᴅᴀ ${fmtTanggal(sewa.untilAt)}.\n` +
                    `┃ ✧ ʙᴏᴛ ᴀᴋᴀɴ ᴋᴇʟᴜᴀʀ ᴅᴀʀɪ ɢʀᴜᴘ ɪɴɪ ꜱᴇᴋᴀʀᴀɴɢ.\n` +
                    `┃ ✧ ʜᴜʙᴜɴɢɪ ${ownerJid ? `@${ownerJid.split('@')[0]}` : 'owner'} ᴜɴᴛᴜᴋ ꜱᴇᴡᴀ ᴜʟᴀɴɢ.\n` +
                    `╰┈┈┈┈┈┈┈┈⬡`;
                try {
                    await sock.sendMessage(jid, { text, mentions: ownerJid ? [ownerJid] : [] });
                } catch {  }
                try {
                    await sock.groupLeave(jid);
                } catch (e) {
                    logWarn(`[SEWABOT] Gagal leave grup ${jid}:`, e?.message);
                }
                db.deleteGroup(jid);
                logInfo(`[SEWABOT] Masa sewa grup ${jid} habis, bot keluar.`);
                continue;
            }
            if (!sewa.reminded && sewa.untilAt - now <= REMINDER_WINDOW_MS) {
                const text =
                    `╭┈┈⬡「 *ʀᴇᴍɪɴᴅᴇʀ ꜱᴇᴡᴀ ʙᴏᴛ* 」\n` +
                    `┃\n` +
                    `┃ ✧ ᴍᴀꜱᴀ ꜱᴇᴡᴀ ʙᴏᴛ ᴅɪ ɢʀᴜᴘ ɪɴɪ ᴀᴋᴀɴ ʙᴇʀᴀᴋʜɪʀ ᴘᴀᴅᴀ ${fmtTanggal(sewa.untilAt)}.\n` +
                    `┃ ✧ ꜱɪꜱᴀ ᴡᴀᴋᴛᴜ ᴋᴜʀᴀɴɢ ᴅᴀʀɪ 3 ʜᴀʀɪ ʟᴀɢɪ.\n` +
                    `┃ ✧ ${ownerJid ? `@${ownerJid.split('@')[0]}` : 'ᴏᴡɴᴇʀ'} ꜱᴇɢᴇʀᴀ ᴘᴇʀᴘᴀɴᴊᴀɴɢ ꜱᴇᴡᴀ ꜱᴇʙᴇʟᴜᴍ ʙᴏᴛ ᴋᴇʟᴜᴀʀ ᴏᴛᴏᴍᴀᴛɪꜱ.\n` +
                    `╰┈┈┈┈┈┈┈┈⬡`;
                try {
                    await sock.sendMessage(jid, { text, mentions: ownerJid ? [ownerJid] : [] });
                    db.updateGroup(jid, { sewa: { ...sewa, reminded: true } });
                    logInfo(`[SEWABOT] Reminder H-3 terkirim ke grup ${jid}.`);
                } catch (e) {
                    logWarn(`[SEWABOT] Gagal kirim reminder ke ${jid}:`, e?.message);
                }
            }
        } catch (e) {
            logError(`[SEWABOT] Error proses grup ${jid}:`, e?.message);
        }
    }
}
let _timer = null;
export function startSewaScheduler(sock) {
    if (_timer) clearInterval(_timer);
    checkOnce(sock).catch((e) => logError('[SEWABOT] Cek awal gagal:', e?.message));
    _timer = setInterval(() => {
        checkOnce(sock).catch((e) => logError('[SEWABOT] Cek berkala gagal:', e?.message));
    }, CHECK_INTERVAL_MS);
    logInfo('[SEWABOT] Scheduler sewa bot aktif (cek tiap 15 menit).');
}
export default { startSewaScheduler };
