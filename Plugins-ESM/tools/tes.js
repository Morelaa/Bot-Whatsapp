//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

const handler = async (m, { text }) => {
    await m.reply(
        `╭┈┈⬡「 *ᴛᴇꜱᴛ ᴘʟᴜɢɪɴ ʙᴇᴋᴇʀᴊᴀ!* 」\n` +
        `┃ ✧ ᴛᴇxᴛ : ${text || 'ᴋᴏꜱᴏɴɢ'}\n` +
        `╰┈┈┈┈┈┈┈┈⬡`
    );
};
handler.command = /^(test|tes)$/i;
handler.tags = ['info'];
handler.help = ['test — cek apakah command & branded reply jalan normal'];
handler.limit = true;
export default handler;
