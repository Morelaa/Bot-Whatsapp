//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import db from '../../Database/db.js';
const handler = async (m, { args }) => {
    const from = m.chat;
    const mode = (args[0] || '').toLowerCase();
    const grp = db.getGroup(from);
    const current = grp?.settings?.antifakeedit || false;
    if (!mode || mode === 'status' || mode === 'cek') {
        return m.reply(
            `╭┈┈⬡「 *ᴀɴᴛɪ ꜰᴀᴋᴇ-ᴇᴅɪᴛ* 」\n┃\n` +
            `┃ ✧ ꜱᴛᴀᴛᴜꜱ: ${current ? ' AKTIF' : ' NONAKTIF'}\n┃\n` +
            `┃ ✧ ᴅᴇᴛᴇᴋꜱɪ ᴘᴏʟᴀ "ɢʜᴏꜱᴛ ᴍᴇꜱꜱᴀɢᴇ + ᴇᴅɪᴛ"\n` +
            `┃   (ʙᴏᴛ ʏᴀɴɢ ᴇᴅɪᴛ/ʜᴀᴘᴜꜱ ᴘᴇꜱᴀɴ ᴏʀᴀɴɢ ʟᴀɪɴ\n` +
            `┃   ᴛᴀɴᴘᴀ ʀᴏʟᴇ ᴀᴅᴍɪɴ)\n` +
            `┃ ✧ ᴋᴇᴛᴀʜᴜᴀɴ  ᴋɪᴄᴋ ᴏᴛᴏᴍᴀᴛɪꜱ (ᴋᴀʟᴀᴜ ʙᴏᴛ ᴀᴅᴍɪɴ)\n┃\n` +
            `┃ ✧ *.ᴀɴᴛɪꜰᴀᴋᴇᴇᴅɪᴛ ᴏɴ*  — ᴀᴋᴛɪꜰᴋᴀɴ\n` +
            `┃ ✧ *.ᴀɴᴛɪꜰᴀᴋᴇᴇᴅɪᴛ ᴏꜰꜰ* — ɴᴏɴᴀᴋᴛɪꜰᴋᴀɴ\n╰┈┈┈┈┈┈┈┈⬡`
        );
    }
    if (mode === 'on' || mode === 'aktif') {
        if (current) return m.reply('╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴀɴᴛɪ ꜰᴀᴋᴇ-ᴇᴅɪᴛ ꜱᴜᴅᴀʜ ᴀᴋᴛɪꜰ!\n╰┈┈┈┈┈┈┈┈⬡');
        db.updateGroup(from, { antifakeedit: true });
        return m.reply(
            '╭┈┈⬡「 *ᴀɴᴛɪ ꜰᴀᴋᴇ-ᴇᴅɪᴛ ᴀᴋᴛɪꜰ* 」\n┃ ✧ ʙᴇʀʜᴀꜱɪʟ ᴅɪᴀᴋᴛɪꜰᴋᴀɴ!\n┃ ✧ _ᴘᴀꜱᴛɪᴋᴀɴ ʙᴏᴛ ꜱᴜᴅᴀʜ ᴊᴀᴅɪ ᴀᴅᴍɪɴ ᴀɢᴀʀ ʙɪꜱᴀ ᴋɪᴄᴋ ᴏᴛᴏᴍᴀᴛɪꜱ!_\n╰┈┈┈┈┈┈┈┈⬡'
        );
    }
    if (mode === 'off' || mode === 'nonaktif') {
        if (!current) return m.reply('╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴀɴᴛɪ ꜰᴀᴋᴇ-ᴇᴅɪᴛ ᴍᴇᴍᴀɴɢ ꜱᴜᴅᴀʜ ɴᴏɴᴀᴋᴛɪꜰ!\n╰┈┈┈┈┈┈┈┈⬡');
        db.updateGroup(from, { antifakeedit: false });
        return m.reply('╭┈┈⬡「 *ʙᴇʀʜᴀꜱɪʟ* 」\n┃ ✧ ᴀɴᴛɪ ꜰᴀᴋᴇ-ᴇᴅɪᴛ ᴅɪɴᴏɴᴀᴋᴛɪꜰᴋᴀɴ!\n╰┈┈┈┈┈┈┈┈⬡');
    }
    return m.reply('╭┈┈⬡「 *ᴇʀʀᴏʀ* 」\n┃ ✧ ɢᴜɴᴀᴋᴀɴ: *.ᴀɴᴛɪꜰᴀᴋᴇᴇᴅɪᴛ ᴏɴ/ᴏꜰꜰ/ꜱᴛᴀᴛᴜꜱ*\n╰┈┈┈┈┈┈┈┈⬡');
};
handler.help = ['antifakeedit on', 'antifakeedit off', 'antifakeedit status'];
handler.tags = ['group', 'anti'];
handler.command = /^antifakeedit$/i;
handler.group = true;
handler.admin = true;
export default handler;
