//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import * as baileys from '@itsliaaa/baileys';
import { DateTime } from 'luxon';
import config from '../../config.js';
import db from '../../Database/db.js';
const { prepareWAMessageMedia } = baileys;
const MONTHS_ID = {
    januari: 1, jan: 1,
    februari: 2, feb: 2,
    maret: 3, mar: 3,
    april: 4, apr: 4,
    mei: 5,
    juni: 6, jun: 6,
    juli: 7, jul: 7,
    agustus: 8, agu: 8, ags: 8,
    september: 9, sep: 9, sept: 9,
    oktober: 10, okt: 10,
    november: 11, nov: 11,
    desember: 12, des: 12,
};
function parseTanggalID(raw) {
    const s = raw.trim().toLowerCase().replace(/,/g, ' ').replace(/\s+/g, ' ');
    let m = s.match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/);
    if (m) {
        const day = parseInt(m[1], 10);
        const month = MONTHS_ID[m[2]];
        const year = parseInt(m[3], 10);
        if (!month) return null;
        return { day, month, year };
    }
    m = s.match(/^(\d{1,2})[\/\-.\s](\d{1,2})[\/\-.\s](\d{4})$/);
    if (m) {
        const day = parseInt(m[1], 10);
        const month = parseInt(m[2], 10);
        const year = parseInt(m[3], 10);
        if (month < 1 || month > 12) return null;
        return { day, month, year };
    }
    return null;
}
function formatSisaWaktu(now, target) {
    const totalDays = Math.ceil(target.diff(now, 'days').days);
    let months = (target.year - now.year) * 12 + (target.month - now.month);
    let days = target.day - now.day;
    if (days < 0) {
        months -= 1;
        const prevMonth = target.minus({ months: 1 });
        days += prevMonth.daysInMonth;
    }
    if (months < 0) months = 0;
    const parts = [];
    if (months > 0) parts.push(`${months} bulan`);
    if (days > 0 || parts.length === 0) parts.push(`${days} hari`);
    return { label: parts.join(' '), totalDays };
}
function buildRows(groups) {
    return groups.map((g, i) => ({
        header: `Grup ${i + 1}`,
        title: g.name.length > 40 ? g.name.slice(0, 37) + '...' : g.name,
        description: `Member : ${g.memberCount}  ◦  ${g.jid.replace('@g.us', '')}`,
        id: `.sewabot ${g.jid}`,
    }));
}
const SESSION_TIMEOUT_MS = 5 * 60 * 1000;
const activeSessions = new Map();
const handler = async (m, { conn, command, text }) => {
    if (command !== 'sewabot') return;
    if (text && text.trim().endsWith('@g.us')) {
        const targetJid = text.trim();
        let groupName = targetJid;
        try {
            const meta = await conn.groupMetadata(targetJid);
            groupName = meta?.subject || targetJid;
        } catch {  }
        const existing = db.getGroup(targetJid);
        const currentSewa = existing?.settings?.sewa;
        activeSessions.set(m.chat, { targetJid, groupName, senderJid: m.sender, expireAt: Date.now() + SESSION_TIMEOUT_MS });
        const statusLine = currentSewa?.active && currentSewa?.untilAt
            ? `┃ ✧ ꜱᴛᴀᴛᴜꜱ ꜱᴀᴀᴛ ɪɴɪ : ᴀᴋᴛɪꜰ ꜱ.ᴅ ${DateTime.fromMillis(currentSewa.untilAt).setZone('Asia/Jakarta').toFormat('d-MM-yyyy HH:mm')}\n┃\n`
            : '';
        return m.reply(
            `╭┈┈⬡「 *ꜱᴇᴡᴀ ʙᴏᴛ* 」\n` +
            `┃\n` +
            `┃ ✧ ɢʀᴜᴘ : ${groupName}\n` +
            `┃ ✧ ᴊɪᴅ  : ${targetJid.replace('@g.us', '')}\n` +
            `┃\n` +
            statusLine +
            `┃ ✧ ᴋᴇᴛɪᴋ ᴛᴀɴɢɢᴀʟ ᴍᴀꜱᴀ ꜱᴇᴡᴀ ʙᴇʀᴀᴋʜɪʀ.\n` +
            `┃ ✧ ᴄᴏɴᴛᴏʜ : 15 ꜱᴇᴘᴛᴇᴍʙᴇʀ 2026\n` +
            `┃ ✧ ᴀᴛᴀᴜ  : 15-09-2026\n` +
            `┃\n` +
            `┃ ✧ ᴋᴇᴛɪᴋ *ʙᴀᴛᴀʟ* ᴜɴᴛᴜᴋ ᴍᴇᴍʙᴀᴛᴀʟᴋᴀɴ.\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        );
    }
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
    let groupList = [];
    try {
        const dbGroups = db.getAllGroups();
        const jids = Object.keys(dbGroups);
        if (!jids.length) {
            await conn.sendMessage(m.chat, { react: { text: '', key: m.key } });
            return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ʙᴏᴛ ᴛɪᴅᴀᴋ ʙᴇʀᴀᴅᴀ ᴅɪ ɢʀᴜᴘ ᴍᴀɴᴀᴘᴜɴ.\n╰┈┈┈┈┈┈┈┈⬡`);
        }
        const results = await Promise.allSettled(
            jids.slice(0, 50).map(async (jid) => {
                try {
                    const meta = await conn.groupMetadata(jid);
                    return { jid, name: meta?.subject || dbGroups[jid]?.name || jid, memberCount: meta?.participants?.length ?? 0 };
                } catch {
                    return { jid, name: dbGroups[jid]?.name || jid, memberCount: 0 };
                }
            })
        );
        groupList = results.filter((r) => r.status === 'fulfilled').map((r) => r.value).sort((a, b) => a.name.localeCompare(b.name));
    } catch (e) {
        await conn.sendMessage(m.chat, { react: { text: '', key: m.key } });
        return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ɢᴀɢᴀʟ ᴍᴇɴɢᴀᴍʙɪʟ ᴅᴀꜰᴛᴀʀ ɢʀᴜᴘ : ${e?.message}\n╰┈┈┈┈┈┈┈┈⬡`);
    }
    if (!groupList.length) {
        await conn.sendMessage(m.chat, { react: { text: '', key: m.key } });
        return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ʙᴏᴛ ᴛɪᴅᴀᴋ ʙᴇʀᴀᴅᴀ ᴅɪ ɢʀᴜᴘ ᴍᴀɴᴀᴘᴜɴ.\n╰┈┈┈┈┈┈┈┈⬡`);
    }
    const MAX_PER_SECTION = 10;
    const sections = [];
    for (let i = 0; i < groupList.length; i += MAX_PER_SECTION) {
        const slice = groupList.slice(i, i + MAX_PER_SECTION);
        sections.push({ title: `Grup ${i + 1}–${Math.min(i + MAX_PER_SECTION, groupList.length)} dari ${groupList.length}`, rows: buildRows(slice) });
    }
    const caption = `*Sewa Bot*\n\nTotal Grup : ${groupList.length}\n\n_Ketuk nama grup yang mau diatur masa sewanya._`;
    const thumb = config.buttonv2Img;
    let imgMsg = null;
    if (thumb) {
        try {
            const media = await prepareWAMessageMedia({ image: { url: thumb } }, { upload: conn.waUploadToServer });
            imgMsg = media?.imageMessage;
        } catch {  }
    }
    await conn.relayMessage(m.chat, {
        interactiveMessage: {
            ...(imgMsg ? { header: { hasMediaAttachment: true, imageMessage: imgMsg } } : { header: { hasMediaAttachment: false } }),
            body: { text: caption },
            footer: { text: `© ${config.botName}` },
            contextInfo: { forwardingScore: 1, isForwarded: true, quotedMessage: m.raw?.message },
            nativeFlowMessage: { buttons: [{ name: 'single_select', buttonParamsJson: JSON.stringify({ title: 'Pilih Grup', sections }) }] },
        },
    }, { messageId: conn.generateMessageTag ? conn.generateMessageTag() : undefined });
    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
};
handler.onText = async (m) => {
    const session = activeSessions.get(m.chat);
    if (!session) return false;
    if (session.expireAt <= Date.now()) {
        activeSessions.delete(m.chat);
        return false;
    }
    if (session.senderJid && m.sender !== session.senderJid) return false;
    const raw = (m.body || m.text || '').trim();
    if (!raw) return false;
    if (config.prefix?.some((p) => raw.startsWith(p))) return false;
    if (raw.toLowerCase() === 'batal') {
        activeSessions.delete(m.chat);
        await m.reply(`╭┈┈⬡「 *ᴅɪʙᴀᴛᴀʟᴋᴀɴ* 」\n┃ ✧ ᴘʀᴏꜱᴇꜱ ꜱᴇᴡᴀ ʙᴏᴛ ᴅɪʙᴀᴛᴀʟᴋᴀɴ.\n╰┈┈┈┈┈┈┈┈⬡`);
        return true;
    }
    const parsed = parseTanggalID(raw);
    if (!parsed) {
        await m.reply(
            `╭┈┈⬡「 *ꜰᴏʀᴍᴀᴛ ꜱᴀʟᴀʜ* 」\n` +
            `┃ ✧ ᴄᴏɴᴛᴏʜ : 15 ꜱᴇᴘᴛᴇᴍʙᴇʀ 2026\n` +
            `┃ ✧ ᴀᴛᴀᴜ  : 15-09-2026\n` +
            `┃ ✧ ᴋᴇᴛɪᴋ *ʙᴀᴛᴀʟ* ᴜɴᴛᴜᴋ ᴍᴇᴍʙᴀᴛᴀʟᴋᴀɴ.\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        );
        return true;
    }
    const target = DateTime.fromObject(
        { year: parsed.year, month: parsed.month, day: parsed.day, hour: 23, minute: 59 },
        { zone: 'Asia/Jakarta' }
    );
    if (!target.isValid || target.day !== parsed.day) {
        await m.reply(`╭┈┈⬡「 *ᴛᴀɴɢɢᴀʟ ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ* 」\n┃ ✧ ᴄᴇᴋ ʟᴀɢɪ ᴛᴀɴɢɢᴀʟ, ʙᴜʟᴀɴ, ᴅᴀɴ ᴛᴀʜᴜɴɴʏᴀ.\n╰┈┈┈┈┈┈┈┈⬡`);
        return true;
    }
    const now = DateTime.now().setZone('Asia/Jakarta');
    if (target <= now) {
        await m.reply(`╭┈┈⬡「 *ᴛᴀɴɢɢᴀʟ ꜱᴜᴅᴀʜ ʟᴇᴡᴀᴛ* 」\n┃ ✧ ᴍᴀꜱᴜᴋᴋᴀɴ ᴛᴀɴɢɢᴀʟ ᴅɪ ᴍᴀꜱᴀ ᴅᴇᴘᴀɴ.\n╰┈┈┈┈┈┈┈┈⬡`);
        return true;
    }
    const { label } = formatSisaWaktu(now, target);
    db.updateGroup(session.targetJid, {
        sewa: {
            active: true,
            tenantJid: m.sender,
            startedAt: Date.now(),
            untilAt: target.toMillis(),
            reminded: false,
        },
    });
    activeSessions.delete(m.chat);
    await m.reply(
        `╭┈┈⬡「 *ꜱᴇᴡᴀ ʙᴏᴛ ᴀᴋᴛɪꜰ* 」\n` +
        `┃\n` +
        `┃ ✧ ɢʀᴜᴘ    : ${session.groupName}\n` +
        `┃ ✧ ʙᴇʀʟᴀᴋᴜ  : ${label}\n` +
        `┃ ✧ ʜᴀʙɪꜱ   : ${target.toFormat('d MMMM yyyy')}\n` +
        `┃\n` +
        `┃ ✧ ʙᴏᴛ ᴀᴋᴀɴ ɴɢᴇᴛᴀɢ ᴏᴡɴᴇʀ 3 ʜᴀʀɪ ꜱᴇʙᴇʟᴜᴍ ʜᴀʙɪꜱ, ᴅᴀɴ ᴏᴛᴏᴍᴀᴛɪꜱ ᴋᴇʟᴜᴀʀ ꜱᴇᴛᴇʟᴀʜ ʜᴀʙɪꜱ ᴋᴀʟᴏ ɢᴀᴋ ᴅɪᴘᴇʀᴘᴀɴᴊᴀɴɢ.\n` +
        `╰┈┈┈┈┈┈┈┈⬡`
    );
    return true;
};
handler.command = /^sewabot$/i;
handler.owner = true;
handler.tags = ['owner'];
handler.help = ['sewabot', 'sewabot <jid@g.us>'];
handler.limit = true;
export default handler;
