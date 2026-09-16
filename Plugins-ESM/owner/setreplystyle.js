//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import sharp from 'sharp';
import config from '../../config.js';
import { getReplyStyle, setReplyStyle } from '../../System/replystyle.js';
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
    { id: 'v1', title: 'V1 Link Preview Card', desc: 'Balasan tampil sebagai link preview kosong dengan kutipan kontak bot' },
    { id: 'v2', title: 'V2 Native Flow', desc: 'Balasan interaktif tanpa gambar dengan kutipan undangan grup' },
    { id: 'v3', title: 'V3 Quoted Order Card', desc: 'Balasan interaktif dengan kutipan card produk bergambar' },
    { id: 'v4', title: 'V4 Order Card Besar', desc: 'Balasan berupa card produk besar bergambar dengan badge kecil' },
    { id: 'v5', title: 'V5 Link Card + Order', desc: 'Gabungan V1 dan V3: link preview kosong dengan kutipan card produk bergambar' },
];
function buildSectionsReplyStyle(current) {
    return [
        {
            title: toSmallCaps('pilih reply style'),
            highlight_label: toSmallCaps(`saat ini: ${current}`),
            rows: STYLE_OPTIONS.map((o) => ({
                title: toSmallCaps(o.title),
                description: toSmallCaps(o.desc),
                id: `.setreplystyle ${o.id}`,
            })),
        },
    ];
}
async function sendReplyStylePicker(conn, m, current) {
    const imgBuf = await loadConfigImage(config.menuImage);
    const jpegThumbnail = await sharp(imgBuf)
        .resize(300, 300, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
        .jpeg({ quality: 90 })
        .toBuffer()
        .catch(() => imgBuf);
    const footerText = `*ʀᴇᴘʟʏ ꜱᴛʏʟᴇ ꜱᴀᴀᴛ ɪɴɪ:* *${current}*\nᴘɪʟɪʜ ꜱᴀʟᴀʜ ꜱᴀᴛᴜ ᴅɪ ʙᴀᴡᴀʜ ɪɴɪ`;
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
                                title: toSmallCaps('reply style'),
                                sections: buildSectionsReplyStyle(current),
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
        const current = getReplyStyle();
        await sendReplyStylePicker(conn, m, current);
        return;
    }
    if (!['v1', 'v2', 'v3', 'v4', 'v5'].includes(arg)) {
        await m.reply(`*ɪɴꜰᴏ*\nꜰᴏʀᴍᴀᴛ ꜱᴀʟᴀʜ. ᴋᴇᴛɪᴋ *.ꜱᴇᴛʀᴇᴘʟʏꜱᴛʏʟᴇ* ᴜɴᴛᴜᴋ ᴍᴇᴍɪʟɪʜ ʟᴇᴡᴀᴛ ᴛᴏᴍʙᴏʟ.`);
        return;
    }
    const updated = setReplyStyle(arg);
    await m.reply(`*ɪɴꜰᴏ*\nʀᴇᴘʟʏ ꜱᴛʏʟᴇ ᴅɪɢᴀɴᴛɪ ᴋᴇ *${updated}*.`);
};
handler.help = ['setreplystyle'];
handler.tags = ['owner'];
handler.command = /^(setreplystyle|setreply)$/i;
handler.owner = true;
handler.ignoreRateLimit = true;
handler.limit = true;
export default handler;
