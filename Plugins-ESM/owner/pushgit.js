'use strict';
import axios from 'axios';
import unzipper from 'unzipper';
import config from '../../config.js';
const SKIP_FILE_EXT = /\.(db|db-shm|db-wal)$/i;
const SKIP_PATH = /(^|\/)(node_modules|\.git|session|sessions|__MACOSX)(\/|$)|\.DS_Store$/i;
function getDownloadableTarget(m) {
    if (m.quoted) {
        return { key: m.quoted.key, message: m.quoted.message, type: m.quoted.type };
    }
    return { key: m.key, message: m.raw?.message, type: m.type };
}
function sensorConfigJs(text) {
    const KEYS = [
        'mainOwner', 'pairingNumber', 'pairingCustomCode', 'githubToken',
        'githubRepo', 'channelJid', 'neoxr', 'imgbb', 'evelyne', 'openrouter',
    ];
    let out = text;
    for (const key of KEYS) {
        const re = new RegExp(`(${key}\\s*:\\s*['"\`])[^'"\`]*(['"\`])`, 'g');
        out = out.replace(re, `$1SENSOR_${key.toUpperCase()}$2`);
    }
    return out;
}
const handler = async (m, { conn, text, usedPrefix, command }) => {
    const target = getDownloadableTarget(m);
    const meta = target.message?.[target.type] || {};
    const mimetype = meta.mimetype || '';
    const fileName = meta.fileName || '';
    const isZip = /zip/i.test(mimetype) || /\.zip$/i.test(fileName);
    if (!text) {
        return m.reply(`╭┈┈⬡「 *ʙᴀʟᴀꜱ ꜰɪʟᴇ ᴢɪᴘ ʟᴀʟᴜ ɢᴜɴᴀᴋᴀɴ:* 」\n┃\n┃ ✧ ${usedPrefix + command} ɴᴀᴍᴀ-ʀᴇᴘᴏ|ᴛʀᴜᴇ/ꜰᴀʟꜱᴇ\n┃\n┃ ✧ ᴄᴏɴᴛᴏʜ:\n┃ ✧ ${usedPrefix + command} ᴍʏ-ʙᴏᴛ|ᴛʀᴜᴇ\n╰┈┈┈┈┈┈┈┈⬡`);
    }
    const [repoName, isPrivateRaw] = text.split('|').map((v) => v.trim());
    if (!repoName) return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ɴᴀᴍᴀ ʀᴇᴘᴏ ᴛɪᴅᴀᴋ ʙᴏʟᴇʜ ᴋᴏꜱᴏɴɢ!\n╰┈┈┈┈┈┈┈┈⬡`);
    if (!isPrivateRaw) return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ɪꜱɪ ᴛʀᴜᴇ/ꜰᴀʟꜱᴇ ᴜɴᴛᴜᴋ ᴘʀɪᴠᴀᴛᴇ ʀᴇᴘᴏ\n╰┈┈┈┈┈┈┈┈⬡`);
    const isPrivate = isPrivateRaw.toLowerCase() === 'true';
    if (!isZip) {
        return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ʀᴇᴘʟʏ ꜰɪʟᴇ ᴢɪᴘ ᴛᴇʀʟᴇʙɪʜ ᴅᴀʜᴜʟᴜ, ʙᴀʀᴜ ᴋᴇᴛɪᴋ ᴄᴏᴍᴍᴀɴᴅ ɪɴɪ!\n╰┈┈┈┈┈┈┈┈⬡`);
    }
    const token = config.githubToken;
    if (!token) {
        return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴛᴏᴋᴇɴ ɢɪᴛʜᴜʙ ʙᴇʟᴜᴍ ᴅɪɪꜱɪ ᴅɪ ᴄᴏɴꜰɪɢ.ᴊꜱ (ꜰɪᴇʟᴅ "ɢɪᴛʜᴜʙᴛᴏᴋᴇɴ").\n╰┈┈┈┈┈┈┈┈⬡`);
    }
    try {
        await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
        const userRes = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `token ${token}`, 'User-Agent': 'WhatsAppBot' },
        });
        const login = userRes.data.login;
        let exists = true;
        try {
            await axios.get(`https://api.github.com/repos/${login}/${repoName}`, {
                headers: { Authorization: `token ${token}`, 'User-Agent': 'WhatsAppBot' },
            });
        } catch (e) {
            if (e.response?.status === 404) exists = false;
            else throw e;
        }
        if (!exists) {
            await axios.post(
                'https://api.github.com/user/repos',
                { name: repoName, private: isPrivate, auto_init: true },
                { headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'WhatsAppBot' } }
            );
        } else {
            await axios.patch(
                `https://api.github.com/repos/${login}/${repoName}`,
                { private: isPrivate },
                { headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'WhatsAppBot' } }
            );
        }
        const zipBuffer = await conn.downloadMedia({ key: target.key, message: target.message });
        if (!Buffer.isBuffer(zipBuffer) || !zipBuffer.length) throw new Error('File ZIP tidak valid / gagal didownload');
        const directory = await unzipper.Open.buffer(zipBuffer);
        let total = 0;
        for (const file of directory.files) {
            if (file.type === 'Directory') continue;
            const filePath = file.path.replace(/^\/+/, '');
            if (SKIP_PATH.test(filePath) || SKIP_FILE_EXT.test(filePath)) continue;
            const encoded = encodeURIComponent(filePath).replace(/%2F/g, '/');
            let rawBuffer = await file.buffer();
            if (filePath === 'config.js' || filePath.endsWith('/config.js')) {
                rawBuffer = Buffer.from(sensorConfigJs(rawBuffer.toString('utf-8')), 'utf-8');
            }
            const content = rawBuffer.toString('base64');
            let sha;
            try {
                const res = await axios.get(
                    `https://api.github.com/repos/${login}/${repoName}/contents/${encoded}`,
                    { headers: { Authorization: `token ${token}`, 'User-Agent': 'WhatsAppBot' } }
                );
                sha = res.data.sha;
            } catch {}
            await axios.put(
                `https://api.github.com/repos/${login}/${repoName}/contents/${encoded}`,
                { message: 'Upload via WhatsApp Bot', content, ...(sha ? { sha } : {}) },
                { headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'WhatsAppBot' } }
            );
            total++;
        }
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        await m.reply(`╭┈┈⬡「 *ᴘᴜꜱʜ ɢɪᴛ ꜱᴜᴄᴄᴇꜱꜱ 」* 」\n┃\n┃ ✧ ʀᴇᴘᴏ    : ${login}/${repoName}\n┃ ✧ ᴘʀɪᴠᴀᴛᴇ : ${isPrivate}\n┃ ✧ ꜰɪʟᴇꜱ   : ${total}\n┃ ✧ ʜᴛᴛᴘꜱ://ɢɪᴛʜᴜʙ.ᴄᴏᴍ/${login}/${repoName}\n╰┈┈┈┈┈┈┈┈⬡`);
    } catch (e) {
        await conn.sendMessage(m.chat, { react: { text: '', key: m.key } });
        m.reply(`╭┈┈⬡「 *ᴇʀʀᴏʀ:* 」\n┃ ✧ ${e.response?.data?.message || e.message}\n╰┈┈┈┈┈┈┈┈⬡`);
    }
};
handler.help = ['pushgit <repo>|<true/false>'];
handler.tags = ['owner'];
handler.command = /^(pushgit|githubpush)$/i;
handler.owner = true;
handler.limit = true;
export default handler;
