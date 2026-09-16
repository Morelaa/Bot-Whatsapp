//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import crypto from 'crypto';
import sharp from 'sharp';
import config from '../../config.js';
import { getAllGroups, upsertGroupSettings } from '../../Database/db.js';
import { loadConfigImage } from '../../Library/utils.js';
const SMALLCAPS_MAP = {
    a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ꜰ', g: 'ɢ', h: 'ʜ', i: 'ɪ', j: 'ᴊ',
    k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'q', r: 'ʀ', s: 'ꜱ', t: 'ᴛ',
    u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ',
};
function toSmallCaps(text) {
    return String(text).replace(/[a-zA-Z]/g, (ch) => SMALLCAPS_MAP[ch.toLowerCase()] || ch);
}
async function syncGroupsFromLive(conn) {
    let live;
    try {
        live = await conn.groupFetchAllParticipating();
    } catch {
        return null;
    }
    if (!live) return null;
    const dbGroups = getAllGroups();
    for (const [jid, meta] of Object.entries(live)) {
        if (!dbGroups[jid]) {
            try { upsertGroupSettings(jid, meta?.subject ?? null, { botInGroup: true }); } catch {}
        }
    }
    return live;
}
async function fetchGroupList(conn) {
    const live = await syncGroupsFromLive(conn);
    const dbGroups = getAllGroups();
    const jids = live
        ? Object.keys(live)
        : Object.keys(dbGroups).filter((jid) => dbGroups[jid]?.settings?.botInGroup !== false);
    if (!jids.length) return [];
    return jids
        .slice(0, 50)
        .map((jid) => {
            const meta = live?.[jid];
            return {
                jid,
                name: meta?.subject || dbGroups[jid]?.name || jid,
                memberCount: meta?.participants?.length ?? 0,
            };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
}
const pendingQuotes = new Map();
async function sendGroupPicker(conn, m, groups, quote, replyText, participant) {
    const imgBuf = await loadConfigImage(config.menuImage);
    const jpegThumbnail = await sharp(imgBuf)
        .resize(300, 300, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
        .jpeg({ quality: 90 })
        .toBuffer()
        .catch(() => imgBuf);
    const footerText = toSmallCaps('pilih grup tujuan untuk mengirim quote palsu');
    const sections = [];
    const MAX_PER_SECTION = 10;
    for (let i = 0; i < groups.length; i += MAX_PER_SECTION) {
        const slice = groups.slice(i, i + MAX_PER_SECTION);
        sections.push({
            title: toSmallCaps(`grup ${i + 1}–${Math.min(i + MAX_PER_SECTION, groups.length)}`),
            highlight_label: i === 0 ? toSmallCaps(`total grup: ${groups.length}`) : undefined,
            rows: slice.map((g) => {
                const key = crypto.randomBytes(8).toString('hex');
                pendingQuotes.set(key, { quote: quote, replyText: replyText, participant: participant, sender: m.sender });
                setTimeout(() => pendingQuotes.delete(key), 5 * 60 * 1000);
                return {
                    title: toSmallCaps(g.name.length > 40 ? g.name.slice(0, 37) + '...' : g.name),
                    description: toSmallCaps(`member: ${g.memberCount}`),
                    id: `.fakequote go ${g.jid} ${key}`,
                };
            }),
        });
    }
    await conn.relayMessage(
        m.chat,
        {
            interactiveMessage: {
                header: {
                    hasMediaAttachment: true,
                    locationMessage: {
                        degreesLatitude: 0,
                        degreesLongitude: 0,
                        name: config.botName || 'Bot',
                        address: config.botVersion || '',
                        jpegThumbnail,
                    },
                },
                body: { text: '' },
                footer: { text: footerText },
                nativeFlowMessage: {
                    messageParamsJson: JSON.stringify({
                        limited_time_offer: {
                            text: '',
                            url: `https://wa.me/${config.mainOwner}`,
                            copy_code: config.botName || 'BOT',
                            expiration_time: Date.now() + 3600000,
                        },
                    }),
                    buttons: [
                        { name: '', buttonParamsJson: '{}' },
                        {
                            name: 'single_select',
                            buttonParamsJson: JSON.stringify({
                                icon: 'GROUP',
                                title: toSmallCaps('pilih grup'),
                                sections,
                            }),
                        },
                    ],
                },
            },
        },
        { messageId: conn.generateMessageTag() }
    );
}
async function sendFakeQuote(conn, groupJid, quote, replyText, participant) {
    const stanzaID = crypto.randomBytes(16).toString('hex').toUpperCase();
    const quotedMessage = { conversation: quote };
    const messageSecret = crypto.randomBytes(32).toString('base64');
    const payload = {
        extendedTextMessage: {
            text: replyText,
            contextInfo: {
                participant,
                stanzaID,
                quotedMessage,
                quotedType: 'EXPLICIT'
            },
            previewType: 'NONE'
        },
        messageContextInfo: {
            messageSecret
        }
    };
    await conn.relayMessage(groupJid, payload, {
        messageId: conn.generateMessageTag ? conn.generateMessageTag() : crypto.randomBytes(16).toString('hex').toUpperCase()
    });
}
export default async function handler(m, { conn, args, text, usedPrefix, command }) {
    const sub = (args[0] || '').toLowerCase();
    if (sub === 'go') {
        const jid = args[1];
        const key = args[2];
        if (!jid || !jid.endsWith('@g.us') || !key) {
            await m.reply(`*ɪɴꜰᴏ*\nᴅᴀᴛᴀ ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ. ᴜʟᴀɴɢɪ ᴅᴀʀɪ *.ꜰᴀᴋᴇqᴜᴏᴛᴇ <ǫᴜᴏᴛᴇ> | <ʙᴀʟᴀꜱᴀɴ>*`);
            return;
        }
        const data = pendingQuotes.get(key);
        if (!data) {
            await m.reply(`*ɪɴꜰᴏ*\nᴅᴀᴛᴀ ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ ᴀᴛᴀᴜ ᴇᴋꜱᴘɪʀᴇᴅ.`);
            return;
        }
        pendingQuotes.delete(key);
        if (data.sender !== m.sender) {
            await m.reply(`*ɪɴꜰᴏ*\nᴀɴᴅᴀ ᴛɪᴅᴀᴋ ʙᴇʀʜᴀᴋ ᴍᴇɴɢɢᴜɴᴀᴋᴀɴ ᴘɪʟɪʜᴀɴ ɪɴɪ.`);
            return;
        }
        let meta = null;
        try { meta = await conn.groupMetadata(jid); } catch {}
        if (!meta) {
            await m.reply(`*ɪɴꜰᴏ*\nʙᴏᴛ ꜱᴜᴅᴀʜ ᴛɪᴅᴀᴋ ᴀᴅᴀ ᴅɪ ɢʀᴜᴘ ɪɴɪ.`);
            return;
        }
        try {
            await sendFakeQuote(conn, jid, data.quote, data.replyText, data.participant);
            await m.reply(`*ɪɴꜰᴏ*\nǫᴜᴏᴛᴇ ᴘᴀʟꜱᴜ ʙᴇʀʜᴀꜱɪʟ ᴅɪᴋɪʀɪᴍ ᴋᴇ ɢʀᴜᴘ *${meta.subject || jid}*.`);
        } catch (e) {
            await m.reply(`*ɪɴꜰᴏ*\nɢᴀɢᴀʟ ᴋɪʀɪᴍ: ${e?.message || 'Unknown error'}`);
        }
        return;
    }
    let participant = null;
    let quote = '';
    let replyText = '';
    if (m.mentionedJid && m.mentionedJid.length > 0) {
        participant = m.mentionedJid[0];
        let cleanText = text;
        for (const jid of m.mentionedJid) {
            cleanText = cleanText.replace(`@${jid.split('@')[0]}`, '').trim();
        }
        const parts = cleanText.split('|').map(s => s.trim());
        if (parts.length < 2) {
            return m.reply(`Format: ${usedPrefix}${command} @mention <pesan_quote> | <pesan_balasan>`);
        }
        quote = parts[0];
        replyText = parts[1];
    } else {
        const firstArg = args[0];
        if (firstArg && /^\d+$/.test(firstArg)) {
            let num = firstArg.replace(/\D/g, '');
            if (num.startsWith('0')) num = '62' + num.slice(1);
            participant = num + '@s.whatsapp.net';
            const rest = args.slice(1).join(' ');
            const parts = rest.split('|').map(s => s.trim());
            if (parts.length < 2) {
                return m.reply(`Format: ${usedPrefix}${command} <nomor> <pesan_quote> | <pesan_balasan>`);
            }
            quote = parts[0];
            replyText = parts[1];
        } else {
            participant = m.sender;
            const parts = text.split('|').map(s => s.trim());
            if (parts.length < 2) {
                return m.reply(`Format: ${usedPrefix}${command} <pesan_quote> | <pesan_balasan>`);
            }
            quote = parts[0];
            replyText = parts[1];
        }
    }
    if (!participant) {
        return m.reply('Gagal menentukan sumber quote.');
    }
    if (!quote || !replyText) {
        return m.reply('Quote dan balasan tidak boleh kosong.');
    }
    const groups = await fetchGroupList(conn);
    if (!groups.length) {
        await m.reply(`*ɪɴꜰᴏ*\nʙᴏᴛ ᴛɪᴅᴀᴋ ʙᴇʀᴀᴅᴀ ᴅɪ ɢʀᴜᴘ ᴍᴀɴᴀᴘᴜɴ.`);
        return;
    }
    await sendGroupPicker(conn, m, groups, quote, replyText, participant);
}
handler.command = /^(?:fakequote|fq)$/i;
handler.help = 'Buat quote palsu, pilih grup dari daftar, lalu kirim.';
handler.tags = ['tools'];
handler.limit = false;
handler.group = false;
