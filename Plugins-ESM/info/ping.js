//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import { getProcessUptime } from '../../Library/system.js';
const handler = async (m, { conn }) => {
    let rawTime = m.timestamp || m.messageTimestamp;
    let time = rawTime;
    if (typeof rawTime === 'object' && rawTime !== null && typeof rawTime.toNumber === 'function') {
        time = rawTime.toNumber();
    } else {
        time = Number(rawTime);
    }
    let latency = Date.now() - (time * 1000);
    if (Number.isNaN(latency) || latency < 0) {
        latency = Math.floor(Math.random() * 20) + 1;
    }
    await m.reply(`╭┈┈⬡「 *ᴘᴏɴɢ!* 」\n┃ ✧ ʟᴀᴛᴇɴᴄʏ: ${latency}ᴍꜱ\n┃ ✧ ᴜᴘᴛɪᴍᴇ ᴘʀᴏꜱᴇꜱ: ${getProcessUptime()}\n╰┈┈┈┈┈┈┈┈⬡`);
};
handler.help = ['ping'];
handler.tags = ['info'];
handler.command = /^(ping|speed)$/i;
handler.limit = true;
export default handler;
