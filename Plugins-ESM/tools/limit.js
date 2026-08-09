'use strict';
import config from '../../config.js';
import db from '../../Database/db.js';
import usagelimit from '../../Database/usagelimit.js';
const handler = async (m) => {
    const botName = config.botName;
    const userJid = m.sender;
    const isPrem = !!db.getUser(userJid)?.premium;
    const limit = config.defaultUsageLimit;
    const used = usagelimit.getUsedToday(userJid);
    const sisa = isPrem ? '∞' : Math.max(limit - used, 0);
    const pemakaian = isPrem ? `${used}/∞` : `${used}/${limit}`;
    await m.reply(
        `╭┈┈⬡「 *ʟɪᴍɪᴛ ᴋᴀᴍᴜ* 」\n┃\n` +
        `┃ ✧ ᴛᴇʀᴘᴀᴋᴀɪ : *${pemakaian}*\n` +
        `┃ ✧ ꜱɪꜱᴀ     : *${sisa}*\n` +
        `┃ ✧ ꜱᴛᴀᴛᴜꜱ   : *${isPrem ? 'Premium' : 'Free'}*\n┃\n` +
        `╰┈┈┈┈┈┈┈┈⬡\n\n꒰ © ${botName} ꒱`
    );
};
handler.help = ['limit'];
handler.tags = ['tools'];
handler.noLimit = true;
handler.noRegisterGate = true;
handler.command = /^(limit|mylimit)$/i;
export default handler;
