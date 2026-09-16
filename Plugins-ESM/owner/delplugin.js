//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import pluginManager from '../_pluginmanager.js';
const handler = async (m, { text }) => {
    const name = (text || '').trim();
    if (!name) {
        await m.reply(
            `╭┈┈⬡「 *ᴅᴇʟ ᴘʟᴜɢɪɴ* 」\n┃\n` +
            `┃ ✧ ꜰᴏʀᴍᴀᴛ : *.ᴅᴇʟᴘʟᴜɢɪɴ <ɴᴀᴍᴀ>*\n` +
            `┃ ✧ ᴄᴏɴᴛᴏʜ : *.ᴅᴇʟᴘʟᴜɢɪɴ ʙᴀᴄᴋᴜᴘ*\n` +
            `┃ ✧ ᴄᴏɴᴛᴏʜ : *.ᴅᴇʟᴘʟᴜɢɪɴ ᴏᴡɴᴇʀ/ʙᴀᴄᴋᴜᴘ*\n┃\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        );
        return;
    }
    const result = pluginManager.deletePlugin(name);
    if (!result.success) {
        await m.reply(`╭┈┈⬡「 *ᴅᴇʟ ᴘʟᴜɢɪɴ* 」\n┃\n┃ ✧ ${result.error}\n┃\n╰┈┈┈┈┈┈┈┈⬡`);
        return;
    }
    await m.reply(
        `╭┈┈⬡「 *ᴅᴇʟ ᴘʟᴜɢɪɴ* 」\n┃\n` +
        `┃ ✧ ʙᴇʀʜᴀꜱɪʟ ᴅɪʜᴀᴘᴜꜱ & ʟᴀɴɢꜱᴜɴɢ ɴᴏɴᴀᴋᴛɪꜰ.\n┃\n` +
        `┃ ✧ ${result.rel}.ᴊꜱ\n┃\n` +
        `╰┈┈┈┈┈┈┈┈⬡`
    );
};
handler.help = ['delplugin <nama>'];
handler.tags = ['owner'];
handler.command = /^(delplugin|deleteplugin)$/i;
handler.mainOwner = true;
handler.ignoreRateLimit = true;
handler.limit = true;
export default handler;
