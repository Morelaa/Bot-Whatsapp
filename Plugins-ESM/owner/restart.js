//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

const handler = async (m) => {
    await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴍᴇʀᴇꜱᴛᴀʀᴛ ʙᴏᴛ...\n╰┈┈┈┈┈┈┈┈⬡`);
    setTimeout(() => process.exit(0), 500);
};
handler.help = ['restart'];
handler.tags = ['owner'];
handler.command = /^(restart|reboot)$/i;
handler.owner = true;
handler.ignoreRateLimit = true;
handler.limit = true;
export default handler;
