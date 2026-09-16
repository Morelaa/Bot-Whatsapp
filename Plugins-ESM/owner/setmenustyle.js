//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import sharp from 'sharp';
import config from '../../config.js';
import { getMenuStyle, setMenuStyle } from '../../System/menustyle.js';
import { loadConfigImage } from '../../Library/utils.js';
const SMALLCAPS_MAP = {
    a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ꜰ', g: 'ɢ', h: 'ʜ', i: 'ɪ', j: 'ᴊ',
    k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'q', r: 'ʀ', s: 'ꜱ', t: 'ᴛ',
    u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ',
};
function toSmallCaps(text) {
    return String(text).replace(/[a-zA-Z]/g, (ch) => SMALLCAPS_MAP[ch.toLowerCase()] || ch);
}
const STYLE_OPTIONS = [
    { id: 'v1', title: 'V1 Menu Gambar + Aksi', desc: 'Menu bergambar dengan tombol kategori, beli, telepon, dan owner' },
    { id: 'v2', title: 'V2 Menu Foto Profil', desc: 'Menu dengan foto profil pengirim dan daftar tombol kategori' },
    { id: 'v3', title: 'V3 Menu Interaktif', desc: 'Menu bergambar dengan tombol kategori dan tombol donasi' },
    { id: 'v4', title: 'V4 Menu Card + Badge', desc: 'Menu bergambar dengan badge card dan tombol menu serta info' },
    { id: 'v5', title: 'V5 Menu A2UI', desc: 'Menu dengan kartu widget A2UI (bloksWidget) plus tombol kategori & info' },
    { id: 'v6', title: 'V6 Menu Hybrid A2UI', desc: 'Menu lokasi + limited time offer + kartu A2UI info & tombol owner sekaligus' },
];
function buildSectionsMenuStyle(current) {
    return [
        {
            title: toSmallCaps('pilih menu style'),
            highlight_label: toSmallCaps(`saat ini: ${current}`),
            rows: STYLE_OPTIONS.map((o) => ({
                title: toSmallCaps(o.title),
                description: toSmallCaps(o.desc),
                id: `.setmenu ${o.id}`,
            })),
        },
    ];
}
async function sendMenuStylePicker(conn, m, current) {
    const imgBuf = await loadConfigImage(config.menuImage);
    const jpegThumbnail = await sharp(imgBuf)
        .resize(300, 300, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
        .jpeg({ quality: 90 })
        .toBuffer()
        .catch(() => imgBuf);
    const footerText = `*ᴍᴇɴᴜ ꜱᴛʏʟᴇ ꜱᴀᴀᴛ ɪɴɪ:* *${current}*\nᴘɪʟɪʜ ꜱᴀʟᴀʜ ꜱᴀᴛᴜ ᴅɪ ʙᴀᴡᴀʜ ɪɴɪ`;
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
                                title: toSmallCaps('menu style'),
                                sections: buildSectionsMenuStyle(current),
                            }),
                        },
                    ],
                },
            },
        },
        { messageId: conn.generateMessageTag() }
    );
}
const handler = async (m, { conn, text }) => {
    const arg = (text || '').trim().toLowerCase();
    if (!arg) {
        const current = getMenuStyle();
        await sendMenuStylePicker(conn, m, current);
        return;
    }
    if (!['v1', 'v2', 'v3', 'v4', 'v5', 'v6'].includes(arg)) {
        await m.reply(`*ɪɴꜰᴏ*\nꜰᴏʀᴍᴀᴛ ꜱᴀʟᴀʜ. ᴋᴇᴛɪᴋ *.ꜱᴇᴛᴍᴇɴᴜ* ᴜɴᴛᴜᴋ ᴍᴇᴍɪʟɪʜ ʟᴇᴡᴀᴛ ᴛᴏᴍʙᴏʟ.`);
        return;
    }
    const updated = setMenuStyle(arg);
    await m.reply(`*ɪɴꜰᴏ*\nᴍᴇɴᴜ ꜱᴛʏʟᴇ ᴅɪɢᴀɴᴛɪ ᴋᴇ *${updated}*.`);
};
handler.help = ['setmenu'];
handler.tags = ['owner'];
handler.command = /^(setmenu)$/i;
handler.owner = true;
handler.ignoreRateLimit = true;
handler.limit = true;
export default handler;
