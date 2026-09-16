//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import { getDeviceHint } from '../../Core/terminalfx.js';
import { getProcessUptime } from '../../Library/system.js';
import {
    normNum, isLidJid, resolveLidToPhone, mapSenderLid,
    resolveSenderLidLive, autoMapParticipantLids, resolveDisplayName,
} from '../../Library/resolve.js';

const DEVICE_LABEL = {
    Android: 'Android',
    iPhone: 'iPhone',
    Web: 'WhatsApp Web',
};

function formatTimestamp(m) {
    let raw = m.timestamp || m.messageTimestamp;
    if (typeof raw === 'object' && raw !== null && typeof raw.toNumber === 'function') {
        raw = raw.toNumber();
    }
    const ms = Number(raw) * 1000;
    if (Number.isNaN(ms)) return '-';
    const d = new Date(ms);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// @lid isn't a real phone number, so it has to be resolved through the DB
// mapping, the current group participant list, or (last resort) a live
// groupMetadata fetch, in that order — same chain the rest of the bot uses.
async function resolvePhoneNumber(conn, m, rawSender, participants) {
    if (!isLidJid(rawSender)) return normNum(rawSender);
    let phone = resolveLidToPhone(rawSender) || mapSenderLid(rawSender, participants);
    if (!phone && m.isGroup) {
        phone = await resolveSenderLidLive(conn, m.chat, rawSender);
    }
    return phone || null;
}

const handler = async (m, { conn, participants }) => {
    if (participants?.length) autoMapParticipantLids(participants);

    const quoted = m.quoted?.message ? m.quoted : null;
    const rawSender = quoted?.sender || quoted?.key?.participant || m.senderPn || m.sender || '';
    const targetMsgId = quoted?.key?.id || m.key?.id || '';

    const rawId = rawSender.split('@')[0] || '';
    const deviceId = rawId.split(':')[1] ?? '0';
    const status = deviceId === '0' ? 'Perangkat utama' : 'Perangkat tambahan';

    const phoneNum = await resolvePhoneNumber(conn, m, rawSender, participants);
    const targetJid = phoneNum ? phoneNum + '@s.whatsapp.net' : rawSender;

    const targetPushName = (quoted?.pushName || quoted?.name || '').trim()
        || await resolveDisplayName(conn, m, targetJid, { participants });

    const hint = getDeviceHint(targetMsgId);
    const terbaca = DEVICE_LABEL[hint] || 'Tidak diketahui';
    const prefixId = targetMsgId ? targetMsgId.substring(0, 2) : '??';

    const chatType = m.isGroup ? 'Grup' : 'Private Chat';

    await m.reply(
        `📱 \`Perangkat Pesan\`\n\n` +
        `• \`Nama       :\` ${targetPushName}\n` +
        `• \`Nomor      :\` ${phoneNum ? '+' + phoneNum : 'Tidak diketahui'}\n` +
        `• \`ID Device  :\` ${deviceId}\n` +
        `• \`Status     :\` ${status}\n` +
        `• \`Terbaca    :\` ${terbaca}\n` +
        `• \`Prefix ID  :\` ${prefixId}\n` +
        `• \`Tipe Chat  :\` ${chatType}\n` +
        `• \`Waktu      :\` ${quoted ? '-' : formatTimestamp(m)}\n` +
        `• \`Uptime Bot :\` ${getProcessUptime()}`
    );
};

handler.help = ['cekdevice'];
handler.tags = ['info'];
handler.command = /^cekdevice$/i;
handler.limit = true;

export default handler;