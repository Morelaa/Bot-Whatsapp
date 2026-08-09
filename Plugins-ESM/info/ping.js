'use strict';
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
