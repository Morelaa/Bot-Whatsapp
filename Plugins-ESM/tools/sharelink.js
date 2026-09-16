//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import sharp from 'sharp';
import config from '../../config.js';
import { getAllGroups, upsertGroupSettings } from '../../Database/db.js';
import { loadConfigImage } from '../../Library/utils.js';
const LINK_RX = /^https?:\/\/\S+$/i;
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
function buildSectionsShareLink(groups, link) {
    const MAX_PER_SECTION = 10;
    const sections = [];
    for (let i = 0; i < groups.length; i += MAX_PER_SECTION) {
        const slice = groups.slice(i, i + MAX_PER_SECTION);
        sections.push({
            title: toSmallCaps(`grup ${i + 1}–${Math.min(i + MAX_PER_SECTION, groups.length)} dari ${groups.length}`),
            highlight_label: i === 0 ? toSmallCaps(`total grup: ${groups.length}`) : undefined,
            rows: slice.map((g) => ({
                title: toSmallCaps(g.name.length > 40 ? g.name.slice(0, 37) + '...' : g.name),
                description: toSmallCaps(`member: ${g.memberCount}`),
                id: `.sharelink go ${g.jid} ${link}`,
            })),
        });
    }
    return sections;
}
async function sendSharePicker(conn, m, groups, link) {
    const imgBuf = await loadConfigImage(config.menuImage);
    const jpegThumbnail = await sharp(imgBuf)
        .resize(300, 300, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
        .jpeg({ quality: 90 })
        .toBuffer()
        .catch(() => imgBuf);
    const footerText = `*ꜱʜᴀʀᴇ ʟɪɴᴋ ɢʀᴜᴘ*\nᴘɪʟɪʜ ᴍᴀᴜ ᴅɪʙᴀɢɪᴋᴀɴ ꜱᴇʙᴀɢᴀɪ ɢʀᴜᴘ ᴀᴘᴀ ᴅɪ ʙᴀᴡᴀʜ ɪɴɪ`;
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 0, 0);
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
                            expiration_time: endOfDay.getTime(),
                        },
                    }),
                    buttons: [
                        { name: '', buttonParamsJson: '{}' },
                        {
                            name: 'single_select',
                            buttonParamsJson: JSON.stringify({
                                icon: 'DOCUMENT',
                                title: toSmallCaps('share link grup'),
                                sections: buildSectionsShareLink(groups, link),
                            }),
                        },
                    ],
                },
            },
        },
        { messageId: conn.generateMessageTag() }
    );
}
async function sendShareLinkCard(conn, m, group, link) {
    const rawImgV5 = await loadConfigImage(config.menuImage);
    let imgBufV5 = rawImgV5;
    try {
        imgBufV5 = await sharp(rawImgV5).resize(300, 300, { fit: 'inside' }).jpeg({ quality: 70 }).toBuffer();
    } catch { }
    const rawImgThumb = await loadConfigImage(config.thumbnail);
    let imgBufThumb = rawImgThumb;
    try {
        imgBufThumb = await sharp(rawImgThumb).resize(320, 320, { fit: 'inside' }).jpeg({ quality: 80 }).toBuffer();
    } catch { }
    const promoText = toSmallCaps(
        'yuk gabung! bot lengkap serba bisa\n\n' +
        '• ai chat\n' +
        '• download tiktok/ig/fb/yt tanpa watermark\n' +
        '• bikin sticker instan\n' +
        '• aneka game seru\n' +
        '• auto welcome & antilink buat admin grup\n\n' +
        '100% gratis!'
    );
    const messageContent = {
        extendedTextMessage: {
            text: `${promoText}\n\n${link}`, 
            matchedText: link,
            title: toSmallCaps('kunjungi grup kami'),
            description: config.ownerName || '',
            previewType: 'NONE',
            jpegThumbnail: imgBufThumb.toString('base64'),
            contextInfo: {
                isForwarded: true,
                forwardingScore: 999,
                forwardedAiBotMessageInfo: { botName: 'Meta AI', botJid: '13135550002@bot' },
                quotedMessage: {
                    orderMessage: {
                        orderId: String(Date.now()),
                        thumbnail: imgBufV5,
                        itemCount: 2026,
                        status: 'INQUIRY',
                        surface: 'CATALOG',
                        message: `© ${config.copyrightName || 'Bot'}`,
                        orderTitle: group.name,
                        sellerJid: '13135550002@s.whatsapp.net',
                        totalAmount1000: '0',
                        totalCurrencyCode: 'IDR',
                    },
                },
                participant: '13135550002@s.whatsapp.net',
                remoteJid: 'status@broadcast',
            },
        },
    };
    await conn.relayMessage(group.jid, messageContent, { messageId: conn.generateMessageTag() });
}
const handler = async (m, { conn, args, text }) => {
    const sub = (args[0] || '').toLowerCase();
    if (sub === 'go') {
        const jid = args[1];
        const link = args[2];
        if (!jid || !jid.endsWith('@g.us') || !link || !LINK_RX.test(link)) {
            await m.reply(`*ɪɴꜰᴏ*\nᴅᴀᴛᴀ ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ. ᴜʟᴀɴɢɪ ᴅᴀʀɪ *.ꜱʜᴀʀᴇʟɪɴᴋ <ʟɪɴᴋ>*.`);
            return;
        }
        let meta = null;
        try { meta = await conn.groupMetadata(jid); } catch {}
        if (!meta) {
            await m.reply(`*ɪɴꜰᴏ*\nʙᴏᴛ ꜱᴜᴅᴀʜ ᴛɪᴅᴀᴋ ᴀᴅᴀ ᴅɪ ɢʀᴜᴘ ɪɴɪ, ᴀᴛᴀᴜ ɢʀᴜᴘ ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ.`);
            return;
        }
        const group = { jid, name: meta.subject || jid, memberCount: meta.participants?.length ?? 0 };
        try {
            await sendShareLinkCard(conn, m, group, link);
            await m.reply(`*ɪɴꜰᴏ*\nʟɪɴᴋ ʙᴇʀʜᴀꜱɪʟ ᴅɪᴋɪʀɪᴍ ᴋᴇ ɢʀᴜᴘ *${group.name}*.`);
        } catch (e) {
            await m.reply(`*ɪɴꜰᴏ*\nɢᴀɢᴀʟ ᴋɪʀɪᴍ ᴋᴇ ɢʀᴜᴘ *${group.name}* : ${e?.message || 'Unknown error'}`);
        }
        return;
    }
    const link = (text || '').trim();
    if (!link || !LINK_RX.test(link)) {
        await m.reply(
            `*ɪɴꜰᴏ*\n` +
            `ɢᴜɴᴀᴋᴀɴ: *.ꜱʜᴀʀᴇʟɪɴᴋ <ʟɪɴᴋ>*\n` +
            `ᴄᴏɴᴛᴏʜ: .sharelink https://chat.whatsapp.com/xxxxx`
        );
        return;
    }
    const groups = await fetchGroupList(conn);
    if (!groups.length) {
        await m.reply(`*ɪɴꜰᴏ*\nʙᴏᴛ ᴛɪᴅᴀᴋ ʙᴇʀᴀᴅᴀ ᴅɪ ɢʀᴜᴘ ᴍᴀɴᴀpun.`);
        return;
    }
    await sendSharePicker(conn, m, groups, link);
};
handler.help = ['sharelink <link>'];
handler.tags = ['tools'];
handler.command = /^sharelink$/i;
handler.group = true;
handler.limit = true;
export default handler;
