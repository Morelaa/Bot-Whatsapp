'use strict';
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
