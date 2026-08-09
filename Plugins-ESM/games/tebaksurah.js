'use strict';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import config from '../../config.js';
const TIMEOUT_MS = 90_000;
const activeSessions = new Map();
function mp3ToOpus(mp3Buffer) {
    const tempDir = path.join(process.cwd(), 'media', 'temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const stamp = Date.now();
    const mp3Path = path.join(tempDir, `${stamp}_ts.mp3`);
    const oggPath = path.join(tempDir, `${stamp}_ts.ogg`);
    try {
        fs.writeFileSync(mp3Path, mp3Buffer);
        execSync(
            `ffmpeg -y -i "${mp3Path}" -c:a libopus -b:a 48k -vbr on -ar 48000 -ac 1 "${oggPath}"`,
            { stdio: 'pipe', timeout: 30000 }
        );
        return fs.readFileSync(oggPath);
    } finally {
        if (fs.existsSync(mp3Path)) fs.unlinkSync(mp3Path);
        if (fs.existsSync(oggPath)) fs.unlinkSync(oggPath);
    }
}
function normalize(str) {
    return str
        .toUpperCase()
        .replace(/^(AL-|AL\s)/i, '')
        .replace(/[^A-Z0-9]/g, '')
        .trim();
}
const handler = async (m, { conn }) => {
    const existing = activeSessions.get(m.chat);
    if (existing && existing.expireAt > Date.now()) {
        await m.reply(`╭┈┈⬡「 *ɢᴀᴍᴇ ꜱᴇᴅᴀɴɢ ʙᴇʀʟᴀɴɢꜱᴜɴɢ!* 」\n┃\n┃ ✧ ᴍᴀꜱɪʜ ᴀᴅᴀ ɢᴀᴍᴇ ᴛᴇʙᴀᴋ ꜱᴜʀᴀʜ ᴅɪ ꜱɪɴɪ.\n┃ ✧ ꜱᴇʟᴇꜱᴀɪᴋᴀɴ ᴅᴜʟᴜ ᴀᴛᴀᴜ ᴋᴇᴛɪᴋ *ɴʏᴇʀᴀʜ* ᴜɴᴛᴜᴋ ᴍᴇɴʏᴇʀᴀʜ.\n╰┈┈┈┈┈┈┈┈⬡`);
        return;
    }
    try {
        const res = await fetch('https://api.deline.web.id/game/tebaksurah');
        const data = await res.json();
        if (!data?.status || !data?.result) throw new Error('Gagal ambil soal');
        const r = data.result;
        const surah = r.surah;
        const ayahNum = r.numberInSurah;
        const qari = r.edition?.englishName || 'Alafasy';
        const jawabanEn = surah.englishName.toUpperCase();
        const jawabanAr = surah.name.replace(/سُورَةُ\s*/g, '').trim();
        activeSessions.set(m.chat, {
            jawabanEn,
            jawabanAr,
            surahName: surah.englishName,
            surahAr: surah.name,
            translation: surah.englishNameTranslation,
            surahNumber: surah.number,
            ayahNum,
            qari,
            lastWrong: {},
            expireAt: Date.now() + TIMEOUT_MS,
        });
        await conn.sendMessage(m.chat, {
            text:
`╭┈┈⬡「 *ᴛᴇʙᴀᴋ ꜱᴜʀᴀʜ* 」
┃
┃ ✧ ᴅᴇɴɢᴀʀᴋᴀɴ ᴀᴜᴅɪᴏ & ᴛᴇʙᴀᴋ ɴᴀᴍᴀ ꜱᴜʀᴀʜɴʏᴀ!
┃
┃ ✧ *ᴀʏᴀᴛ ᴋᴇ*  » ${ayahNum}
┃ ✧ *ǫᴀʀɪ*    » ${qari}
┃ ✧ *ᴡᴀᴋᴛᴜ*    » 90 ᴅᴇᴛɪᴋ
┃
┃ ✧ ᴋᴇᴛɪᴋ ɴᴀᴍᴀ ꜱᴜʀᴀʜ (ɪɴɢɢʀɪꜱ/ᴀʀᴀʙ)
┃ ✧ *ᴄᴏɴᴛᴏʜ:* ᴀʟ-ꜰᴀᴛɪʜᴀʜ / ᴀʟ-ʙᴀǫᴀʀᴀʜ
┃
┃ ✧ ᴀᴛᴀᴜ ᴋᴇᴛɪᴋ *ɴʏᴇʀᴀʜ* ᴜɴᴛᴜᴋ ᴍᴇɴʏᴇʀᴀʜ
╰┈┈┈┈┈┈┈┈⬡
_© ${config.copyrightName}_`
        }, { quoted: m.raw });
        const audioRes = await fetch(r.audio, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const mp3Buffer = Buffer.from(await audioRes.arrayBuffer());
        let audioBuffer, mimetype, ptt;
        try {
            audioBuffer = mp3ToOpus(mp3Buffer);
            mimetype = 'audio/ogg; codecs=opus';
            ptt = true;
        } catch {
            audioBuffer = mp3Buffer;
            mimetype = 'audio/mpeg';
            ptt = false;
        }
        await conn.sendMessage(m.chat, { audio: audioBuffer, mimetype, ptt }, { quoted: m.raw });
        setTimeout(async () => {
            const s = activeSessions.get(m.chat);
            if (s && s.expireAt <= Date.now()) {
                activeSessions.delete(m.chat);
                try {
                    await conn.sendMessage(m.chat, {
                        text: ` Waktu habis! Surah: ${s.surahName} (${s.surahAr})`
                    });
                } catch {}
            }
        }, TIMEOUT_MS + 500);
    } catch (e) {
        await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ɢᴀɢᴀʟ ᴀᴍʙɪʟ ꜱᴏᴀʟ: ${e.message}\n╰┈┈┈┈┈┈┈┈⬡`);
    }
};
handler.help = ['tebaksurah'];
handler.tags = ['games'];
handler.command = /^(tebaksurah|ts)$/i;
handler.onText = async (m) => {
    const session = activeSessions.get(m.chat);
    if (!session) return false;
    if (session.expireAt <= Date.now()) return false;
    const raw = m.body.trim();
    if (raw.startsWith('.') || raw.startsWith('!')) return false;
    const tebakan = raw.toUpperCase();
    if (tebakan === 'NYERAH') {
        activeSessions.delete(m.chat);
        await m.reply(`╭┈┈⬡「 *ᴍᴇɴʏᴇʀᴀʜ!* ꜱᴜʀᴀʜɴʏᴀ: *${session.surahName}* (${session.surahAr})* 」\n┃\n┃ ✧ ᴋᴇᴛɪᴋ *.ᴛᴇʙᴀᴋꜱᴜʀᴀʜ* ᴜɴᴛᴜᴋ ꜱᴏᴀʟ ʙᴀʀᴜ!\n╰┈┈┈┈┈┈┈┈⬡`);
        return true;
    }
    const isBenar = normalize(tebakan) === normalize(session.jawabanEn) || raw === session.jawabanAr;
    if (isBenar) {
        activeSessions.delete(m.chat);
        await m.reply(`╭┈┈⬡「 *ʙᴇɴᴀʀ!* ꜱᴜʀᴀʜɴʏᴀ *${session.surahName}* (${session.surahAr}), ᴀʀᴛɪɴʏᴀ "${session.translation}".* 」\n┃\n┃ ✧ ᴋᴇᴛɪᴋ *.ᴛᴇʙᴀᴋꜱᴜʀᴀʜ* ᴜɴᴛᴜᴋ ꜱᴏᴀʟ ʙᴀʀᴜ!\n╰┈┈┈┈┈┈┈┈⬡`);
        return true;
    }
    const lastWrong = session.lastWrong[m.sender] || 0;
    if (Date.now() - lastWrong < 5000) return true;
    session.lastWrong[m.sender] = Date.now();
    const sisaDetik = Math.max(0, Math.ceil((session.expireAt - Date.now()) / 1000));
    await m.reply(`╭┈┈⬡「 *${raw}* ʙᴜᴋᴀɴ ᴊᴀᴡᴀʙᴀɴɴʏᴀ~ (ꜱɪꜱᴀ ${sisaDetik} ᴅᴇᴛɪᴋ)* 」\n┃\n┃ ✧ ᴄᴏʙᴀ ʟᴀɢɪ ᴀᴛᴀᴜ ᴋᴇᴛɪᴋ *ɴʏᴇʀᴀʜ*\n╰┈┈┈┈┈┈┈┈⬡`);
    return true;
};
handler.limit = true;
export default handler;
