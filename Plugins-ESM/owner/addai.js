//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

const META_AI_BOT_JID = '867051314767696@bot';
const handler = async (m, { conn }) => {
    if (!m.isGroup) {
        await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴄᴏᴍᴍᴀɴᴅ ɪɴɪ ᴄᴜᴍᴀ ʙɪꜱᴀ ᴅɪᴘᴀᴋᴀɪ ᴅɪ ɢʀᴜᴘ.\n╰┈┈┈┈┈┈┈┈⬡`);
        return;
    }
    try {
        await conn.groupParticipantsUpdate(m.chat, [META_AI_BOT_JID], 'add');
        await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ꜱᴜᴋꜱᴇꜱ ᴀᴅᴅ ᴍᴇᴛᴀ ᴀɪ ᴋᴇ ɢʀᴜᴘ ✅\n╰┈┈┈┈┈┈┈┈⬡`);
    }
    catch (err) {
        await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ɢᴀɢᴀʟ ᴀᴅᴅ ᴍᴇᴛᴀ ᴀɪ: ${err?.message || err}\n╰┈┈┈┈┈┈┈┈⬡`);
    }
};
handler.help = ['addai'];
handler.tags = ['owner'];
handler.command = /^addai$/i;
handler.owner = true;
handler.group = true;
handler.botAdmin = true;
handler.limit = true;
export default handler;
