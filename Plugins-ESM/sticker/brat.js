//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import config from '../../config.js';
import { ButtonV2 } from '../../Library/MessageBuilder.js';
import { toPhoneJid, isLidJid } from '../../Library/resolve.js';
import { buildFkontak } from '../../Library/utils.js';
import bratoriginalHandler from './bratoriginal.js';
import bratruromiyaHandler from './bratruromiya.js';
import bratvidHandler from './bratvid.js';
import bratguraHandler from './bratgura.js';
import bratspongebobHandler from './bratspongebob.js';
import brattrenHandler from './brattren.js';
import stikerbratHandler from './stikerbrat.js';
const footer = `© ${config.copyrightName || config.botName}`;
const bratSessions = new Map();
const SESSION_TTL_MS = 2 * 60 * 1000;
async function resolveSenderThumb(sock, m) {
    try {
        const rawSender = m.sender;
        let jid = null;
        if (isLidJid(rawSender) && m.senderAlt && !isLidJid(m.senderAlt)) {
            jid = toPhoneJid(m.senderAlt) || m.senderAlt;
        } else {
            jid = toPhoneJid(rawSender) || rawSender;
        }
        const url = await sock.profilePictureUrl(jid, 'image');
        if (url) return url;
    } catch {}
    return config.buttonv2Img;
}
const BRAT_STYLES = [
    { id: 'brat_orig', title: ' Original', desc: 'Brat original (HD)' },
    { id: 'brat_ruromiya', title: ' Ruromiya', desc: 'Brat style ruromiya' },
    { id: 'brat_vid', title: ' Vid', desc: 'Brat animasi / video' },
    { id: 'brat_gura', title: ' Gura', desc: 'Brat style gura' },
    { id: 'brat_spongebob', title: ' Spongebob', desc: 'Brat style spongebob' },
    { id: 'brat_tren', title: ' Tren', desc: 'Brat kekinian / tren' },
    { id: 'brat_cewek', title: ' Cewek', desc: 'Brat cewek' },
];
const CMD_MAP = {
    brat_orig: { plugin: bratoriginalHandler, command: 'bratoriginal' },
    brat_ruromiya: { plugin: bratruromiyaHandler, command: 'bratruromiya' },
    brat_vid: { plugin: bratvidHandler, command: 'bratvid' },
    brat_gura: { plugin: bratguraHandler, command: 'bratgura' },
    brat_spongebob: { plugin: bratspongebobHandler, command: 'bratspongebob' },
    brat_tren: { plugin: brattrenHandler, command: 'brattren' },
    brat_cewek: { plugin: stikerbratHandler, command: 'stikerbrat' },
};
const BUTTON_CMDS = new Set(BRAT_STYLES.map((s) => s.id));
function buildBratSections() {
    return [
        {
            title: '',
            rows: BRAT_STYLES.map((s) => ({
                title: s.title,
                description: s.desc,
                id: `.${s.id}`,
            })),
        },
    ];
}
async function sendBratMenu(m, conn, text) {
    const thumb = await resolveSenderThumb(conn, m);
    const btn = new ButtonV2(conn)
        .setTitle(' Brat Sticker')
        .setSubtitle(`Teks: ${text}`)
        .setBody('-')
        .setFooter(footer)
        .addRawButton({
            buttonId: 'brat_list',
            buttonText: { displayText: '☱ Pilih Style' },
            type: 1,
            nativeFlowInfo: {
                name: 'single_select',
                paramsJson: JSON.stringify({
                    title: 'Pilih Style Brat',
                    sections: buildBratSections(),
                }),
            },
        });
    if (thumb) btn.setThumbnail(thumb);
    const built = await btn.build(m.chat, { quoted: (await buildFkontak(conn, config).catch(() => null)) || m.raw });
    await conn.relayMessage(m.chat, built.message, {
        messageId: built.key.id,
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
const handler = async (m, { conn, text, command, usedPrefix }) => {
    if (BUTTON_CMDS.has(command)) {
        const session = bratSessions.get(m.sender);
        if (!session) return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴋᴇᴛɪᴋ ᴜʟᴀɴɢ ʙʀᴀᴛ ʟᴀɢɪ\n╰┈┈┈┈┈┈┈┈⬡`);
        bratSessions.delete(m.sender);
        const target = CMD_MAP[command];
        if (!target) return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴘʟᴜɢɪɴ ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ!\n╰┈┈┈┈┈┈┈┈⬡`);
        return target.plugin(m, {
            conn,
            text: session.text,
            args: session.text.split(' '),
            usedPrefix: usedPrefix || '.',
            command: target.command,
        });
    }
    if (!text?.trim())
        return m.reply(
            `╭┈┈⬡「 *ʙʀᴀᴛ ꜱᴛɪᴄᴋᴇʀ* 」\n` +
            `┃ ✧ ᴄᴏɴᴛᴏʜ: *${usedPrefix}ʙʀᴀᴛ ʜᴀʟᴏɪɪ*\n` +
            `┃\n` +
            `┃ ✧ ꜱᴇᴍᴜᴀ ꜱᴛʏʟᴇ ʙɪꜱᴀ ᴅɪᴘɪʟɪʜ ʟᴇᴡᴀᴛ 1 ʙᴜᴛᴛᴏɴ:\n` +
            `┃ ✧ ☱ ᴘɪʟɪʜ ꜱᴛʏʟᴇ\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n${footer}`
        );
    bratSessions.set(m.sender, { text: text.trim() });
    setTimeout(() => bratSessions.delete(m.sender), SESSION_TTL_MS);
    await sendBratMenu(m, conn, text.trim());
};
handler.command = /^(brat|brat_orig|brat_ruromiya|brat_vid|brat_gura|brat_spongebob|brat_tren|brat_cewek)$/i;
handler.tags = ['sticker'];
handler.help = ['brat <teks>'];
handler.limit = true;
export default handler;
