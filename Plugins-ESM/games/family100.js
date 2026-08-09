'use strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pickRandom } from '../../Library/utils.js';
import config from '../../config.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOAL_FILE = path.join(__dirname, '..', '..', 'data', 'soal_family100.json');
const TIMEOUT_MS = 120_000;
function loadSoal() {
    try {
        return JSON.parse(fs.readFileSync(SOAL_FILE, 'utf-8'));
    } catch {
        return [];
    }
}
function buildBoard(jawabanAsli, found) {
    return jawabanAsli
        .map((j, i) => found.includes(j.toLowerCase()) ? `${i + 1}. ✅ ${j}` : `${i + 1}. ❓ ???`)
        .join('\n');
}
function findMatch(input, jawabanList, found) {
    if (jawabanList.includes(input) && !found.includes(input)) return input;
    if (input.length >= 4) {
        const fuzzy = jawabanList.find((j) => j.includes(input) && !found.includes(j));
        if (fuzzy) return fuzzy;
    }
    return null;
}
const activeSessions = new Map();
const handler = async (m, { conn }) => {
    const existing = activeSessions.get(m.chat);
    if (existing && existing.expireAt > Date.now()) {
        await m.reply(`╭┈┈⬡「 *ɢᴀᴍᴇ ꜱᴇᴅᴀɴɢ ʙᴇʀʟᴀɴɢꜱᴜɴɢ!* 」\n┃\n┃ ✧ ᴍᴀꜱɪʜ ᴀᴅᴀ ɢᴀᴍᴇ ꜰᴀᴍɪʟʏ 100 ᴅɪ ꜱɪɴɪ.\n┃ ✧ ꜱᴇʟᴇꜱᴀɪᴋᴀɴ ᴅᴜʟᴜ ᴀᴛᴀᴜ ᴋᴇᴛɪᴋ *ɴʏᴇʀᴀʜ* ᴜɴᴛᴜᴋ ᴍᴇɴʏᴇʀᴀʜ.\n╰┈┈┈┈┈┈┈┈⬡`);
        return;
    }
    const bank = loadSoal();
    const item = pickRandom(bank);
    if (!item) {
        await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ʙᴀɴᴋ ꜱᴏᴀʟ ᴋᴏꜱᴏɴɢ. ᴘᴀꜱᴛɪᴋᴀɴ ᴅᴀᴛᴀ/ꜱᴏᴀʟ_ꜰᴀᴍɪʟʏ100.ᴊꜱᴏɴ ᴀᴅᴀ.\n╰┈┈┈┈┈┈┈┈⬡`);
        return;
    }
    const jawabanAsli = item.jawaban;
    const total = jawabanAsli.length;
    activeSessions.set(m.chat, {
        soal: item.soal,
        jawaban: jawabanAsli.map((j) => j.toLowerCase()),
        jawabanAsli,
        found: [],
        lastWrong: {},
        expireAt: Date.now() + TIMEOUT_MS,
    });
    const board = buildBoard(jawabanAsli, []);
    await conn.sendMessage(m.chat, {
        text:
`╭┈┈⬡「 *ꜰᴀᴍɪʟʏ 100* 」
┃
┃ ✧ *ᴡᴀᴋᴛᴜ*  » 120 ᴅᴇᴛɪᴋ
┃
┣┈┈⬡「  ${item.soal}  」
┃
┃ ✧ ᴊᴀᴡᴀʙᴀɴ (0/${total})
${board.split('\n').map((l) => `┃ ✧ ${l}`).ᴊᴏɪɴ('\n')}
┃
┃ ✧ ᴋᴇᴛɪᴋ ᴊᴀᴡᴀʙᴀɴᴍᴜ ʟᴀɴɢꜱᴜɴɢ ᴅɪ ᴄʜᴀᴛ!
┃ ✧ ᴀᴛᴀᴜ ᴋᴇᴛɪᴋ *ɴʏᴇʀᴀʜ* ᴜɴᴛᴜᴋ ᴍᴇɴʏᴇʀᴀʜ
┃
╰┈┈┈┈┈┈┈┈⬡
_© ${config.copyrightName}_`
    }, { quoted: m.raw });
    setTimeout(async () => {
        const s = activeSessions.get(m.chat);
        if (s && s.expireAt <= Date.now()) {
            activeSessions.delete(m.chat);
            const sisa = s.jawaban.filter((j) => !s.found.includes(j));
            const reveal = sisa.map((j) => `• ${j}`).join('\n');
            try {
                await conn.sendMessage(m.chat, {
                    text: ` Waktu habis! Tertebak: ${s.found.length}/${s.jawaban.length}${sisa.length ? `\n\nJawaban tersisa:\n${reveal}` : '\n\nSemua jawaban berhasil ditemukan!'}`
                });
            } catch {}
        }
    }, TIMEOUT_MS + 500);
};
handler.help = ['family100 - tebak semua jawaban bersama dalam grup'];
handler.tags = ['games'];
handler.command = /^family100$/i;
handler.onText = async (m) => {
    const session = activeSessions.get(m.chat);
    if (!session) return false;
    if (session.expireAt <= Date.now()) return false;
    const raw = m.body.trim();
    if (raw.startsWith('.') || raw.startsWith('!')) return false;
    const input = raw.toLowerCase();
    if (input === 'nyerah') {
        activeSessions.delete(m.chat);
        const sisa = session.jawaban.filter((j) => !session.found.includes(j));
        const reveal = sisa.map((j) => `• ${j}`).join('\n');
        await m.reply(` *Menyerah!* Tertebak: ${session.found.length}/${session.jawaban.length}${sisa.length ? `\n\nJawaban tersisa:\n${reveal}` : ''}\n\nKetik *.family100* untuk soal baru!`);
        return true;
    }
    if (session.found.includes(input)) {
        await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴊᴀᴡᴀʙᴀɴ "${input}" ꜱᴜᴅᴀʜ ᴅɪᴛᴇʙᴀᴋ!\n╰┈┈┈┈┈┈┈┈⬡`);
        return true;
    }
    const matched = findMatch(input, session.jawaban, session.found);
    if (matched) {
        session.found.push(matched);
        const progress = session.found.length;
        const total = session.jawaban.length;
        const selesai = progress >= total;
        const board = buildBoard(session.jawabanAsli, session.found);
        if (selesai) {
            activeSessions.delete(m.chat);
            await m.reply(`╭┈┈⬡「 *ʙᴇɴᴀʀ!* (${progress}/${total})* 」\n┃\n┃ ✧ ${board}\n┃\n┃ ✧ ꜱᴇᴍᴜᴀ ᴊᴀᴡᴀʙᴀɴ ʙᴇʀʜᴀꜱɪʟ ᴅɪᴛᴇᴍᴜᴋᴀɴ!\n┃ ✧ ᴋᴇᴛɪᴋ *.ꜰᴀᴍɪʟʏ100* ᴜɴᴛᴜᴋ ꜱᴏᴀʟ ʙᴀʀᴜ!\n╰┈┈┈┈┈┈┈┈⬡`);
        } else {
            const sisa = total - progress;
            await m.reply(`╭┈┈⬡「 *ʙᴇɴᴀʀ!* 」\n┃\n┃ ✧ ${board}\n┃\n┃ ✧ ꜱɪꜱᴀ ${sisa} ᴊᴀᴡᴀʙᴀɴ ʟᴀɢɪ!\n╰┈┈┈┈┈┈┈┈⬡`);
        }
        return true;
    }
    const lastWrong = session.lastWrong[m.sender] || 0;
    if (Date.now() - lastWrong < 3000) return true;
    session.lastWrong[m.sender] = Date.now();
    await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ꜱᴀʟᴀʜ! ᴄᴏʙᴀ ʟᴀɢɪ...\n╰┈┈┈┈┈┈┈┈⬡`);
    return true;
};
handler.limit = true;
export default handler;
