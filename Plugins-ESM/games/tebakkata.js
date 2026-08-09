'use strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pickRandom } from '../../Library/utils.js';
import config from '../../config.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOAL_FILE = path.join(__dirname, '..', '..', 'data', 'soal_tebakkata.json');
const TIMEOUT_MS = 60_000;
function loadSoal() {
    try {
        return JSON.parse(fs.readFileSync(SOAL_FILE, 'utf-8'));
    } catch {
        return [];
    }
}
const activeSessions = new Map();
const handler = async (m, { conn }) => {
    const existing = activeSessions.get(m.chat);
    if (existing && existing.expireAt > Date.now()) {
        await m.reply(`╭┈┈⬡「 *ɢᴀᴍᴇ ꜱᴇᴅᴀɴɢ ʙᴇʀʟᴀɴɢꜱᴜɴɢ!* 」\n┃\n┃ ✧ ᴍᴀꜱɪʜ ᴀᴅᴀ ɢᴀᴍᴇ ᴛᴇʙᴀᴋ ᴋᴀᴛᴀ ᴅɪ ꜱɪɴɪ.\n┃ ✧ ꜱᴇʟᴇꜱᴀɪᴋᴀɴ ᴅᴜʟᴜ ᴀᴛᴀᴜ ᴋᴇᴛɪᴋ *ɴʏᴇʀᴀʜ* ᴜɴᴛᴜᴋ ᴍᴇɴʏᴇʀᴀʜ.\n╰┈┈┈┈┈┈┈┈⬡`);
        return;
    }
    const bank = loadSoal();
    const item = pickRandom(bank);
    if (!item) {
        await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ʙᴀɴᴋ ꜱᴏᴀʟ ᴋᴏꜱᴏɴɢ. ᴘᴀꜱᴛɪᴋᴀɴ ᴅᴀᴛᴀ/ꜱᴏᴀʟ_ᴛᴇʙᴀᴋᴋᴀᴛᴀ.ᴊꜱᴏɴ ᴀᴅᴀ.\n╰┈┈┈┈┈┈┈┈⬡`);
        return;
    }
    const jawaban = item.jawaban.toUpperCase();
    const hint = jawaban[0] + '_'.repeat(jawaban.length - 1);
    activeSessions.set(m.chat, {
        soal: item.soal,
        jawaban,
        lastWrong: {},
        expireAt: Date.now() + TIMEOUT_MS,
    });
    await conn.sendMessage(m.chat, {
        text:
`╭┈┈⬡「 *ᴛᴇʙᴀᴋ ᴋᴀᴛᴀ* 」
┃
┃ ✧ *ᴡᴀᴋᴛᴜ*  » 60 ᴅᴇᴛɪᴋ
┃
┣┈┈⬡「 *ᴘᴇᴛᴜɴᴊᴜᴋ ᴋᴀᴛᴀ* 」
┃
┃ ✧ ${item.soal}
┃
┣┈┈⬡「 *ꜰᴏʀᴍᴀᴛ ᴊᴀᴡᴀʙᴀɴ* 」
┃
┃ ✧ ${hint}  (${jawaban.length} ʜᴜʀᴜꜰ)
┃
┃ ✧ ᴋᴇᴛɪᴋ ᴊᴀᴡᴀʙᴀɴᴍᴜ ᴅɪ ᴄʜᴀᴛ!
┃ ✧ ᴀᴛᴀᴜ ᴋᴇᴛɪᴋ *ɴʏᴇʀᴀʜ* ᴜɴᴛᴜᴋ ᴍᴇɴʏᴇʀᴀʜ
┃
╰┈┈┈┈┈┈┈┈⬡
_© ${config.copyrightName}_`
    }, { quoted: m.raw });
    setTimeout(async () => {
        const s = activeSessions.get(m.chat);
        if (s && s.expireAt <= Date.now()) {
            activeSessions.delete(m.chat);
            try {
                await conn.sendMessage(m.chat, {
                    text: ` Waktu habis! Petunjuk: *${s.soal}*\nJawabannya: *${s.jawaban}*`
                });
            } catch {}
        }
    }, TIMEOUT_MS + 500);
};
handler.help = ['tebakkata - tebak kata dari petunjuk yang diberikan'];
handler.tags = ['games'];
handler.command = /^(tebakkata|tk)$/i;
handler.onText = async (m, { conn }) => {
    const session = activeSessions.get(m.chat);
    if (!session) return false;
    const expired = session.expireAt <= Date.now();
    if (expired) return false;
    const raw = m.body.trim();
    if (raw.startsWith('.') || raw.startsWith('!')) return false;
    const tebakan = raw.toUpperCase();
    if (tebakan === 'NYERAH') {
        activeSessions.delete(m.chat);
        await m.reply(`╭┈┈⬡「 *ᴍᴇɴʏᴇʀᴀʜ!* ᴊᴀᴡᴀʙᴀɴɴʏᴀ: *${session.jawaban}* 」\n┃\n┃ ✧ ᴋᴇᴛɪᴋ *.ᴛᴇʙᴀᴋᴋᴀᴛᴀ* ᴜɴᴛᴜᴋ ꜱᴏᴀʟ ʙᴀʀᴜ!\n╰┈┈┈┈┈┈┈┈⬡`);
        return true;
    }
    if (tebakan === session.jawaban) {
        activeSessions.delete(m.chat);
        await m.reply(`╭┈┈⬡「 *ʙᴇɴᴀʀ!* ᴊᴀᴡᴀʙᴀɴɴʏᴀ *${session.jawaban}*. ᴍᴀɴᴛᴀᴘ!* 」\n┃\n┃ ✧ ᴋᴇᴛɪᴋ *.ᴛᴇʙᴀᴋᴋᴀᴛᴀ* ᴜɴᴛᴜᴋ ꜱᴏᴀʟ ʙᴀʀᴜ!\n╰┈┈┈┈┈┈┈┈⬡`);
        return true;
    }
    const lastWrong = session.lastWrong[m.sender] || 0;
    if (Date.now() - lastWrong < 5000) return true;
    session.lastWrong[m.sender] = Date.now();
    const sisaDetik = Math.max(0, Math.ceil((session.expireAt - Date.now()) / 1000));
    await m.reply(`╭┈┈⬡「 *${tebakan}* ʙᴜᴋᴀɴ ᴊᴀᴡᴀʙᴀɴɴʏᴀ~ (ꜱɪꜱᴀ ${sisaDetik} ᴅᴇᴛɪᴋ)* 」\n┃\n┃ ✧ ᴄᴏʙᴀ ʟᴀɢɪ ᴀᴛᴀᴜ ᴋᴇᴛɪᴋ *ɴʏᴇʀᴀʜ*\n╰┈┈┈┈┈┈┈┈⬡`);
    return true;
};
handler.limit = true;
export default handler;
