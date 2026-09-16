//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import { Button } from '../../Library/MessageBuilder.js';
const handler = async (m, { conn, args, text }) => {
    let targetJid = m.chat;
    const arg = (args[0] || '').trim();
    if (arg) {
        if (/^\d+$/.test(arg)) {
            targetJid = `${arg}@s.whatsapp.net`;
        }
        else if (/^\d+@/.test(arg) || arg.includes('@g.us') || arg.includes('@newsletter')) {
            targetJid = arg;
        }
        else {
            return m.reply(`╭┈┈⬡「 *ᴊɪᴅ ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ: \`${arg}\`* 」\n┃\n┃ ✧ ᴄᴏɴᴛᴏʜ:\n┃ ✧ \`.ʀᴇǫᴄᴏɴᴛᴀᴄᴛ 628xxx\`\n┃ ✧ \`.ʀᴇǫᴄᴏɴᴛᴀᴄᴛ 120363xxx@ɢ.ᴜꜱ\`\n╰┈┈┈┈┈┈┈┈⬡`);
        }
    }
    const bodyText = arg ? text.replace(arg, '').trim() : text.trim();
    const body = bodyText || 'Please share your contact information';
    try {
        const btn = new Button(conn)
            .setBody(body)
            .addButton('request_contact_info', {});
        await btn.send(targetJid, targetJid === m.chat ? { quoted: m.raw } : {});
        if (targetJid !== m.chat) {
            await m.reply(`╭┈┈⬡「 *ʙᴇʀʜᴀꜱɪʟ ᴋɪʀɪᴍ!* 」\n┃\n┃ ✧ ᴛɪᴘᴇ: \`request_contact_info\`\n┃ ✧ ᴛᴜᴊᴜᴀɴ: \`${targetJid}\`\n╰┈┈┈┈┈┈┈┈⬡`);
        }
    }
    catch (err) {
        await m.reply(`╭┈┈⬡「 *ɢᴀɢᴀʟ ᴋɪʀɪᴍ!* 」\n┃ ✧ ᴇʀʀᴏʀ: ${err?.message || err}\n╰┈┈┈┈┈┈┈┈⬡`);
    }
};
handler.command = /^(reqcontact|mintakontak)$/i;
handler.tags = ['owner'];
handler.mainOwner = true;
handler.ignoreRateLimit = true;
handler.help = [
    'reqcontact                    — kirim pesan minta info kontak (native_flow request_contact_info)',
    'reqcontact <jid>               — kirim ke JID/nomor/grup tertentu',
    'reqcontact <jid> <teks body>    — custom teks body-nya',
];
handler.limit = true;
export default handler;
