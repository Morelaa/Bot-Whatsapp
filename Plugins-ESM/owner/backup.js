'use strict';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import config from '../../config.js';
import { getMainOwnerNumber } from '../../System/mainowner.js';
const IGNORE_GLOBS = [
    'node_modules/**', '.git/**', '*.zip',
    'session/**', 'sessions/**',
    'tmp/**', 'temp/**',
    '.npm/**', '.pm2/**', '.config/**',
    '.cache/**', 'logs/**',
    'package-lock.json',
];
function genZipName() {
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return `backup-bot-${ts}.zip`;
}
function fmtSize(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
function getMainOwnerJid() {
    const num = getMainOwnerNumber();
    return num ? `${num}@s.whatsapp.net` : '';
}
const handler = async (m, { conn }) => {
    const start = Date.now();
    const zipName = genZipName();
    const zipPath = path.join(config.rootDir, zipName);
    const ownerJid = getMainOwnerJid();
    if (!ownerJid) {
        return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴄᴏɴꜰɪɢ.ᴍᴀɪɴᴏᴡɴᴇʀ ʙᴇʟᴜᴍ ᴅɪɪꜱɪ, ɢᴀᴋ ᴛᴀᴜ ᴍᴀᴜ ᴋɪʀɪᴍ ʙᴀᴄᴋᴜᴘ ᴋᴇ ɴᴏᴍᴏʀ ᴍᴀɴᴀ.\n╰┈┈┈┈┈┈┈┈⬡`);
    }
    try {
        await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        const done = new Promise((resolve, reject) => {
            output.on('close', resolve);
            output.on('error', reject);
            archive.on('error', reject);
        });
        archive.pipe(output);
        archive.glob('**/*', { cwd: config.rootDir, ignore: IGNORE_GLOBS });
        await archive.finalize();
        await done;
        await conn.sendMessage(m.chat, { react: { text: '', key: m.key } });
        const stats = fs.statSync(zipPath);
        const size = fmtSize(stats.size);
        const duration = ((Date.now() - start) / 1000).toFixed(1);
        await conn.sendMessage(ownerJid, {
            document: fs.readFileSync(zipPath),
            fileName: zipName,
            mimetype: 'application/zip',
            caption: ` *Backup Bot ${config.botName}*\n\n Size: ${size}\n Waktu: ${duration}s`,
        });
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        if (m.chat !== ownerJid) {
            await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ʙᴀᴄᴋᴜᴘ ꜱᴇʟᴇꜱᴀɪ (${size}, ${duration}ꜱ) — ᴅɪᴋɪʀɪᴍ ᴋᴇ ᴅᴍ ᴍᴀɪɴ ᴏᴡɴᴇʀ.\n╰┈┈┈┈┈┈┈┈⬡`);
        }
    }
    catch (err) {
        console.error('[BACKUP ERROR]', err);
        await conn.sendMessage(m.chat, { react: { text: '', key: m.key } }).catch(() => { });
        await m.reply(`╭┈┈⬡「 *ʙᴀᴄᴋᴜᴘ ɢᴀɢᴀʟ!* 」\n┃\n┃ ✧ ${err?.message || err}\n╰┈┈┈┈┈┈┈┈⬡`);
    }
    finally {
        try {
            fs.unlinkSync(zipPath);
        }
        catch { }
    }
};
handler.command = /^(backup|backupbot)$/i;
handler.tags = ['owner'];
handler.owner = true;
handler.help = ['backup — zip seluruh folder project (kecuali node_modules/session/dll), dikirim ke DM main owner'];
handler.limit = true;
export default handler;
