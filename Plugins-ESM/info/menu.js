'use strict';
import * as baileys from '@itsliaaa/baileys';
import config from '../../config.js';
import pluginManager from '../_pluginmanager.js';
import { loadConfigImage, buildFkontak, buildForwardContext } from '../../Library/utils.js';
import { ButtonV2 } from '../../Library/MessageBuilder.js';
import { getMenuStyle } from '../../System/menustyle.js';
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
    info: { emoji: '', title: 'ɪɴꜰᴏ' },
    admin: { emoji: '', title: 'ᴀᴅᴍɪɴ' },
    owner: { emoji: '', title: 'ᴏᴡɴᴇʀ' },
};
const CATEGORY_ORDER = ['ai', 'downloader', 'sticker', 'maker', 'tools', 'games', 'info', 'admin', 'owner'];
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
function bareCommandName(plugin) {
    const raw = plugin.help?.[0] || '';
    const first = raw.trim().split(/\s+/)[0];
    if (first) return first;
    const src = plugin.command instanceof RegExp ? plugin.command.source : '';
    const m = src.match(/[a-zA-Z0-9_]+/);
    return m ? m[0] : '(tanpa nama)';
}
function accessLetter(plugin) {
    if (plugin.premium) return 'Ⓟ';
    if (plugin.mainOwner || plugin.owner) return 'Ⓞ';
    if (plugin.admin) return 'Ⓐ';
    return '';
}
function buildMenuLists() {
    const grouped = {};
    for (const plugin of pluginManager.getAllPlugins()) {
        const cat = slugCat(plugin.tags?.[0]);
        grouped[cat] ??= [];
        const name = toSmallCaps(bareCommandName(plugin));
        const letter = accessLetter(plugin);
        grouped[cat].push({ name, letter, label: letter ? `${name} ${letter}` : name });
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
    txt += `┃ ✧ ᴏᴡɴᴇʀ    : ${config.ownerName}\n`;
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
function buildSectionsV1Style(menuLists) {
    return [
        {
            title: 'KATEGORI UTAMA',
            rows: Object.entries(menuLists).map(([key, data]) => ({
                title: `${data.emoji} ${data.title}`,
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
                            buttonParamsJson: JSON.stringify({ title: 'PILIH MENU', sections: buildSectionsV1Style(menuLists) }),
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
async function resolveThumbnail(conn, senderJid) {
    try {
        const url = await conn.profilePictureUrl(senderJid, 'image');
        if (url) return url;
    } catch { }
    try {
        const botJid = (conn.user?.id?.split(':')[0] || '') + '@s.whatsapp.net';
        const botUrl = await conn.profilePictureUrl(botJid, 'image');
        if (botUrl) return botUrl;
    } catch { }
    return null;
}
async function sendMenuV2Style(conn, m, bodyText, senderJid) {
    const thumbnail = await resolveThumbnail(conn, senderJid);
    const btn = new ButtonV2(conn)
        .setTitle(config.botName || 'Bot')
        .setSubtitle(config.botVersion || '')
        .setBody('-')
        .setFooter(bodyText)
        .addButton(' All Menu', '.menu');
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
            if (getMenuStyle() === 'v2') {
                return sendMenuV2Style(conn, m, body, senderJid);
            }
            return sendMenuV1Style(conn, m.chat, imgBuf, body, fkontak, ctx, menuLists);
        }
        const body = buildFullMenuBody(menuLists, pushname, senderJid, isOwn, isPrem, m.isGroup ? m.chat : null);
        if (getMenuStyle() === 'v2') {
            return sendMenuV2Style(conn, m, body, senderJid);
        }
        await sendMenuV1Style(conn, m.chat, imgBuf, body, fkontak, ctx, menuLists);
    } catch (e) {
        console.error('[MENU ERROR]', e);
        await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴇʀʀᴏʀ: ${e.message}\n╰┈┈┈┈┈┈┈┈⬡`);
    }
};
handler.help = ['menu'];
handler.tags = ['info'];
handler.noLimit = true;
handler.command = /^(menu|help|menu_ai|menu_downloader|menu_sticker|menu_maker|menu_tools|menu_games|menu_info|menu_admin|menu_owner)$/i;
export default handler;