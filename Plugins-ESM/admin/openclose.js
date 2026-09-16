//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

const handler = async (m, { conn, command }) => {
    const from = m.chat;
    if (!from || !from.endsWith('@g.us')) {
        return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴄᴏᴍᴍᴀɴᴅ ɪɴɪ ʜᴀɴʏᴀ ʙɪꜱᴀ ᴅɪɢᴜɴᴀᴋᴀɴ ᴅɪ ᴅᴀʟᴀᴍ ɢʀᴜᴘ.\n╰┈┈┈┈┈┈┈┈⬡`);
    }
    if (command === 'open') {
        try {
            await conn.groupSettingUpdate(from, 'not_announcement');
            return m.reply(`╭┈┈⬡「 *ɢʀᴜᴘ ᴅɪʙᴜᴋᴀ* 」\n┃\n┃ ✧ ꜱᴇᴍᴜᴀ ᴀɴɢɢᴏᴛᴀ ᴋɪɴɪ ᴅᴀᴘᴀᴛ ᴍᴇɴɢɪʀɪᴍ ᴘᴇꜱᴀɴ.\n╰┈┈┈┈┈┈┈┈⬡`);
        } catch {
            return m.reply(`╭┈┈⬡「 *ɢʀᴜᴘ ᴅɪʙᴜᴋᴀ* 」\n┃\n┃ ✧ ɢᴀɢᴀʟ ᴍᴇᴍʙᴜᴋᴀ ɢʀᴜᴘ!\n┃ ✧ ᴘᴀꜱᴛɪᴋᴀɴ ʙᴏᴛ ᴍᴇᴍɪʟɪᴋɪ ʜᴀᴋ ᴀᴅᴍɪɴ.\n╰┈┈┈┈┈┈┈┈⬡`);
        }
    }
    if (command === 'close') {
        try {
            await conn.groupSettingUpdate(from, 'announcement');
            return m.reply(`╭┈┈⬡「 *ɢʀᴜᴘ ᴅɪᴛᴜᴛᴜᴘ* 」\n┃\n┃ ✧ ʜᴀɴʏᴀ ᴀᴅᴍɪɴ ʏᴀɴɢ ᴅᴀᴘᴀᴛ ᴍᴇɴɢɪʀɪᴍ ᴘᴇꜱᴀɴ ꜱᴇᴋᴀʀᴀɴɢ.\n╰┈┈┈┈┈┈┈┈⬡`);
        } catch {
            return m.reply(`╭┈┈⬡「 *ɢʀᴜᴘ ᴅɪᴛᴜᴛᴜᴘ* 」\n┃\n┃ ✧ ɢᴀɢᴀʟ ᴍᴇɴᴜᴛᴜᴘ ɢʀᴜᴘ!\n┃ ✧ ᴘᴀꜱᴛɪᴋᴀɴ ʙᴏᴛ ᴍᴇᴍɪʟɪᴋɪ ʜᴀᴋ ᴀᴅᴍɪɴ.\n╰┈┈┈┈┈┈┈┈⬡`);
        }
    }
};
handler.help = ['open', 'close'];
handler.tags = ['group'];
handler.command = /^(open|close)$/i;
handler.group = true;
handler.admin = true;
handler.botAdmin = true;
handler.limit = true;
export default handler;
