//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import sharp from 'sharp';
import * as baileys from '@itsliaaa/baileys';
import config from '../../config.js';
import pluginManager from '../_pluginmanager.js';
import { loadConfigImage } from '../../Library/utils.js';
import { getProcessUptime } from '../../Library/system.js';
const GITHUB_URL = config.sourceCodeUrl;
async function fetchThumbBuffer(thumbnailUrl, attempts = 2) {
    for (let i = 0; i < attempts; i++) {
        try {
            const res = await axios.get(thumbnailUrl, {
                responseType: 'arraybuffer',
                timeout: 20000,
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            });
            return Buffer.from(res.data);
        }
        catch (e) {
            console.error(`[SC THUMBNAIL ERROR] percobaan ${i + 1}/${attempts}:`, e.message || e);
            if (i < attempts - 1) await new Promise((r) => setTimeout(r, 800));
        }
    }
    return null;
}
async function buildOrderQuote({ thumbnailUrl, title, orderTitle, fallbackBuffer }) {
    let thumbBuf = Buffer.alloc(0);
    try {
        const raw = (await fetchThumbBuffer(thumbnailUrl)) || fallbackBuffer;
        if (raw && raw.length) {
            thumbBuf = await sharp(raw)
                .resize(300, 300, { fit: 'cover', position: 'center' })
                .jpeg({ quality: 80 })
                .toBuffer();
        }
    }
    catch (e) {
        console.error('[SC THUMBNAIL PROCESS ERROR]', e);
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
const CATEGORY_LABEL = {
    ai: 'AI',
    downloader: 'Downloader',
    sticker: 'Sticker',
    maker: 'Maker',
    tools: 'Tools',
    games: 'Games & RPG',
    info: 'Info',
    admin: 'Admin',
    owner: 'Owner',
};
const SMALLCAPS_MAP = {
    a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ꜰ', g: 'ɢ', h: 'ʜ', i: 'ɪ', j: 'ᴊ',
    k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'q', r: 'ʀ', s: 'ꜱ', t: 'ᴛ',
    u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ',
};
function toSmallCaps(text) {
    return String(text).replace(/[a-zA-Z]/g, (ch) => SMALLCAPS_MAP[ch.toLowerCase()] || ch);
}
function countByCategory() {
    const grouped = {};
    for (const plugin of pluginManager.getAllPlugins()) {
        const cat = (plugin.tags?.[0] || 'lainnya').toLowerCase();
        grouped[cat] = (grouped[cat] || 0) + 1;
    }
    return grouped;
}
function readPackageJson() {
    try {
        const raw = fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8');
        return JSON.parse(raw);
    } catch {
        return {};
    }
}
function buildFooterText() {
    const pkg = readPackageJson();
    const grouped = countByCategory();
    const totalCommands = Object.values(grouped).reduce((a, b) => a + b, 0);
    const totalDeps = Object.keys(pkg.dependencies || {}).length;
    const uptime = getProcessUptime();
    let txt = `╭┈┈⬡「 *ꜱᴏᴜʀᴄᴇ ᴄᴏᴅᴇ ɪɴꜰᴏ* 」\n`;
    txt += `┃ ✧ ɴᴀᴍᴀ     : ${toSmallCaps(config.botName)}\n`;
    txt += `┃ ✧ ᴠᴇʀꜱɪ    : ${toSmallCaps(config.botVersion || pkg.version || '-')}\n`;
    txt += `┃ ✧ ʙᴀꜱᴇ     : ${toSmallCaps('@itsliaaa/baileys')}\n`;
    txt += `┃ ✧ ʟᴀɴɢᴜᴀɢᴇ : ${toSmallCaps('Node.js')}\n`;
    txt += `┃ ✧ ᴅᴀᴛᴀʙᴀꜱᴇ  : ${toSmallCaps('SQLite')}\n`;
    txt += `┃ ✧ ʟɪꜱᴇɴꜱɪ  : ${toSmallCaps('MIT — Open Source')}\n`;
    txt += `┃ ✧ ᴜᴘᴛɪᴍᴇ   : ${toSmallCaps(uptime)}\n`;
    txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`;
    txt += `╭┈┈⬡「 *ꜱᴛᴀᴛɪꜱᴛɪᴋ* 」\n`;
    txt += `┃ ✧ ᴛᴏᴛᴀʟ ᴄᴏᴍᴍᴀɴᴅ : ${totalCommands}\n`;
    txt += `┃ ✧ ᴛᴏᴛᴀʟ ᴋᴀᴛᴇɢᴏʀɪ : ${Object.keys(grouped).length}\n`;
    txt += `┃ ✧ ᴛᴏᴛᴀʟ ᴅᴇᴘᴇɴᴅᴇɴᴄʏ : ${totalDeps}\n`;
    txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`;
    txt += `╭┈┈⬡「 *ʀɪɴᴄɪᴀɴ ꜰɪᴛᴜʀ* 」\n`;
    for (const [cat, count] of Object.entries(grouped).sort((a, b) => b[1] - a[1])) {
        const label = toSmallCaps(CATEGORY_LABEL[cat] || cat);
        txt += `┃ ✧ ${label} : ${count} command\n`;
    }
    txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`;
    txt += `${toSmallCaps('Base bot ini open source dan bebas dipakai/dimodifikasi. Source code lengkap ada di GitHub, tekan tombol di bawah buat lihat.')}\n\n`;
    txt += `${toSmallCaps(`Powered by ${config.botName}`)} `;
    return txt;
}
const handler = async (m, { conn }) => {
    try {
        const footerText = buildFooterText();
        const bigImageUrl = config.menuImage;
        const smallThumbUrl = config.thumbnail || config.menuImage;
        const imgBuf = await loadConfigImage(bigImageUrl);
        const orderQuote = await buildOrderQuote({
            thumbnailUrl: smallThumbUrl,
            title: `© ${toSmallCaps(config.copyrightName)}`,
            orderTitle: '📦 Open Source • MIT License',
            fallbackBuffer: imgBuf,
        });
        let imgMsg;
        if (imgBuf?.length) {
            const media = await baileys.prepareWAMessageMedia({ image: imgBuf }, { upload: conn.waUploadToServer });
            imgMsg = media?.imageMessage;
        }
        await conn.relayMessage(
            m.chat,
            {
                interactiveMessage: {
                    header: { hasMediaAttachment: !!imgMsg, imageMessage: imgMsg },
                    body: { text: '' },
                    footer: { text: footerText },
                    contextInfo: {
                        forwardingScore: 1,
                        isForwarded: true,
                        participant: orderQuote.participant,
                        remoteJid: orderQuote.remoteJid,
                        quotedMessage: orderQuote.quotedMessage,
                    },
                    nativeFlowMessage: {
                        buttons: [
                            {
                                name: 'cta_url',
                                buttonParamsJson: JSON.stringify({
                                    display_text: ' Lihat Source Code',
                                    url: GITHUB_URL,
                                    merchant_url: GITHUB_URL,
                                }),
                            },
                        ],
                    },
                },
            },
            { messageId: conn.generateMessageTag() }
        );
    } catch (e) {
        console.error('[SC ERROR]', e);
        await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴇʀʀᴏʀ: ${e.message}\n╰┈┈┈┈┈┈┈┈⬡`);
    }
};
handler.help = ['sc'];
handler.tags = ['info'];
handler.command = /^(sc|sourcecode|script)$/i;
handler.noLimit = true;
export default handler;
