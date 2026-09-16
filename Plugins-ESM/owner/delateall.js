//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import fs from 'fs';
import kvstore from '../../Database/kvstore.js';
import db from '../../Database/sqlite.js';
import config from '../../config.js';
function fmtSize(bytes) {
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
}
function getDbFileSize() {
    try {
        return fs.statSync(config.dbFile).size;
    }
    catch (_) {
        return null;
    }
}
const handler = async (m, { command }) => {
    let removed = 0;
    try {
        removed = kvstore.delByPrefix('crm_cache:');
    }
    catch (err) {
        return m.reply(`╭┈┈⬡「 *ɢᴀɢᴀʟ ʜᴀᴘᴜꜱ ᴄᴀᴄʜᴇ!* 」\n┃\n┃ ✧ ᴇʀʀᴏʀ: ${err?.message || err}\n╰┈┈┈┈┈┈┈┈⬡`);
    }
    const sizeBefore = getDbFileSize();
    await m.reply(
        `╭┈┈⬡「 *ᴄʀᴍ ᴄᴀᴄʜᴇ ᴅɪʙᴇʀꜱɪʜᴋᴀɴ* 」\n┃\n┃ ✧ ᴇɴᴛʀʏ ᴅɪʜᴀᴘᴜꜱ : ${removed}\n┃ ✧ ᴛᴛʟ ᴏᴛᴏᴍᴀᴛɪꜱ (3 ʜᴀʀɪ) ᴛᴇᴛᴀᴘ ʙᴇʀᴊᴀʟᴀɴ ꜱᴇᴘᴇʀᴛɪ ʙɪᴀꜱᴀ.\n┃ ✧ ꜱᴇᴅᴀɴɢ ᴍᴇᴍᴀᴅᴀᴛᴋᴀɴ ꜰɪʟᴇ ᴅᴀᴛᴀʙᴀꜱᴇ (ᴠᴀᴄᴜᴜᴍ)...\n╰┈┈┈┈┈┈┈┈⬡`
    );
    try {
        db.pragma('wal_checkpoint(TRUNCATE)');
        db.exec('VACUUM');
    }
    catch (err) {
        return m.reply(`╭┈┈⬡「 *ᴄᴀᴄʜᴇ ᴛᴇʀʜᴀᴘᴜꜱ, ᴛᴀᴘɪ ᴠᴀᴄᴜᴜᴍ ɢᴀɢᴀʟ!* 」\n┃\n┃ ✧ ᴇʀʀᴏʀ: ${err?.message || err}\n╰┈┈┈┈┈┈┈┈⬡`);
    }
    const sizeAfter = getDbFileSize();
    const sizeLine = sizeBefore != null && sizeAfter != null
        ? `┃ ✧ ᴜᴋᴜʀᴀɴ ᴅʙ : ${fmtSize(sizeBefore)} → ${fmtSize(sizeAfter)}\n`
        : '';
    return m.reply(
        `╭┈┈⬡「 *ᴠᴀᴄᴜᴜᴍ ꜱᴇʟᴇꜱᴀɪ* 」\n┃\n${sizeLine}┃ ✧ ꜰɪʟᴇ ᴅᴀᴛᴀʙᴀꜱᴇ ꜱᴜᴅᴀʜ ᴅɪᴘᴀᴅᴀᴛᴋᴀɴ.\n╰┈┈┈┈┈┈┈┈⬡`
    );
};
handler.command = /^delateall$/i;
handler.tags = ['owner'];
handler.mainOwner = true;
handler.ignoreRateLimit = true;
handler.help = [
    'delateall — hapus manual semua crm_cache di kv_store + vacuum db (TTL 3 hari otomatis tetap jalan)',
];
handler.limit = false;
export default handler;
