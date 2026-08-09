'use strict';
import config from '../../config.js';
import pluginManager from '../_pluginmanager.js';
const VALID_FOLDERS = config.pluginDirs;
const DEFAULT_FOLDER = 'tools';
function usageMessage() {
    return (
        `╭┈┈⬡「 *ᴘʟᴜɢɪɴ ᴄʀᴇᴀᴛᴏʀ* 」\n` +
        `┃ ✧ ꜰᴏʀᴍᴀᴛ:\n` +
        `┃ ✧ .ᴘʟᴜɢɪɴ <ɴᴀᴍᴀ>\n` +
        `┃ ✧ <ᴋᴏᴅᴇ ᴘʟᴜɢɪɴ ᴅɪ ʙᴀʀɪꜱ ʙᴇʀɪᴋᴜᴛɴʏᴀ>\n` +
        `┃\n` +
        `┃ ✧ ᴛᴀɴᴘᴀ ꜰᴏʟᴅᴇʀ (ᴍᴀꜱᴜᴋ ᴋᴇ "${DEFAULT_FOLDER}"):\n` +
        `┃ ✧ .ᴘʟᴜɢɪɴ ɴᴀᴍᴀꜰɪʟᴇ\n` +
        `┃\n` +
        `┃ ✧ ᴅᴇɴɢᴀɴ ꜰᴏʟᴅᴇʀ:\n` +
        `┃ ✧ .ᴘʟᴜɢɪɴ ᴏᴡɴᴇʀ/ɴᴀᴍᴀꜰɪʟᴇ\n` +
        `┃\n` +
        `┃ ✧ ꜰᴏʟᴅᴇʀ ʏᴀɴɢ ᴀᴅᴀ:\n` +
        `┃ ✧ ${VALID_FOLDERS.map((f) => `\`${f}\``).join(', ')}\n` +
        `┃\n` +
        `┃ ✧ ᴘʟᴜɢɪɴ ᴅɪ ꜱɪɴɪ ᴘᴀᴋᴀɪ ꜰᴏʀᴍᴀᴛ ʀᴇɢᴇxᴘ ʙᴜᴀᴛ ᴄᴏᴍᴍᴀɴᴅ, ᴄᴏɴᴛᴏʜ:\n` +
        `┃ ✧ ʜᴀɴᴅʟᴇʀ.ᴄᴏᴍᴍᴀɴᴅ = /^ʜᴀʟᴏ$/ɪ;\n` +
        `╰┈┈┈┈┈┈┈┈⬡`
    );
}
const handler = async (m) => {
    const raw = (m.body || '').trim();
    const newlineIdx = raw.indexOf('\n');
    if (newlineIdx === -1) {
        await m.reply(usageMessage());
        return;
    }
    const firstLine = raw.slice(0, newlineIdx).trim();
    const code = raw.slice(newlineIdx + 1);
    const parts = firstLine.split(/\s+/).filter(Boolean);
    const rawName = parts[parts.length - 1];
    if (!rawName || parts.length < 2) {
        await m.reply(usageMessage());
        return;
    }
    if (!/^[a-zA-Z0-9_\-/]+$/.test(rawName)) {
        await m.reply(
            `╭┈┈⬡「 *ᴘʟᴜɢɪɴ* 」\n` +
            `┃ ✧ ɴᴀᴍᴀ ꜰɪʟᴇ ᴄᴜᴍᴀ ʙᴏʟᴇʜ ʜᴜʀᴜꜰ, ᴀɴɢᴋᴀ, "-", "_", ᴅᴀɴ "/".\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        );
        return;
    }
    let folder = DEFAULT_FOLDER;
    let filename = rawName;
    if (rawName.includes('/')) {
        const splitParts = rawName.split('/');
        if (splitParts.length > 2) {
            await m.reply(
                `╭┈┈⬡「 *ᴘʟᴜɢɪɴ* 」\n` +
                `┃ ✧ ᴍᴀᴋꜱɪᴍᴀʟ 1 ʟᴇᴠᴇʟ ꜰᴏʟᴅᴇʀ, ᴄᴏɴᴛᴏʜ: ᴛᴏᴏʟꜱ/ɴᴀᴍᴀꜰɪʟᴇ.\n` +
                `╰┈┈┈┈┈┈┈┈⬡`
            );
            return;
        }
        [folder, filename] = splitParts;
        folder = folder.toLowerCase();
        if (!VALID_FOLDERS.includes(folder)) {
            await m.reply(
                `╭┈┈⬡「 *ᴘʟᴜɢɪɴ* 」\n` +
                `┃ ✧ ꜰᴏʟᴅᴇʀ "${folder}" ɢᴀᴋ ᴀᴅᴀ.\n` +
                `┃ ✧ ꜰᴏʟᴅᴇʀ ʏᴀɴɢ ᴀᴅᴀ: ${VALID_FOLDERS.map((f) => `\`${f}\``).join(', ')}\n` +
                `╰┈┈┈┈┈┈┈┈⬡`
            );
            return;
        }
    }
    if (!filename || !filename.trim()) {
        await m.reply(
            `╭┈┈⬡「 *ᴘʟᴜɢɪɴ* 」\n` +
            `┃ ✧ ɴᴀᴍᴀ ꜰɪʟᴇ ᴋᴏꜱᴏɴɢ.\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        );
        return;
    }
    if (!code || code.trim().length < 10) {
        await m.reply(
            `╭┈┈⬡「 *ᴘʟᴜɢɪɴ* 」\n` +
            `┃ ✧ ᴋᴏᴅᴇ ᴛᴇʀʟᴀʟᴜ ᴘᴇɴᴅᴇᴋ/ᴋᴏꜱᴏɴɢ.\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        );
        return;
    }
    const pluginRelPath = `${folder}/${filename}`;
    const result = await pluginManager.addPlugin(pluginRelPath, code);
    if (result.success) {
        await m.reply(
            `╭┈┈⬡「 *ᴘʟᴜɢɪɴ* 」\n` +
            `┃ ✧ ʙᴇʀʜᴀꜱɪʟ ᴅɪᴛᴀᴍʙᴀʜᴋᴀɴ & ʟᴀɴɢꜱᴜɴɢ ᴀᴋᴛɪꜰ.\n` +
            `┃\n` +
            `┃ ✧ ${pluginRelPath}.ᴊꜱ\n` +
            `┃ ✧ ${folder}\n` +
            `┃ ✧ ᴄᴏᴍᴍᴀɴᴅ: ${result.command}\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        );
    }
    else {
        await m.reply(
            `╭┈┈⬡「 *ᴘʟᴜɢɪɴ* 」\n` +
            `┃ ✧ ɢᴀɢᴀʟ, ᴘʟᴜɢɪɴ ʟᴀᴍᴀ (ᴋᴀʟᴀᴜ ᴀᴅᴀ) ᴅɪᴘᴇʀᴛᴀʜᴀɴᴋᴀɴ.\n` +
            `┃\n` +
            `┃ ✧ ${result.error}\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        );
    }
};
handler.help = ['plugin <folder/nama> (+ kode di baris berikutnya)'];
handler.tags = ['owner'];
handler.command = /^plugin$/i;
handler.mainOwner = true;
handler.ignoreRateLimit = true;
handler.limit = true;
export default handler;
