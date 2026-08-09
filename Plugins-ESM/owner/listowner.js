'use strict';
import config from '../../config.js';
import { buildFkontak } from '../../Library/utils.js';
import { getOwnerStyle } from '../../System/ownerstyle.js';
import { getExtraOwners } from '../../System/ownerlist.js';
function buildVcard(name, number) {
    const safeName = String(name).replace(/[\r\n]/g, ' ').trim() || number;
    return (
        `BEGIN:VCARD\n` +
        `VERSION:3.0\n` +
        `N:${safeName}\n` +
        `FN:${safeName}\n` +
        `TEL;type=CELL;type=VOICE;waid=${number}:${number}\n` +
        `END:VCARD`
    );
}
function getCountryInfo(num) {
    if (num.startsWith('62'))
        return { flag: '', name: 'Indonesia', flagPair: 'Indonesia' };
    if (num.startsWith('1') && num.length >= 11)
        return { flag: '', name: 'Canada/US', flagPair: 'Canada/US' };
    if (num.startsWith('44'))
        return { flag: '', name: 'United Kingdom', flagPair: 'United Kingdom' };
    if (num.startsWith('60'))
        return { flag: '', name: 'Malaysia', flagPair: 'Malaysia' };
    if (num.startsWith('65'))
        return { flag: '', name: 'Singapore', flagPair: 'Singapore' };
    if (num.startsWith('63'))
        return { flag: '', name: 'Philippines', flagPair: 'Philippines' };
    if (num.startsWith('84'))
        return { flag: '', name: 'Vietnam', flagPair: 'Vietnam' };
    if (num.startsWith('66'))
        return { flag: '', name: 'Thailand', flagPair: 'Thailand' };
    return { flag: '', name: 'International', flagPair: 'International' };
}
function formatPhone(num) {
    if (num.startsWith('62')) {
        const r = num.slice(2);
        return `+62 ${r.slice(0, 3)}-${r.slice(3, 7)}-${r.slice(7)}`;
    }
    if (num.startsWith('1') && num.length === 11) {
        return `+1 ${num.slice(1, 4)}-${num.slice(4, 7)}-${num.slice(7)}`;
    }
    return `+${num}`;
}
function collectOwnerNumbers() {
    const mainOwnerNumber = String(config.mainOwner || '').replace(/\D/g, '');
    const additionalOwners = [
        ...(Array.isArray(config.owners) ? config.owners : []),
        ...getExtraOwners(),
    ];
    const seen = new Set();
    const allNums = [];
    if (mainOwnerNumber) {
        allNums.push(mainOwnerNumber);
        seen.add(mainOwnerNumber);
    }
    for (const n of additionalOwners) {
        const clean = String(n).replace(/\D/g, '');
        if (clean && !seen.has(clean)) {
            allNums.push(clean);
            seen.add(clean);
        }
    }
    return { mainOwnerNumber, allNums };
}
async function sendOwnerV1(m, conn, mainOwnerNumber, allNums) {
    const mainOwnerName = config.ownerName
        ? `${config.ownerName} (Main Owner)`
        : `${config.botName || 'Bot'} — Main Owner`;
    const contacts = allNums.map((num) => {
        const isMain = num === mainOwnerNumber;
        const name = isMain ? mainOwnerName : `Owner ${allNums.indexOf(num)}`;
        return { displayName: name, vcard: buildVcard(name, num) };
    });
    const displayName = contacts.length > 1
        ? `${contacts.length} Owner ${String(config.botName || 'Bot')}`
        : contacts[0].displayName;
    const fkontak = await buildFkontak(conn, config);
    const contextInfo = {
        quotedMessage: fkontak.message,
        participant: fkontak.key.participant,
        stanzaId: fkontak.key.id,
        remoteJid: fkontak.key.remoteJid,
    };
    const messageContent = contacts.length > 1
        ? { contactsArrayMessage: { displayName, contacts, contextInfo } }
        : { contactMessage: { displayName, vcard: contacts[0].vcard, contextInfo } };
    try {
        const { generateWAMessageFromContent } = await import('@itsliaaa/baileys');
        const generated = generateWAMessageFromContent(m.chat, messageContent, { userJid: conn.user?.id ?? '' });
        await conn.relayMessage(m.chat, generated.message, { messageId: generated.key.id });
    }
    catch (_err) {
        await conn.sendMessage(m.chat, { contacts: { displayName, contacts } }, { quoted: m.raw });
    }
}
async function sendOwnerV2(m, conn, mainOwnerNumber, allNums) {
    const now = new Date();
    const end = new Date(now.getTime() + 10 * 60000);
    const tagLines = allNums.map((num) => `      ◦ @${num}`).join('\n');
    const mentionedJid = allNums.map((num) => `${num}@s.whatsapp.net`);
    const buttons = allNums.map((num, i) => {
        const isMain = num === mainOwnerNumber;
        const country = getCountryInfo(num);
        const phone = formatPhone(num);
        const name = isMain ? (config.ownerName || 'Main Owner') : `Owner ${i}`;
        const status = isMain ? `_Real Owner_` : `_Owner_`;
        if (isMain) {
            return {
                name: 'booking_confirmation',
                buttonParamsJson: JSON.stringify({
                    start_datetime: now.toISOString(),
                    end_datetime: end.toISOString(),
                    location: country.flagPair,
                    booking_url: `https://wa.me/${num}`,
                    phone_number: num,
                    booking_management_url: `https://wa.me/${num}`,
                    description:
                        `*◦  Name  :*  ${name}\n` +
                        `*◦  Number  :*  ${phone}\n` +
                        `*◦  Bio  :*  \n` +
                        `*◦  Status  :*  ${status}\n` +
                        `*◦ ${country.flag} Country  :*  ${country.name}\n`,
                    email: '',
                    display_text: ` ᴍᴀɪɴ ᴏᴡɴᴇʀ`,
                    display_content: {
                        display_language: 'id',
                        display_meeting_type: 'ɪɴꜰᴏʀᴍᴀᴛɪᴏɴ',
                        display_bottom_sheet_header: '々   P R O F I L E     ◦     I N F O   々',
                        display_add_to_calendar_cta_text: 'CALENDAR',
                        display_view_on_maps_cta_text: 'O W N E R     ◦     C O U N T R Y',
                        display_manage_booking_cta_text: 'Follow for More',
                        display_manage_booking_not_supported_text: 'OWNER NOT REGISTERED',
                        display_read_more: 'READ MORE',
                    },
                }),
            };
        }
        return {
            name: 'cta_url',
            buttonParamsJson: JSON.stringify({
                display_text: ` Owner ${i}`,
                url: `https://wa.me/${num}`,
                merchant_url: `https://wa.me/${num}`,
            }),
        };
    });
    const fkontak = await buildFkontak(conn, config);
    const messageContent = {
        interactiveMessage: {
            header: {
                title: '𝗢 𝗪 𝗡 𝗘 𝗥   ◦   𝗜 𝗡 𝗙 𝗢',
                hasMediaAttachment: false,
            },
            body: {
                text:
                    `*乂  𝗢 𝗪 𝗡 𝗘 𝗥     ◦     𝗜 𝗡 𝗙 𝗢*\n` +
                    ` Tag : \n` +
                    tagLines,
            },
            footer: {
                text: `${config.botName || 'Bot'} • Owner Info`,
            },
            nativeFlowMessage: {
                messageParamsJson: '{}',
                buttons,
            },
            contextInfo: {
                mentionedJid,
                quotedMessage: fkontak.message,
                participant: fkontak.key.participant,
                stanzaId: fkontak.key.id,
                remoteJid: fkontak.key.remoteJid,
            },
        },
    };
    try {
        const { generateWAMessageFromContent } = await import('@itsliaaa/baileys');
        const generated = generateWAMessageFromContent(
            m.chat,
            messageContent,
            { userJid: mainOwnerNumber ? `${mainOwnerNumber}@s.whatsapp.net` : (conn.user?.id ?? '') }
        );
        await conn.relayMessage(m.chat, generated.message, { messageId: generated.key.id });
    }
    catch (_err) {
        await sendOwnerV1(m, conn, mainOwnerNumber, allNums);
    }
}
const handler = async (m, { conn }) => {
    const { mainOwnerNumber, allNums } = collectOwnerNumbers();
    if (!mainOwnerNumber) {
        return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴍᴀɪɴ ᴏᴡɴᴇʀ ʙᴇʟᴜᴍ ᴅɪᴀᴛᴜʀ ᴅɪ ᴄᴏɴꜰɪɢ.ᴊꜱ\n╰┈┈┈┈┈┈┈┈⬡`);
    }
    const style = getOwnerStyle();
    if (style === 'v2') {
        await sendOwnerV2(m, conn, mainOwnerNumber, allNums);
    }
    else {
        await sendOwnerV1(m, conn, mainOwnerNumber, allNums);
    }
};
handler.help = ['listowner', 'owner', 'daftarowner'];
handler.tags = ['owner'];
handler.command = /^(listowner|listowners|owner|daftarowner)$/i;
handler.limit = true;
export default handler;
