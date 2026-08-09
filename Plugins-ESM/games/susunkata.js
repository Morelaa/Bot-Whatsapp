'use strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pickRandom } from '../../Library/utils.js';
import config from '../../config.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOAL_FILE = path.join(__dirname, '..', '..', 'data', 'soal_susunkata.json');
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
        await m.reply(`╭┈┈⬡「 *ɢᴀᴍᴇ ꜱᴇᴅᴀɴɢ ʙᴇʀʟᴀɴɢꜱᴜɴɢ!* 」\n┃\n┃ ✧ ᴍᴀꜱɪʜ ᴀᴅᴀ ɢᴀᴍᴇ ꜱᴜꜱᴜɴ ᴋᴀᴛᴀ ᴅɪ ꜱɪɴɪ.\n┃ ✧ ꜱᴇʟᴇꜱᴀɪᴋᴀɴ ᴅᴜʟᴜ ᴀᴛᴀᴜ ᴋᴇᴛɪᴋ *ɴʏᴇʀᴀʜ* ᴜɴᴛᴜᴋ ᴍᴇɴʏᴇʀᴀʜ.\n╰┈┈┈┈┈┈┈┈⬡`);
        return;
    }
    const bank = loadSoal();
    const item = pickRandom(bank);
    if (!item) {
        await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ʙᴀɴᴋ ꜱᴏᴀʟ ᴋᴏꜱᴏɴɢ. ᴘᴀꜱᴛɪᴋᴀɴ ᴅᴀᴛᴀ/ꜱᴏᴀʟ_ꜱᴜꜱᴜɴᴋᴀᴛᴀ.ᴊꜱᴏɴ ᴀᴅᴀ.\n╰┈┈┈┈┈┈┈┈⬡`);
        return;
    }
    const jawaban = item.jawaban.toUpperCase();
    activeSessions.set(m.chat, {
        soal: item.soal,
        tipe: item.tipe,
        jawaban,
        lastWrong: {},
        expireAt: Date.now() + TIMEOUT_MS,
    });
    await conn.sendMessage(m.chat, {
        text:
`╭┈┈⬡「 *ꜱᴜꜱᴜɴ ᴋᴀᴛᴀ* 」
┃
┃ ✧ *ᴋᴀᴛᴇɢᴏʀɪ* » ${item.tipe}
┃ ✧ *ᴡᴀᴋᴛᴜ*    » 60 ᴅᴇᴛɪᴋ
┃
┣┈┈⬡「 *ꜱᴜꜱᴜɴ ʜᴜʀᴜꜰ ʙᴇʀɪᴋᴜᴛ!* 」
┃
┃ ✧ ✦  ${item.soal}  ✦
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
                    text: ` Waktu habis! Soal: ${s.soal}\nJawabannya: *${s.jawaban}*`
                });
            } catch {}
        }
    }, TIMEOUT_MS + 500);
};
handler.help = ['susunkata - susun huruf acak menjadi kata yang benar'];
handler.tags = ['games'];
handler.command = /^susunkata$/i;
handler.onText = async (m) => {
    const session = activeSessions.get(m.chat);
    if (!session) return false;
    if (session.expireAt <= Date.now()) return false;
    const raw = m.body.trim();
    if (raw.startsWith('.') || raw.startsWith('!')) return false;
    const tebakan = raw.toUpperCase();
    if (tebakan === 'NYERAH') {
        activeSessions.delete(m.chat);
        await m.reply(`╭┈┈⬡「 *ᴍᴇɴʏᴇʀᴀʜ!* ᴊᴀᴡᴀʙᴀɴɴʏᴀ: *${session.jawaban}* 」\n┃\n┃ ✧ ᴋᴇᴛɪᴋ *.ꜱᴜꜱᴜɴᴋᴀᴛᴀ* ᴜɴᴛᴜᴋ ꜱᴏᴀʟ ʙᴀʀᴜ!\n╰┈┈┈┈┈┈┈┈⬡`);
        return true;
    }
    if (tebakan === session.jawaban) {
        activeSessions.delete(m.chat);
        await m.reply(`╭┈┈⬡「 *ʙᴇɴᴀʀ!* ᴊᴀᴡᴀʙᴀɴɴʏᴀ *${session.jawaban}*. ᴍᴀɴᴛᴀᴘ!* 」\n┃\n┃ ✧ ᴋᴇᴛɪᴋ *.ꜱᴜꜱᴜɴᴋᴀᴛᴀ* ᴜɴᴛᴜᴋ ꜱᴏᴀʟ ʙᴀʀᴜ!\n╰┈┈┈┈┈┈┈┈⬡`);
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
