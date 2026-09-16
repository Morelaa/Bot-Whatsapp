//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import config from '../../config.js';
const handler = async (m, { conn }) => {
    const botName = config.botName;
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
    let groups;
    try {
        groups = await conn.groupFetchAllParticipating();
    } catch (e) {
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ɢᴀɢᴀʟ ᴍᴇɴɢᴀᴍʙɪʟ ᴅᴀꜰᴛᴀʀ ɢʀᴜᴘ : ${e?.message}\n╰┈┈┈┈┈┈┈┈⬡`);
    }
    const jids = Object.keys(groups || {});
    if (!jids.length) {
        await conn.sendMessage(m.chat, { react: { text: 'ℹ️', key: m.key } });
        return m.reply(`╭┈┈⬡「 *ʟɪꜱᴛ ɢʀᴜᴘ* 」\n┃\n┃ ✧ ʙᴏᴛ ᴛɪᴅᴀᴋ ʙᴇʀᴀᴅᴀ ᴅɪ ɢʀᴜᴘ ᴍᴀɴᴀᴘᴜɴ\n┃\n╰┈┈┈┈┈┈┈┈⬡\n\n꒰ © ${botName} ꒱`);
    }
    const sorted = jids
        .map((jid) => ({ jid, name: groups[jid]?.subject || jid, memberCount: groups[jid]?.participants?.length ?? 0 }))
        .sort((a, b) => a.name.localeCompare(b.name));
    const results = [];
    for (const g of sorted) {
        let link = null;
        try {
            const code = await conn.groupInviteCode(g.jid);
            link = `https://chat.whatsapp.com/${code}`;
        } catch {
            link = null;
        }
        results.push({ ...g, link });
    }
    const CHUNK_SIZE = 20;
    const chunks = [];
    for (let i = 0; i < results.length; i += CHUNK_SIZE) {
        chunks.push(results.slice(i, i + CHUNK_SIZE));
    }
    for (let c = 0; c < chunks.length; c++) {
        const chunk = chunks[c];
        const startIdx = c * CHUNK_SIZE;
        let txt = `╭┈┈⬡「 *ʟɪꜱᴛ ɢʀᴜᴘ* 」\n┃\n┃ ✧ ᴛᴏᴛᴀʟ : *${results.length} ɢʀᴜᴘ*`;
        if (chunks.length > 1) txt += ` (ʜᴀʟᴀᴍᴀɴ ${c + 1}/${chunks.length})`;
        txt += `\n┃\n`;
        chunk.forEach((g, i) => {
            txt += `┃ ✧ *${startIdx + i + 1}.* ${g.name}\n` + `┃ ✧ ${g.memberCount} member\n` + `┃ ✧ ${g.link || '_link tidak tersedia (setting grup mengunci invite link ke admin saja)_'}\n┃\n`;
        });
        txt += `╰┈┈┈┈┈┈┈┈⬡`;
        if (c === chunks.length - 1) txt += `\n\n꒰ © ${botName} ꒱`;
        await m.reply(txt);
    }
    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
};
handler.help = ['linkgc'];
handler.tags = ['owner'];
handler.noLimit = true;
handler.command = /^(linkgc|listgc|listgrup|listgroup)$/i;
handler.owner = true;
export default handler;
