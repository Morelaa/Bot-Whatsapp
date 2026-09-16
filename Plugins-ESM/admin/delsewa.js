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
function buildRows(groups) {
    return groups.map((g, i) => ({
        header: `Grup ${i + 1}`,
        title: g.name.length > 40 ? g.name.slice(0, 37) + '...' : g.name,
        description: `Habis : ${DateTime.fromMillis(g.untilAt).setZone('Asia/Jakarta').toFormat('d MMMM yyyy')}`,
        id: `.delsewa ${g.jid}`,
    }));
}
const handler = async (m, { conn, command, text }) => {
    if (command !== 'delsewa') return;
    if (text && text.trim().endsWith('@g.us')) {
        const targetJid = text.trim();
        const g = db.getGroup(targetJid);
        if (!g?.settings?.sewa?.active) {
            return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ɢʀᴜᴘ ɪɴɪ ᴛɪᴅᴀᴋ ꜱᴇᴅᴀɴɢ ᴅᴀʟᴀᴍ ᴍᴀꜱᴀ ꜱᴇᴡᴀ.\n╰┈┈┈┈┈┈┈┈⬡`);
        }
        let groupName = g.name || targetJid;
        try {
            const meta = await conn.groupMetadata(targetJid);
            groupName = meta?.subject || groupName;
        } catch {  }
        db.updateGroup(targetJid, { sewa: null });
        return m.reply(
            `╭┈┈⬡「 *ꜱᴇᴡᴀ ᴅɪʜᴀᴘᴜꜱ* 」\n` +
            `┃\n` +
            `┃ ✧ ɢʀᴜᴘ : ${groupName}\n` +
            `┃ ✧ ꜱᴛᴀᴛᴜꜱ ᴍᴀꜱᴀ ꜱᴇᴡᴀ ᴛᴇʟᴀʜ ᴅɪʜᴀᴘᴜꜱ.\n` +
            `┃ ✧ ʙᴏᴛ ᴛɪᴅᴀᴋ ᴀᴋᴀɴ ɴɢᴇᴛᴀɢ ʀᴇᴍɪɴᴅᴇʀ ᴀᴛᴀᴜ ᴋᴇʟᴜᴀʀ ᴏᴛᴏᴍᴀᴛɪꜱ ᴅᴀʀɪ ɢʀᴜᴘ ɪɴɪ ʟᴀɢɪ.\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        );
    }
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
    const dbGroups = db.getAllGroups();
    const rented = Object.keys(dbGroups)
        .map((jid) => ({ jid, name: dbGroups[jid]?.name || jid, sewa: dbGroups[jid]?.settings?.sewa }))
        .filter((g) => g.sewa?.active && g.sewa?.untilAt)
        .map((g) => ({ jid: g.jid, name: g.name, untilAt: g.sewa.untilAt }))
        .sort((a, b) => a.untilAt - b.untilAt);
    if (!rented.length) {
        await conn.sendMessage(m.chat, { react: { text: '', key: m.key } });
        return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴛɪᴅᴀᴋ ᴀᴅᴀ ɢʀᴜᴘ ʏᴀɴɢ ꜱᴇᴅᴀɴɢ ᴅᴀʟᴀᴍ ᴍᴀꜱᴀ ꜱᴇᴡᴀ.\n╰┈┈┈┈┈┈┈┈⬡`);
    }
    const MAX_PER_SECTION = 10;
    const sections = [];
    for (let i = 0; i < rented.length; i += MAX_PER_SECTION) {
        const slice = rented.slice(i, i + MAX_PER_SECTION);
        sections.push({ title: `Grup ${i + 1}–${Math.min(i + MAX_PER_SECTION, rented.length)} dari ${rented.length}`, rows: buildRows(slice) });
    }
    const caption = `*Hapus Masa Sewa*\n\nTotal Grup Disewa : ${rented.length}\n\n_Ketuk grup yang mau dihapus masa sewanya._`;
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
handler.command = /^delsewa$/i;
handler.owner = true;
handler.tags = ['owner'];
handler.help = ['delsewa', 'delsewa <jid@g.us>'];
handler.limit = true;
export default handler;
