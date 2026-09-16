//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import axios from 'axios';
import sharp from 'sharp';
import crypto from 'crypto';
import * as baileys from '@itsliaaa/baileys';
import config from '../../config.js';
import pluginManager from '../_pluginmanager.js';
import { loadConfigImage, buildFkontak, buildForwardContext } from '../../Library/utils.js';
import { ButtonV2, Toolkit } from '../../Library/MessageBuilder.js';
import { getMenuStyle } from '../../System/menustyle.js';
import { A2UI } from '../../Library/A2UI.js';
import { getProcessUptime } from '../../Library/system.js';
import { isSelfMode } from '../../System/selfmode.js';
import { checkPremiumUser } from '../../Core/permissions.js';
import db from '../../Database/db.js';
const OWNER_WA = `https://wa.me/${config.mainOwner}`;
const OWNER_CALL_NUMBER = `+${config.pairingNumber || config.mainOwner}`;
const CATEGORY_META = {
    ai: { emoji: '', title: 'ᴀɪ ᴍᴇɴᴜ' },
    downloader: { emoji: '', title: 'ᴅᴏᴡɴʟᴏᴀᴅᴇʀ' },
    sticker: { emoji: '', title: 'ꜱᴛɪᴄᴋᴇʀ' },
    maker: { emoji: '', title: 'ᴍᴀᴋᴇʀ' },
    tools: { emoji: '', title: 'ᴛᴏᴏʟꜱ' },
    games: { emoji: '', title: 'ɢᴀᴍᴇ & ʀᴘɢ' },
    nsfw: { emoji: '', title: 'ɴꜱꜰᴡ' },
    info: { emoji: '', title: 'ɪɴꜰᴏ' },
    admin: { emoji: '', title: 'ᴀᴅᴍɪɴ' },
    owner: { emoji: '', title: 'ᴏᴡɴᴇʀ' },
};
const CATEGORY_ORDER = ['ai', 'downloader', 'sticker', 'maker', 'tools', 'games', 'nsfw', 'info', 'admin', 'owner'];
function slugCat(tag) {
    const t = String(tag || 'lainnya').toLowerCase();
    if (t === 'group') return 'admin';
    return t;
}
const SMALLCAPS_MAP = {
    a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ꜰ', g: 'ɢ', h: 'ʜ', i: 'ɪ', j: 'ᴊ',
    k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'q', r: 'ʀ', s: 'ꜱ', t: 'ᴛ',
    u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ',
};
function toSmallCaps(text) {
    return String(text).replace(/[a-zA-Z]/g, (ch) => SMALLCAPS_MAP[ch.toLowerCase()] || ch);
}
function stripStars(text) {
    return String(text).replace(/┃\s*✧\s*/g, '┃ ').replace(/✧\s*/g, '');
}
function bareCommandNames(plugin) {
    const help = Array.isArray(plugin.help) ? plugin.help : [];
    const names = [];
    for (const raw of help) {
        const first = String(raw || '').trim().split(/\s+/)[0];
        if (first && !names.includes(first)) names.push(first);
    }
    if (names.length) return names;
    const src = plugin.command instanceof RegExp ? plugin.command.source : '';
    const m = src.match(/[a-zA-Z0-9_]+/);
    return [m ? m[0] : '(tanpa nama)'];
}
function accessLetter(plugin) {
    if (plugin.premium) return 'Ⓟ';
    if (plugin.mainOwner || plugin.owner) return 'Ⓞ';
    if (plugin.admin) return 'Ⓐ';
    return 'Ⓛ';
}
function buildMenuLists() {
    const grouped = {};
    for (const plugin of pluginManager.getAllPlugins()) {
        const cat = slugCat(plugin.tags?.[0]);
        grouped[cat] ??= [];
        const letter = accessLetter(plugin);
        for (const rawName of bareCommandNames(plugin)) {
            const name = toSmallCaps(rawName);
            grouped[cat].push({ name, letter, label: letter ? `${name} ${letter}` : name });
        }
    }
    const lists = {};
    const orderedKeys = [...CATEGORY_ORDER, ...Object.keys(grouped).filter((k) => !CATEGORY_ORDER.includes(k))];
    for (const key of orderedKeys) {
        if (!grouped[key]) continue;
        const meta = CATEGORY_META[key] || { emoji: '', title: key.toUpperCase() };
        const commands = grouped[key].sort((a, b) => a.name.localeCompare(b.name)).map((c) => c.label);
        lists[key] = { emoji: meta.emoji, title: meta.title, commands };
    }
    return lists;
}
function getGreeting() {
    const h = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta', hour: 'numeric', hour12: false });
    const hour = parseInt(h, 10);
    if (hour < 5) return ' Selamat Malam';
    if (hour < 11) return ' Selamat Pagi';
    if (hour < 15) return ' Selamat Siang';
    if (hour < 18) return ' Selamat Sore';
    return ' Selamat Malam';
}
function buildMenuBody(menuLists) {
    let txt = `╭┈┈⬡「 *ᴅᴀꜰᴛᴀʀ ᴍᴇɴᴜ* 」\n`;
    for (const d of Object.values(menuLists)) txt += `┃ ✧ ${d.title}\n`;
    txt += `╰┈┈┈┈┈┈┈┈⬡`;
    return txt;
}
function buildCategoryBody(data) {
    let txt = `╭┈┈⬡「 *${data.title}* 」\n`;
    for (const cmd of data.commands) txt += `┃ ✧ ${cmd}\n`;
    txt += `╰┈┈┈┈┈┈┈┈⬡`;
    return txt;
}
function buildFullMenuBody(menuLists, pushname, senderJid, isOwn, isPrem, groupJid) {
    const uptime = getProcessUptime();
    const mode = isSelfMode(groupJid) ? 'ꜱᴇʟꜰ' : 'ᴘᴜʙʟɪᴄ';
    let totalCommands = 0;
    Object.values(menuLists).forEach((d) => (totalCommands += d.commands.length));
    let akses = ' ᴜꜱᴇʀ';
    let limit = '-';
    let daftar = ' ʙᴇʟᴜᴍ';
    try {
        const isReg = db.isRegistered(senderJid);
        if (isOwn) {
            akses = ' ᴏᴡɴᴇʀ';
            limit = ' ᴜɴʟɪᴍɪᴛᴇᴅ';
            daftar = isReg ? ' ꜱᴜᴅᴀʜ' : ' ʙᴇʟᴜᴍ';
        } else if (isReg) {
            akses = isPrem ? ' ᴘʀᴇᴍɪᴜᴍ' : ' ᴜꜱᴇʀ';
            limit = isPrem ? '∞' : `${config.defaultUsageLimit}/hari`;
            daftar = ' ꜱᴜᴅᴀʜ';
        }
    } catch {  }
    let txt = `${getGreeting()}, *${pushname}!*\n\n`;
    txt += `╭┈┈⬡「 *ɪɴꜰᴏ ʙᴏᴛ* 」\n`;
    txt += `┃ ✧ ɴᴀᴍᴇ     : ${config.botName}\n`;
    txt += `┃ ✧ ᴠᴇʀꜱɪᴏɴ  : ${config.botVersion}\n`;
    txt += `┃ ✧ ᴜᴘᴛɪᴍᴇ   : ${uptime}\n`;
    txt += `┃ ✧ ©       : ${toSmallCaps(config.copyrightName)}\n`;
    txt += `┃ ✧ ᴍᴏᴅᴇ     : ${mode}\n`;
    txt += `┃ ✧ ᴄᴏᴍᴍᴀɴᴅꜱ : ${totalCommands}\n`;
    txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`;
    txt += `╭┈┈⬡「 *ɪɴꜰᴏ ᴜꜱᴇʀ* 」\n`;
    txt += `┃ ✧ ɴᴀᴍᴀ   : ${pushname}\n`;
    txt += `┃ ✧ ᴀᴋꜱᴇꜱ  : ${akses}\n`;
    txt += `┃ ✧ ʟɪᴍɪᴛ  : ${limit}\n`;
    txt += `┃ ✧ ᴅᴀꜰᴛᴀʀ : ${daftar}\n`;
    txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`;
    txt += `╭┈┈⬡「 *ᴅᴀꜰᴛᴀʀ ᴍᴇɴᴜ* 」\n`;
    for (const key of Object.keys(menuLists)) {
        txt += `┃ ✧ ${toSmallCaps(`menu ${key}`)}\n`;
    }
    txt += `╰┈┈┈┈┈┈┈┈⬡`;
    return txt.trim();
}
function stripCopyrightLine(text) {
    return text
        .split('\n')
        .filter((line) => !line.includes('©'))
        .join('\n');
}
async function buildOrderQuote({ thumbnailUrl, title, orderTitle }) {
    let thumbBuf = Buffer.alloc(0);
    try {
        const res = await axios.get(thumbnailUrl, { responseType: 'arraybuffer', timeout: 15000 });
        thumbBuf = await sharp(Buffer.from(res.data))
            .trim()
            .resize(300, 300, { fit: 'cover', position: 'center' })
            .jpeg({ quality: 80 })
            .toBuffer();
    }
    catch (e) {
    }
    return {
        participant: '0@s.whatsapp.net',
        remoteJid: 'status@broadcast',
        quotedMessage: {
            orderMessage: {
                orderId: String(Date.now()),
                thumbnail: thumbBuf,
                itemCount: 2026,
                status: 0,
                surface: 0,
                message: title,
                orderTitle,
                sellerJid: '0@s.whatsapp.net',
                totalAmount1000: '0',
                totalCurrencyCode: 'IDR',
            },
        },
    };
}
function buildSectionsV1Style(menuLists) {
    return [
        {
            title: toSmallCaps('KATEGORI UTAMA'),
            rows: Object.entries(menuLists).map(([key, data]) => ({
                title: `${data.emoji} ${data.title}`,
                description: toSmallCaps(`${data.commands.length} command`),
                id: `.menu_${key}`,
            })),
        },
    ];
}
async function sendMenuV1Style(conn, jid, imgBuf, bodyText, fkontak, ctx, menuLists) {
    const media = await baileys.prepareWAMessageMedia({ image: imgBuf }, { upload: conn.waUploadToServer });
    const imgMsg = media?.imageMessage;
    await conn.relayMessage(
        jid,
        {
            interactiveMessage: {
                header: { hasMediaAttachment: true, imageMessage: imgMsg },
                body: { text: '' },
                footer: { text: `${bodyText}\nPowered by ${config.botName} ` },
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: ctx?.forwardedNewsletterMessageInfo,
                    forwardedAiBotMessageInfo: { botName: 'Meta AI', botJid: '13135550002@bot' },
                    participant: '0@s.whatsapp.net',
                    remoteJid: 'status@broadcast',
                    quotedMessage: fkontak?.message,
                },
                nativeFlowMessage: {
                    buttons: [
                        {
                            name: 'single_select',
                            buttonParamsJson: JSON.stringify({ title: toSmallCaps('PILIH MENU'), sections: buildSectionsV1Style(menuLists) }),
                        },
                        { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Beli Sekarang', id: '.sc' }) },
                        { name: 'cta_call', buttonParamsJson: JSON.stringify({ display_text: 'Telepon Sekarang', phone_number: OWNER_CALL_NUMBER }) },
                        { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'Owner', url: OWNER_WA, merchant_url: OWNER_WA }) },
                    ],
                },
            },
        },
        { messageId: conn.generateMessageTag() }
    );
}
function buildSectionsV2Style(menuLists) {
    return [
        {
            title: '',
            rows: Object.entries(menuLists).map(([key]) => ({
                title: toSmallCaps(key),
                id: `.menu_${key}`,
            })),
        },
    ];
}
async function resolveThumbnail(conn, senderJid) {
    try {
        const url = await conn.profilePictureUrl(senderJid, 'image');
        if (url) return url;
    } catch { }
    return config.buttonv2Img;
}
async function sendMenuV2Style(conn, m, bodyText, senderJid, menuLists) {
    const thumbnail = await resolveThumbnail(conn, senderJid);
    const btn = new ButtonV2(conn)
        .setTitle(config.botName || 'Bot')
        .setSubtitle(config.botVersion || '')
        .setBody('-')
        .setFooter(bodyText)
        .addRawButton({
            buttonId: 'menu',
            buttonText: { displayText: '☱ List Menu' },
            type: 1,
            nativeFlowInfo: {
                name: 'single_select',
                paramsJson: JSON.stringify({
                    title: 'Pilih Kategori',
                    sections: buildSectionsV2Style(menuLists),
                }),
            },
        });
    if (thumbnail) btn.setThumbnail(thumbnail);
    const msg = await btn.build(m.chat, { userJid: conn.user?.id });
    await conn.relayMessage(m.chat, msg.message, {
        messageId: msg.key.id,
        additionalNodes: [
            {
                tag: 'biz',
                attrs: {},
                content: [
                    {
                        tag: 'interactive',
                        attrs: { type: 'native_flow', v: '1' },
                        content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }],
                    },
                ],
            },
        ],
    });
}
function buildSectionsV3Menu(menuLists) {
    return [
        {
            title: toSmallCaps('kategori'),
            highlight_label: toSmallCaps(`${config.botName} menu`),
            rows: Object.entries(menuLists).map(([key, data]) => ({
                title: toSmallCaps(key.charAt(0).toUpperCase() + key.slice(1)),
                description: toSmallCaps(`${data.commands.length} command`),
                id: `.menu_${key}`,
            })),
        },
    ];
}
function buildSectionsV3Info() {
    return [
        {
            title: toSmallCaps('informasi'),
            highlight_label: toSmallCaps('informasi'),
            rows: [
                { title: toSmallCaps('Ping'), id: '.ping' },
                { title: toSmallCaps('Owner'), id: '.menu_owner' },
            ],
        },
    ];
}
async function sendMenuV3Style(conn, m, bodyText, senderJid, menuLists) {
    const imgBuf = await loadConfigImage(config.menuImage);
    const jpegThumbnail = await sharp(imgBuf)
        .resize(300, 300, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
        .jpeg({ quality: 90 })
        .toBuffer()
        .catch(() => imgBuf);
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
                footer: { text: bodyText },
                nativeFlowMessage: {
                    messageParamsJson: JSON.stringify({
                        limited_time_offer: {
                            text: '',
                            url: OWNER_WA,
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
                                title: toSmallCaps('menu'),
                                sections: buildSectionsV3Menu(menuLists),
                            }),
                        },
                        {
                            name: 'quick_reply',
                            buttonParamsJson: JSON.stringify({ display_text: toSmallCaps('donasi'), id: '.donasi' }),
                        },
                    ],
                },
            },
        },
        { messageId: conn.generateMessageTag() }
    );
}
async function sendMenuV4Style(conn, m, bodyText, senderJid, menuLists) {
    const bigImageUrl = config.menuImage;
    const smallThumbUrl = config.thumbnail || config.menuImage;
    const imgBuf = await loadConfigImage(bigImageUrl);
    const orderQuote = await buildOrderQuote({
        thumbnailUrl: smallThumbUrl,
        title: `© ${toSmallCaps(config.copyrightName)}`,
        orderTitle: '',
    });
    let imgMsg;
    if (imgBuf?.length) {
        const media = await baileys.prepareWAMessageMedia({ image: imgBuf }, { upload: conn.waUploadToServer });
        imgMsg = media?.imageMessage;
    }
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 0, 0);
    await conn.relayMessage(
        m.chat,
        {
            interactiveMessage: {
                header: { hasMediaAttachment: !!imgMsg, imageMessage: imgMsg },
                body: { text: '' },
                footer: { text: bodyText },
                contextInfo: {
                    forwardingScore: 0,
                    isForwarded: false,
                    participant: orderQuote.participant,
                    remoteJid: orderQuote.remoteJid,
                    quotedMessage: orderQuote.quotedMessage,
                },
                nativeFlowMessage: {
                    messageParamsJson: JSON.stringify({
                        limited_time_offer: {
                            text: '',
                            url: OWNER_WA,
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
                                title: toSmallCaps('menu'),
                                sections: buildSectionsV3Menu(menuLists),
                            }),
                        },
                        {
                            name: 'single_select',
                            buttonParamsJson: JSON.stringify({
                                icon: 'REVIEW',
                                title: toSmallCaps('info'),
                                sections: buildSectionsV3Info(),
                            }),
                        },
                    ],
                },
            },
        },
        { messageId: conn.generateMessageTag() }
    );
}
function buildA2UIMenuCard(bodyText) {
    const a2ui = new A2UI();
    const bodyId = a2ui.text(bodyText, { variant: 'body' });
    const colId = a2ui.column([bodyId]);
    const cardId = a2ui.card(colId);
    a2ui.root([cardId]);
    return a2ui;
}
function stripMarkdownStars(text) {
    return String(text).replace(/\*/g, '');
}
async function sendMenuV5Style(conn, m, bodyText, senderJid, menuLists) {
    const cleanBody = stripMarkdownStars(stripStars(bodyText));
    const a2ui = buildA2UIMenuCard(cleanBody);
    const imgBuf = await loadConfigImage(config.menuImage);
    let imgMsg;
    if (imgBuf?.length) {
        const media = await baileys.prepareWAMessageMedia({ image: imgBuf }, { upload: conn.waUploadToServer });
        imgMsg = media?.imageMessage;
    }
    let badgeThumb;
    try {
        const rawThumb = await loadConfigImage(config.thumbnail);
        badgeThumb = await sharp(rawThumb).resize(300, 300, { fit: 'inside' }).jpeg({ quality: 70 }).toBuffer();
    } catch { badgeThumb = imgBuf; }
    await conn.relayMessage(
        m.chat,
        {
            messageContextInfo: { messageSecret: crypto.randomBytes(32) },
            interactiveMessage: {
                header: { hasMediaAttachment: !!imgMsg, imageMessage: imgMsg },
                body: { text: '' },
                footer: { text: '' },
                bloksWidget: a2ui.build(),
                contextInfo: {
                    quotedMessage: {
                        orderMessage: {
                            orderId: String(Date.now()),
                            thumbnail: badgeThumb,
                            itemCount: 2026,
                            status: 'INQUIRY',
                            surface: 'CATALOG',
                            message: `© ${config.copyrightName || config.botName || 'Bot'}`,
                            orderTitle: config.botName || 'Bot',
                            sellerJid: '13135550002@s.whatsapp.net',
                            totalAmount1000: '0',
                            totalCurrencyCode: 'IDR',
                        },
                    },
                    participant: '13135550002@s.whatsapp.net',
                    remoteJid: 'status@broadcast',
                },
                nativeFlowMessage: {
                    buttons: [
                        { name: '' },
                        {
                            name: 'single_select',
                            buttonParamsJson: JSON.stringify({
                                title: '\u0000',
                                sections: buildSectionsV3Menu(menuLists),
                                icon: 'DEFAULT',
                            }),
                        },
                        {
                            name: 'single_select',
                            buttonParamsJson: JSON.stringify({
                                title: '\u0000',
                                sections: buildSectionsV3Info(),
                                icon: 'REVIEW',
                            }),
                        },
                        {
                            name: 'cta_url',
                            buttonParamsJson: JSON.stringify({
                                display_text: '\u0000',
                                url: OWNER_WA,
                                merchant_url: OWNER_WA,
                                icon: 'CALL',
                            }),
                        },
                    ],
                    messageParamsJson: '{}',
                },
            },
        },
        { messageId: conn.generateMessageTag() }
    );
}
function stripDaftarMenuBlock(text) {
    return String(text)
        .replace(/╭┈┈⬡「\s*\*?ᴅᴀꜰᴛᴀʀ ᴍᴇɴᴜ\*?\s*」[\s\S]*?╰┈┈┈┈┈┈┈┈⬡/, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
function buildA2UIMenuCardV6(infoText, helloText, buttonLabel, buttonUrl) {
    const a2ui = new A2UI();
    const infoTextId = a2ui.text(infoText, { variant: 'body' });
    const infoColId = a2ui.column([infoTextId]);
    const infoCardId = a2ui.card(infoColId);
    const helloDivId = a2ui.divider();
    const helloTextId = a2ui.text(helloText, { variant: 'body' });
    const helloColId = a2ui.column([helloDivId, helloTextId]);
    const helloCardId = a2ui.card(helloColId);
    const btnLabelId = a2ui.text(buttonLabel, { variant: 'body' });
    const btnId = a2ui.button(btnLabelId, {
        variant: 'primary',
        action: { call: 'openUrl', args: { url: buttonUrl } },
    });
    a2ui.root([infoCardId, helloCardId, btnId]);
    return a2ui;
}
async function sendMenuV6Style(conn, m, bodyText, senderJid, menuLists, pushname) {
    const cleanBody = stripMarkdownStars(stripStars(stripDaftarMenuBlock(bodyText)));
    const helloText = `Halo, ${pushname || 'kak'}. Saya adalah morela sebuah bot asisten WhatsApp. Apakah ada yang bisa saya bantu? Silakan tekan tombol untuk menampilkan halaman menu berikutnya.`;
    const a2ui = buildA2UIMenuCardV6(
        cleanBody,
        helloText,
        toSmallCaps('owner'),
        OWNER_WA,
    );
    let jpegThumbnail;
    try {
        const rawThumb = await loadConfigImage(config.menuImage);
        jpegThumbnail = await sharp(rawThumb).resize(300, 300, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } }).jpeg({ quality: 80 }).toBuffer();
    } catch {
        jpegThumbnail = Buffer.alloc(0);
    }
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 0, 0);
    const contextInfo = {
        forwardingScore: 0,
        isForwarded: false,
    };
    if (senderJid) contextInfo.mentionedJid = [senderJid];
    await conn.relayMessage(
        m.chat,
        {
            messageContextInfo: { messageSecret: crypto.randomBytes(32) },
            interactiveMessage: {
                header: {
                    hasMediaAttachment: true,
                    locationMessage: {
                        degreesLatitude: 0,
                        degreesLongitude: 0,
                        name: '',
                        address: '',
                        jpegThumbnail,
                    },
                },
                body: { text: '\u0000' },
                footer: { text: config.botName || 'Bot' },
                nativeFlowMessage: {
                    messageParamsJson: JSON.stringify({
                        limited_time_offer: {
                            text: '',
                            url: OWNER_WA,
                            copy_code: config.botName || 'BOT',
                            expiration_time: endOfDay.getTime(),
                        },
                    }),
                    buttons: [
                        { name: '' },
                        {
                            name: 'single_select',
                            buttonParamsJson: JSON.stringify({
                                title: '\u0000',
                                sections: buildSectionsV3Menu(menuLists),
                                icon: 'DEFAULT',
                            }),
                        },
                        {
                            name: 'single_select',
                            buttonParamsJson: JSON.stringify({
                                title: '\u0000',
                                sections: buildSectionsV3Info(),
                                icon: 'REVIEW',
                            }),
                        },
                        {
                            name: 'cta_url',
                            buttonParamsJson: JSON.stringify({
                                display_text: '\u0000',
                                url: OWNER_WA,
                                merchant_url: OWNER_WA,
                                icon: 'PROMOTION',
                            }),
                        },
                    ],
                },
                bloksWidget: a2ui.build(),
                contextInfo,
            },
        },
        { messageId: conn.generateMessageTag() }
    );
}
const handler = async (m, { conn, command, args, isOwner }) => {
    try {
        const menuLists = buildMenuLists();
        const pushname = String(m.pushName || 'User');
        const senderJid = m.senderPn || m.sender;
        const isOwn = !!isOwner;
        const isPrem = checkPremiumUser(senderJid);
        const imgBuf = await loadConfigImage(config.menuImage);
        const fkontak = await buildFkontak(conn, config);
        const ctx = buildForwardContext(config);
        const cat = command.startsWith('menu_')
            ? command.replace('menu_', '')
            : (command === 'menu' && args?.[0] ? args[0].toLowerCase() : null);
        if (cat) {
            const data = menuLists[cat];
            if (!data) return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴋᴀᴛᴇɢᴏʀɪ "${cat}" ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ\n╰┈┈┈┈┈┈┈┈⬡`);
            const body = buildCategoryBody(data);
            if (getMenuStyle() === 'v6') {
                return sendMenuV6Style(conn, m, body, senderJid, menuLists, pushname);
            }
            if (getMenuStyle() === 'v5') {
                return sendMenuV5Style(conn, m, body, senderJid, menuLists);
            }
            if (getMenuStyle() === 'v4') {
                return sendMenuV4Style(conn, m, body, senderJid, menuLists);
            }
            if (getMenuStyle() === 'v3') {
                return sendMenuV3Style(conn, m, body, senderJid, menuLists);
            }
            if (getMenuStyle() === 'v2') {
                return sendMenuV2Style(conn, m, body, senderJid, menuLists);
            }
            return sendMenuV1Style(conn, m.chat, imgBuf, body, fkontak, ctx, menuLists);
        }
        const body = buildFullMenuBody(menuLists, pushname, senderJid, isOwn, isPrem, m.isGroup ? m.chat : null);
        if (getMenuStyle() === 'v6') {
            return sendMenuV6Style(conn, m, stripCopyrightLine(body), senderJid, menuLists, pushname);
        }
        if (getMenuStyle() === 'v5') {
            return sendMenuV5Style(conn, m, stripCopyrightLine(body), senderJid, menuLists);
        }
        if (getMenuStyle() === 'v4') {
            return sendMenuV4Style(conn, m, stripCopyrightLine(body), senderJid, menuLists);
        }
        if (getMenuStyle() === 'v3') {
            return sendMenuV3Style(conn, m, stripCopyrightLine(body), senderJid, menuLists);
        }
        if (getMenuStyle() === 'v2') {
            return sendMenuV2Style(conn, m, stripCopyrightLine(body), senderJid, menuLists);
        }
        await sendMenuV1Style(conn, m.chat, imgBuf, stripCopyrightLine(body), fkontak, ctx, menuLists);
    } catch (e) {
        await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴇʀʀᴏʀ: ${e.message}\n╰┈┈┈┈┈┈┈┈⬡`);
    }
};
handler.help = ['menu'];
handler.tags = ['info'];
handler.noLimit = true;
handler.command = /^(menu|help|menu_ai|menu_downloader|menu_sticker|menu_maker|menu_tools|menu_games|menu_info|menu_admin|menu_owner|menu_nsfw)$/i;
export default handler;
