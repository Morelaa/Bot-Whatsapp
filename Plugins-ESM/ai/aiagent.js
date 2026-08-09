'use strict';
import axios from 'axios';
import yts from 'yt-search';
import { getYoutubeResources, pickAudio } from '../../Library/vidssave.js';
import fs from 'fs';
import os from 'os';
import { spawn } from 'child_process';
import crypto from 'crypto';
import { writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';
import config from '../../config.js';
import { buildFkontak } from '../../Library/utils.js';
import { isMainOwner, getMainOwnerNumber } from '../../System/mainowner.js';
import { checkMainOwner } from '../../Core/permissions.js';
import { isLidJid, resolveLidToPhone, mapSenderLid, normNum } from '../../Library/resolve.js';
import { findMediaMessage, downloadMessageMedia } from '../../Library/handle.js';
import sharp from 'sharp';
import pluginManager from '../_pluginmanager.js';
const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const BOT_ROOT    = path.resolve(__dirname, '../..');
const PLUGIN_ROOT = path.resolve(__dirname, '..');
if (!globalThis.__aiAgentHistory__)   globalThis.__aiAgentHistory__   = {};
if (!globalThis.__aiAgentHistoryTs__) globalThis.__aiAgentHistoryTs__ = {};
if (!globalThis.__aiAgentLock__)      globalThis.__aiAgentLock__      = new Set();
const _AI_HISTORY_TTL_MS   = 6 * 60 * 60 * 1000;
const _AI_HISTORY_MAX_KEYS = 200;
if (!globalThis.__aiAgentCleanupTimer__) {
    globalThis.__aiAgentCleanupTimer__ = setInterval(() => {
        try {
            const now  = Date.now();
            const ts   = globalThis.__aiAgentHistoryTs__;
            const hist = globalThis.__aiAgentHistory__;
            let cleaned = 0;
            for (const key of Object.keys(ts)) {
                if (now - (ts[key] || 0) > _AI_HISTORY_TTL_MS) {
                    delete hist[key];
                    delete ts[key];
                    cleaned++;
                }
            }
            const keys = Object.keys(ts).sort((a, b) => (ts[a] || 0) - (ts[b] || 0));
            if (keys.length > _AI_HISTORY_MAX_KEYS) {
                const excess = keys.slice(0, keys.length - _AI_HISTORY_MAX_KEYS);
                for (const k of excess) { delete hist[k]; delete ts[k]; cleaned++; }
            }
            if (cleaned > 0) console.log(`[AI-AGENT] Cleanup: ${cleaned} history basi dihapus`);
        } catch {  }
    }, 30 * 60 * 1000);
}
const OPENROUTER_API_KEY = config.apiKeys?.openrouter;
const MODEL_ID    = 'openrouter/free';
const MODEL_LABEL = '🚀 Google Lyria 3 Pro';
const SYSTEM_PROMPT_BASE = `Kamu adalah ${config.botName}, asisten AI WhatsApp buatan ${config.ownerName || config.botName}. Jangan pernah mengaku Claude/GPT/Gemini/AI lain - kamu HANYA ${config.botName}.

ATURAN TOOL (WAJIB, PALING PENTING):
- Kalau ada tool yang cocok dengan permintaan user → LANGSUNG panggil tool itu di respons ini juga. JANGAN menjelaskan dulu, JANGAN nanya konfirmasi untuk tool baca/cari data.
- JANGAN PERNAH mengarang/menebak isi kode, fitur, atau plugin dari ingatan sendiri. Kalau ada tool untuk mengambil data itu, WAJIB panggil dulu - jawaban HARUS berdasarkan hasil tool, bukan asumsi.
- download_music → panggil segera kalau user sebut lagu/artis/mp3, tanpa nanya "lagu apa?" dulu. File OTOMATIS terkirim setelah tool ini jalan - jangan pernah nanya "mau didownload?" atau "lanjut download?", karena file sudah/akan langsung terkirim.
- download_video → panggil segera kalau ada link TikTok/IG/YT/Twitter atau kata "download video/reels/shorts". File OTOMATIS terkirim setelah tool ini jalan, jangan tanya konfirmasi apapun.
- edit_image → panggil segera kalau user kirim/reply gambar DAN minta gambarnya diubah/diedit (ganti background, ubah gaya, tambah/hapus objek, dll). Gambar hasil edit OTOMATIS terkirim setelah tool ini jalan, jangan nanya konfirmasi. Kalau user cuma nanya ISI gambar (bukan minta diedit), JANGAN panggil tool ini - langsung deskripsikan/jawab dari gambar yang kamu lihat sendiri (kamu bisa melihat gambar yang dikirim/di-reply user).

FORMAT WHATSAPP (WAJIB):
- DILARANG pakai *bold*, **bold**, _italic_, #/##/### heading, atau markdown apapun.
- Tulis kalimat normal (huruf besar di awal kalimat/nama saja, seperti EYD biasa). JANGAN menulis satu kalimat atau paragraf penuh dengan HURUF KAPITAL SEMUA - itu susah dibaca.
- Kalau perlu menekankan SATU kata kunci pendek saja boleh huruf kapital (maksimal 1-3 kata), sisanya tetap huruf normal.
- Pakai emoji (🔹 ✅ 📌 🎯) sebagai bullet, tanda - atau : untuk label, bukan huruf kapital untuk struktur.
- Kode WAJIB dibungkus \`\`\`bahasa\nkode\n\`\`\` - jangan pernah tulis kode di luar code block.

EJAAN & KUALITAS BAHASA (WAJIB):
- Gunakan Bahasa Indonesia baku sesuai EYD, ejaan benar, TANPA typo dan TANPA kata yang tidak ada artinya (jangan mengarang kata).
- Kalau ragu dengan istilah tertentu, pakai kata yang lebih umum/sederhana dan sudah pasti benar ejaannya.
- Baca ulang respons secara internal sebelum menjawab: pastikan setiap kata adalah kata baku Bahasa Indonesia yang benar-benar ada.

GAYA JAWABAN:
- Bahasa Indonesia, langsung ke inti, singkat dan padat - jangan bertele-tele.
- Jawab HANYA apa yang ditanya. Jangan jelaskan fitur lain yang tidak diminta.
Respond SELALU dalam bahasa Indonesia kecuali user pakai bahasa lain.`;
const SYSTEM_PROMPT_MAIN_OWNER = `

═══════════════════════════════════════════════════
  MODE MAIN OWNER - AKSES PENUH SERVER
═══════════════════════════════════════════════════

Tool tambahan: list_files, read_file, get_plugin, find_plugin, write_plugin, edit_file, scan_and_count, check_logs, analyze_error, run_backup.
Folder "session/" (kredensial WhatsApp) SELALU diblokir dari semua tool di atas, jangan pernah coba akses.

ATURAN PANGGIL TOOL - WAJIB LANGSUNG DIPANGGIL, TANPA NANYA DULU:

1. get_plugin(name) → kalau user sebut NAMA fitur/command/file spesifik (contoh: "cek isi hd", "lihat kode backup", "getplugin ban") → PANGGIL LANGSUNG dengan nama itu SEBAGAI SATU-SATUNYA file yang dibuka. JANGAN buka file lain yang tidak diminta.
2. find_plugin(keyword) → HANYA kalau user TIDAK tahu nama file pasti dan cuma kasih keyword umum ("ada fitur apa aja soal sticker"). Setelah dapat daftar hasil, JANGAN otomatis baca semua file - sebutkan nama file yang cocok dan biarkan user pilih salah satu.
3. read_file(filepath) → baca file di luar Plugins-ESM (root, Library/, System/, Database/, dll). Contoh: read_file("handler.js"), read_file("Library/utils.js").
4. list_files → panggil kalau ada kata: "lihat folder", "ada file apa", "isi folder", "struktur bot", "list file".
5. run_backup → panggil SEGERA kalau user minta backup/cadangkan bot, TANPA nanya konfirmasi. Ini aksi baca-only (zip lalu kirim), aman langsung eksekusi.
6. scan_and_count → panggil kalau ada kata: "hitung baris", "berapa baris kode", "scan semua file", "total kode", "LOC".
7. check_logs → panggil kalau ada kata: "cek log", "lihat error", "log terbaru", "ada error apa".
8. analyze_error → panggil kalau user paste stack trace/error, atau kata: "debug", "kenapa error", "fix error".

9. write_plugin → WAJIB KONFIRMASI DULU SEBELUM MENYIMPAN.
   Alur WAJIB:
   a. Tampilkan kode lengkap dulu ke user dalam code block.
   b. Tanya: "Simpan ke file [nama_file.js]? Ketik 'iya simpan' untuk konfirmasi."
   c. TUNGGU jawaban user.
   d. HANYA panggil write_plugin kalau user EKSPLISIT bilang: "iya", "simpan", "iya simpan", "save", "yes", "ok simpan".
   e. Kalau user tidak konfirmasi atau bilang "jangan" / "cancel" → JANGAN simpan.
   DILARANG KERAS langsung simpan hanya dari kata: "buat", "contoh", "bikin kode", "tulis kode", "buatkan fitur".
   "Buat kode" = tampilkan kode saja. "Buat dan simpan" = konfirmasi dulu.

10. edit_file → WAJIB KONFIRMASI DULU SEBELUM MENGUBAH FILE.
    Alur WAJIB:
    a. Tampilkan perubahan yang akan dilakukan (diff/preview).
    b. Tanya: "Edit file [nama_file]? Ketik 'iya edit' untuk konfirmasi."
    c. TUNGGU jawaban user.
    d. HANYA panggil edit_file kalau user EKSPLISIT bilang: "iya", "edit", "iya edit", "lanjut", "yes", "ok edit".
    e. Kalau user tidak konfirmasi → JANGAN edit.
    DILARANG KERAS langsung edit hanya dari kata: "perbaiki", "fix", "update", "benerin".
    "Perbaiki kode" = tampilkan kode yang diperbaiki dulu. "Perbaiki dan simpan" = konfirmasi dulu.

PRINSIP UTAMA WRITE/EDIT:
- "Buatkan kode X" → tampilkan kode, TANYA konfirmasi, tunggu jawaban
- "Buatkan dan simpan X" → tampilkan kode, TANYA konfirmasi, tunggu jawaban
- Konfirmasi diterima → baru simpan/edit
- TIDAK ADA pengecualian untuk rule ini

ALUR DEBUG OTOMATIS:
Kalau user bilang "ada error" tanpa paste error → check_logs dulu → lalu LANGSUNG analisis hasilnya tanpa tanya.
Kalau user paste error langsung → analyze_error langsung → kalau perlu fix kode → edit_file atau write_plugin.
Kalau log sudah ada di context (dari tool call sebelumnya) dan user minta "jelaskan" → JANGAN panggil check_logs lagi, langsung analisis dari data yang sudah ada.
Kalau log kosong → langsung bilang "tidak ada error" tanpa panggil tool lagi.

══ FORMAT PLUGIN MORELA (WAJIB DIIKUTI PERSIS) ═══════════════════════

WAJIB: Simpan sebagai file .js (JavaScript ESM). Contoh filename yang benar: "tools/bratv2.js"
DILARANG: Jangan pernah simpan sebagai .ts - project ini murni JavaScript ESM, TypeScript TIDAK didukung.

\`\`\`javascript
'use strict';
import axios from 'axios';
import config from '../../config.js';

const handler = async (m, { conn, text, args, usedPrefix, command, isOwner, isAdmin, isBotAdmin }) => {
  if (!text) return m.reply(\`Contoh: \${usedPrefix}\${command} <input>\`);
  try {
    await m.reply('hasilnya di sini');
  } catch (e) {
    m.reply(\`❌ Error: \${e.message}\`);
  }
};

handler.help    = ['namacommand <input>'];
handler.tags    = ['tools'];
handler.command = /^namacommand$/i;
handler.owner   = false;
handler.admin   = false;
handler.group   = false;
handler.premium = false;
handler.limit   = false;

export default handler;
\`\`\`

ATURAN PENTING FORMAT PLUGIN:
- SELALU tulis "export default handler" di baris paling akhir.
- handler.command WAJIB berupa REGEXP (bukan array/string!). Untuk banyak alias pakai: /^(cmd1|cmd2)$/i
- Gunakan "conn" untuk kirim pesan/media, BUKAN Morela/sock/client. Contoh: conn.sendMessage(m.chat, { image: buffer, caption: 'teks' }, { quoted: m.raw })
- Gunakan "m.reply(text)" untuk balasan teks simpel.
- handler.owner / handler.admin / handler.group / handler.premium mengatur siapa yang boleh pakai command - biarkan false kalau tidak perlu dibatasi.
- Import yang umum tersedia di project ini: axios, config dari '../../config.js', db (named export) dari '../../Database/db.js', { findMediaMessage, downloadMessageMedia } dari '../../Library/handle.js', { AIRich, ButtonV2, Toolkit } dari '../../Library/MessageBuilder.js', { buildFkontak } dari '../../Library/utils.js'.
- JANGAN import package yang tidak ada di package.json project ini.
`;
const TOOLS_BASE = [
    {
        type: 'function',
        function: {
            name: 'download_video',
            description: 'Download video dari TikTok, Instagram Reels, YouTube Shorts, Twitter/X, Facebook, dll.',
            parameters: { type: 'object', properties: { url: { type: 'string', description: 'URL video' } }, required: ['url'] },
        },
    },
    {
        type: 'function',
        function: {
            name: 'download_music',
            description: 'Cari dan download lagu/musik dari YouTube. Panggil SEGERA kalau user sebut nama lagu/artis.',
            parameters: { type: 'object', properties: { query: { type: 'string', description: 'Nama lagu atau artis' } }, required: ['query'] },
        },
    },
    {
        type: 'function',
        function: {
            name: 'edit_image',
            description: 'Edit gambar yang dikirim langsung atau di-reply user di chat ini, sesuai prompt (ubah gaya, ganti background, tambah/hapus objek, dll) pakai AI image editor. WAJIB ada gambar yang dikirim/di-reply di chat ini, kalau tidak ada gambar jangan panggil tool ini.',
            parameters: {
                type: 'object',
                properties: { prompt: { type: 'string', description: 'Instruksi edit gambar dalam bahasa natural, contoh: "ubah jadi gaya anime", "ganti background jadi pantai"' } },
                required: ['prompt'],
            },
        },
    },
];
const TOOLS_MAIN_OWNER_EXTRA = [
    {
        type: 'function',
        function: {
            name: 'list_files',
            description: 'Lihat daftar file dan folder di direktori tertentu di server bot.',
            parameters: {
                type: 'object',
                properties: { dirpath: { type: 'string', description: 'Path direktori relatif dari root bot. Default "."' } },
                required: [],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'read_file',
            description: 'Baca isi file di server bot. Bisa baca file di root (utama.js, handler.js), Library/, System/, Database/, Plugins-ESM/, dll.',
            parameters: {
                type: 'object',
                properties: {
                    filepath: { type: 'string', description: 'Path file relatif dari root bot. Contoh: "handler.js", "Library/utils.js", "System/mainowner.js"' },
                },
                required: ['filepath'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'write_plugin',
            description: 'Tulis/simpan plugin baru ke Plugins-ESM/. WAJIB menggunakan ekstensi .js. Contoh filename: "tools/bratv2.js". DILARANG pakai .ts.',
            parameters: {
                type: 'object',
                properties: {
                    filename: { type: 'string', description: 'Nama file dengan subfolder di dalam Plugins-ESM/. WAJIB ekstensi .js. Contoh: "tools/bratv2.js"' },
                    code: { type: 'string', description: 'Isi kode plugin JavaScript lengkap format Morela dengan export default & handler.command berupa RegExp.' },
                },
                required: ['filename', 'code'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'edit_file',
            description: 'Edit/ubah isi file di server bot. Bisa untuk file di root, Library/, System/, Database/, Plugins-ESM/, dll. Gunakan mode "replace" untuk ganti bagian tertentu, "overwrite" untuk ganti seluruh isi file.',
            parameters: {
                type: 'object',
                properties: {
                    filepath: { type: 'string', description: 'Path file relatif dari root bot. Contoh: "handler.js", "Plugins-ESM/tools/test.js"' },
                    mode: { type: 'string', enum: ['replace', 'overwrite'], description: '"replace" - ganti bagian teks tertentu (old_text → new_text). "overwrite" - ganti seluruh isi file dengan content baru.' },
                    old_text: { type: 'string', description: 'Teks lama yang akan diganti (hanya untuk mode "replace"). Harus unik dan persis sama dengan isi file.' },
                    new_text: { type: 'string', description: 'Teks baru pengganti old_text (hanya untuk mode "replace").' },
                    content: { type: 'string', description: 'Isi file baru secara keseluruhan (hanya untuk mode "overwrite").' },
                },
                required: ['filepath', 'mode'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'scan_and_count',
            description: 'Scan SEMUA file kode (.js, dll) di seluruh direktori bot secara rekursif dan hitung total baris kode.',
            parameters: {
                type: 'object',
                properties: {
                    extensions: { type: 'array', items: { type: 'string' }, description: 'Ekstensi file yang ingin discan. Default: [".js"]' },
                    dirpath: { type: 'string', description: 'Direktori yang ingin discan. Default: "." (root bot)' },
                    skip_dirs: { type: 'array', items: { type: 'string' }, description: 'Folder yang ingin di-skip. Default: node_modules, .git, session, data, media' },
                },
                required: [],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'check_logs',
            description: 'Baca log error/output terbaru dari file log bot (kalau ada, mis. dijalankan via PM2/nohup).',
            parameters: {
                type: 'object',
                properties: {
                    lines: { type: 'number', description: 'Berapa baris log terakhir yang ingin dibaca. Default: 50' },
                    type: { type: 'string', enum: ['error', 'out', 'all'], description: 'Jenis log. Default: all' },
                },
                required: [],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'analyze_error',
            description: 'Analisis error log/stack trace dan berikan diagnosis + solusi.',
            parameters: {
                type: 'object',
                properties: {
                    error_text: { type: 'string', description: 'Teks error, stack trace, atau log yang ingin dianalisis' },
                    context: { type: 'string', description: 'Konteks tambahan: nama file, plugin, atau situasi saat error terjadi (opsional)' },
                },
                required: ['error_text'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'find_plugin',
            description: 'Cari file berdasarkan nama file, nama command, atau kata kunci di seluruh direktori bot (termasuk root). Pencarian berdasarkan nama file MAUPUN isi file. HANYA dipakai kalau nama file/fitur belum jelas - kalau sudah jelas namanya, pakai get_plugin langsung.',
            parameters: {
                type: 'object',
                properties: { keyword: { type: 'string', description: 'Nama file, nama command, nama fitur, atau kata kunci yang dicari.' } },
                required: ['keyword'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'get_plugin',
            description: 'Ambil isi kode SATU plugin/fitur berdasarkan nama command atau nama file-nya secara langsung (tanpa pencarian). Pakai ini kalau user sudah sebut nama fitur/command spesifik, contoh: "cek isi fitur hd" → get_plugin("hd"), "lihat kode backup" → get_plugin("backup").',
            parameters: {
                type: 'object',
                properties: { name: { type: 'string', description: 'Nama command atau nama file plugin, contoh: "hd", "backup", "owner/backup".' } },
                required: ['name'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'run_backup',
            description: 'Backup seluruh folder project jadi file zip dan kirim ke DM main owner. Panggil segera kalau user minta backup/cadangkan bot, tanpa perlu konfirmasi (aksi ini aman, read-only terhadap kode).',
            parameters: { type: 'object', properties: {}, required: [] },
        },
    },
];
function getSenderNum(m, participants) {
    const raw = m.sender || m.key?.participant || m.key?.remoteJid || '';
    if (isLidJid(raw)) {
        return resolveLidToPhone(raw) || mapSenderLid(raw, participants) || '';
    }
    return normNum(raw);
}
const MAX_HISTORY = 20;
function getHistory(key) {
    const store = globalThis.__aiAgentHistory__;
    const ts = globalThis.__aiAgentHistoryTs__;
    if (!store[key]) store[key] = [];
    ts[key] = Date.now();
    return store[key];
}
function pushHistory(key, role, content) {
    const store = globalThis.__aiAgentHistory__;
    const ts = globalThis.__aiAgentHistoryTs__;
    const h = getHistory(key);
    h.push({ role, content });
    if (h.length > MAX_HISTORY) h.splice(0, 2);
    store[key] = h;
    ts[key] = Date.now();
}
function clearHistory(key) {
    globalThis.__aiAgentHistory__[key] = [];
}
async function callOpenRouter(messages, tools = null) {
    if (!OPENROUTER_API_KEY) throw new Error('API key openrouter belum diisi. Isi config.apiKeys.openrouter dulu.');
    const body = {
        model: MODEL_ID,
        messages,
        max_tokens: 2048,
        temperature: 0.7,
    };
    if (tools && tools.length > 0) {
        body.tools = tools;
        body.tool_choice = 'auto';
    }
    const res = await axios.post('https://openrouter.ai/api/v1/chat/completions', body, {
        headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://wa.me',
            'X-Title': `${config.botName} Agent`,
        },
        timeout: 60000,
    });
    return res.data?.choices?.[0]?.message || null;
}
function parseXmlToolCall(content) {
    if (!content) return null;
    const toolCallMatch = content.match(/<tool_call>[\s\S]*?<function=([\w]+)>([\s\S]*?)<\/function>[\s\S]*?<\/tool_call>/i);
    if (toolCallMatch) {
        const name = toolCallMatch[1];
        const body = toolCallMatch[2];
        const args = {};
        for (const pm of body.matchAll(/<parameter=([\w]+)>([\s\S]*?)<\/parameter>/gi)) {
            let val = pm[2].trim();
            try { val = JSON.parse(val); } catch {  }
            args[pm[1]] = val;
        }
        return { name, args };
    }
    const jsonMatch = content.match(/```(?:json)?\s*({[\s\S]*?})\s*```/);
    if (jsonMatch) {
        try {
            const parsed = JSON.parse(jsonMatch[1]);
            if (parsed.function_name || parsed.name) {
                return {
                    name: parsed.function_name || parsed.name,
                    args: typeof parsed.arguments === 'string' ? JSON.parse(parsed.arguments) : (parsed.arguments || parsed.args || parsed.parameters || {}),
                };
            }
        } catch {  }
    }
    const invokeMatch = content.match(/<invoke name="([^"]+)">([\s\S]*?)<\/invoke>/i);
    if (invokeMatch) {
        const name = invokeMatch[1];
        const args = {};
        for (const pm of invokeMatch[2].matchAll(/<parameter name="([^"]+)">([\s\S]*?)<\/parameter>/gi)) {
            let val = pm[2].trim();
            try { val = JSON.parse(val); } catch {  }
            args[pm[1]] = val;
        }
        return { name, args };
    }
    return null;
}
const HARD_BLOCKED_DIRS = new Set(['session', '.git']);
const BINARY_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp3', '.mp4', '.ttf', '.woff', '.woff2', '.zip', '.bin', '.db', '.db-shm', '.db-wal'];
function isPathBlocked(resolvedAbsPath) {
    const rel = path.relative(BOT_ROOT, resolvedAbsPath);
    const firstSeg = rel.split(path.sep)[0];
    return HARD_BLOCKED_DIRS.has(firstSeg);
}
async function toolDownloadVideo(url) {
    try {
        const baseHeaders = {
            accept: '*/*',
            'content-type': 'application/json',
            origin: 'https://downr.org',
            referer: 'https://downr.org/',
            'user-agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/144.0.0.0 Mobile Safari/537.36',
        };
        const baseCookie = '_ga=GA1.1.536005378.1770437315';
        let cookie = baseCookie;
        try {
            const sessRes = await axios.get('https://downr.org/.netlify/functions/analytics', {
                headers: { ...baseHeaders, cookie: baseCookie }, timeout: 8000,
            });
            const sess = sessRes.headers['set-cookie']?.[0]?.split(';')[0];
            if (sess) cookie = `${baseCookie}; ${sess}`;
        } catch {  }
        const { data } = await axios.post('https://downr.org/.netlify/functions/nyt', { url }, {
            headers: { ...baseHeaders, cookie }, timeout: 20000,
        });
        if (!data?.medias?.length) return { text: '❌ Gagal download: media tidak ditemukan' };
        const videos = data.medias.filter((v) => v.type === 'video');
        const audios = data.medias.filter((v) => v.type === 'audio');
        const images = data.medias.filter((v) => v.type === 'image');
        const bestVid = videos.find((v) => v.quality === 'no_watermark') || videos.find((v) => v.quality === 'hd_no_watermark') || videos[0];
        if (bestVid) return { text: `🎬 *${data.title || 'Video'}*\n👤 ${data.author || '-'}\n\n✅ Sedang dikirim...`, media: { type: 'video', url: bestVid.url, caption: data.title || '' } };
        if (audios[0]) return { text: `🎵 *${data.title || 'Audio'}*\n\n✅ Sedang dikirim...`, media: { type: 'audio', url: audios[0].url } };
        if (images[0]) return { text: `🖼️ *${data.title || 'Image'}*\n\n✅ Sedang dikirim...`, media: { type: 'image', url: images[0].url } };
        return { text: 'ℹ️ Media ditemukan tapi format tidak bisa dikirim.' };
    } catch (e) {
        return { text: `❌ Error download video: ${e.message}` };
    }
}
async function toolDownloadMusic(query) {
    try {
        const searchRes = await yts(query);
        const video = searchRes?.all?.find((v) => v.type === 'video') || searchRes?.videos?.[0];
        if (!video) return { text: `❌ Lagu "${query}" tidak ditemukan.` };
        const { title, resources } = await getYoutubeResources(video.url);
        const chosen = pickAudio(resources);
        if (!chosen) return { text: `ℹ️ Ditemukan: *${video.title}*\nTapi tidak ada audio yang bisa diunduh.` };
        return {
            text: `🎵 *${title || video.title}*\n👤 ${video.author?.name || '-'}\n⏱️ ${video.timestamp || '-'}\n\n✅ Sedang dikirim...`,
            media: {
                type: 'audio',
                url: chosen.download_url,
                format: chosen.format,
                title: title || video.title,
                artist: video.author?.name || '-',
                duration: video.timestamp || '-',
                thumb: video.thumbnail || null,
            },
        };
    } catch (e) {
        return { text: `❌ Error cari lagu: ${e.message}` };
    }
}
const EDIT_SPACE_BASE = 'https://sneak-moose-pro-realism-edit-studio.hf.space';
function editGetTokenList() {
    const raw = config.apiKeys?.huggingface;
    const extra = Array.isArray(raw) ? raw.filter(Boolean) : raw ? [raw] : [];
    return [null, ...extra];
}
function editAuthHeaders(token) {
    return token ? { Authorization: `Bearer ${token}` } : {};
}
async function editGetSpaceConfig(token) {
    const res = await axios.get(`${EDIT_SPACE_BASE}/config`, { timeout: 20000, headers: editAuthHeaders(token) });
    return res.data;
}
function editFindEndpoint(cfg) {
    const deps = (cfg.dependencies || []).filter((d) => d.api_name);
    const named = deps.find((d) => /predict|edit|generate|run/i.test(d.api_name));
    if (named) return named;
    return deps.sort((a, b) => (b.inputs?.length || 0) - (a.inputs?.length || 0))[0];
}
async function editUploadImage(buffer, token, filename = 'image.jpg') {
    const form = new FormData();
    form.append('files', new Blob([buffer], { type: 'image/jpeg' }), filename);
    const res = await axios.post(`${EDIT_SPACE_BASE}/gradio_api/upload`, form, { timeout: 60000, headers: editAuthHeaders(token) });
    const p = Array.isArray(res.data) ? res.data[0] : res.data;
    if (!p) throw new Error('Space tidak mengembalikan path upload.');
    return { path: p, url: `${EDIT_SPACE_BASE}/gradio_api/file=${p}`, orig_name: filename, meta: { _type: 'gradio.FileData' } };
}
function editClampDimension(value, min = 256, max = 2048, multiple = 64) {
    const rounded = Math.round(value / multiple) * multiple;
    return Math.min(max, Math.max(min, rounded));
}
async function editPadToSquare(buffer) {
    const meta = await sharp(buffer).metadata();
    const origW = meta.width || 1024;
    const origH = meta.height || 1024;
    const size = editClampDimension(Math.max(origW, origH));
    const scale = Math.min(size / origW, size / origH);
    const placedW = Math.max(1, Math.round(origW * scale));
    const placedH = Math.max(1, Math.round(origH * scale));
    const offsetX = Math.floor((size - placedW) / 2);
    const offsetY = Math.floor((size - placedH) / 2);
    const resized = await sharp(buffer).resize(placedW, placedH).toBuffer();
    const padded = await sharp({
        create: { width: size, height: size, channels: 3, background: { r: 255, g: 255, b: 255 } },
    })
        .composite([{ input: resized, left: offsetX, top: offsetY }])
        .jpeg()
        .toBuffer();
    return {
        buffer: padded,
        size,
        region: { left: offsetX / size, top: offsetY / size, width: placedW / size, height: placedH / size },
        origW,
        origH,
    };
}
async function editUnpadResult(resultBuffer, padInfo, origW, origH) {
    const meta = await sharp(resultBuffer).metadata();
    const outW = meta.width || padInfo.size;
    const outH = meta.height || padInfo.size;
    const left = Math.max(0, Math.round(padInfo.region.left * outW));
    const top = Math.max(0, Math.round(padInfo.region.top * outH));
    const width = Math.max(1, Math.min(outW - left, Math.round(padInfo.region.width * outW)));
    const height = Math.max(1, Math.min(outH - top, Math.round(padInfo.region.height * outH)));
    return sharp(resultBuffer)
        .extract({ left, top, width, height })
        .resize(origW, origH)
        .jpeg()
        .toBuffer();
}
async function editCallPredict(apiName, dataArray, token) {
    const postRes = await axios.post(
        `${EDIT_SPACE_BASE}/gradio_api/call/${apiName}`,
        { data: dataArray },
        { timeout: 30000, headers: { 'Content-Type': 'application/json', ...editAuthHeaders(token) } }
    );
    const eventId = postRes.data?.event_id;
    if (!eventId) throw new Error('Space tidak mengembalikan event_id (kemungkinan quota GPU habis atau perlu login).');
    const streamRes = await axios.get(`${EDIT_SPACE_BASE}/gradio_api/call/${apiName}/${eventId}`, {
        responseType: 'text',
        timeout: 180000,
        headers: editAuthHeaders(token),
    });
    const text = String(streamRes.data);
    const blocks = [...text.matchAll(/event:\s*(\w+)[^\n]*\ndata:\s*(.*)/g)];
    const errorEvt = blocks.find((b) => b[1] === 'error');
    if (errorEvt) {
        const rawMsg = errorEvt[2].slice(0, 300);
        if (/quota|zerogpu|gpu.{0,20}(exceed|limit)|rate.?limit|too many requests|^null$/i.test(rawMsg)) {
            throw new Error('QUOTA_HABIS');
        }
        throw new Error(`Space mengembalikan error: ${rawMsg}`);
    }
    const completeEvt = [...blocks].reverse().find((b) => b[1] === 'complete');
    if (!completeEvt) throw new Error('Event "complete" tidak ditemukan di response stream (format space mungkin beda).');
    return JSON.parse(completeEvt[2]);
}
function editIsQuotaError(e) {
    const status = e?.response?.status;
    const rawMsg = e?.response?.data ? JSON.stringify(e.response.data) : e.message;
    return e.message === 'QUOTA_HABIS' || status === 429 || /quota|zerogpu|gpu.{0,20}(exceed|limit)|rate.?limit/i.test(String(rawMsg));
}
async function editProcessWithToken(buffer, prompt, token) {
    const cfg = await editGetSpaceConfig(token);
    const dep = editFindEndpoint(cfg);
    if (!dep) throw new Error('Endpoint API tidak ditemukan di /config space (struktur space mungkin berubah).');
    const padInfo = await editPadToSquare(buffer);
    const uploaded = await editUploadImage(padInfo.buffer, token);
    const dataArray = [uploaded, null, prompt, 0, true, 1, 4, padInfo.size, padInfo.size];
    const output = await editCallPredict(dep.api_name, dataArray, token);
    const gallery = Array.isArray(output) ? output[0] : null;
    const resultFile = Array.isArray(gallery) ? gallery[0]?.image : null;
    const resultUrl = resultFile?.url || (resultFile?.path ? `${EDIT_SPACE_BASE}/gradio_api/file=${resultFile.path}` : null);
    if (!resultUrl) throw new Error('Response space tidak berisi gambar hasil.');
    const imgRes = await axios.get(resultUrl, { responseType: 'arraybuffer', timeout: 60000, headers: editAuthHeaders(token) });
    const rawResult = Buffer.from(imgRes.data);
    return editUnpadResult(rawResult, padInfo, padInfo.origW, padInfo.origH);
}
async function editImageWithPrompt(imageBuffer, prompt) {
    const tokens = editGetTokenList();
    let lastErr;
    for (let i = 0; i < tokens.length; i++) {
        try {
            const buffer = await editProcessWithToken(imageBuffer, prompt, tokens[i]);
            return { buffer, status: 'ok' };
        }
        catch (e) {
            lastErr = e;
            if (!editIsQuotaError(e)) throw e;
            console.log(`[AI-AGENT] editImage percobaan ${i === 0 ? 'anonim' : 'token index ' + (i - 1)} kena limit, coba berikutnya...`);
        }
    }
    throw lastErr || new Error('QUOTA_HABIS');
}
async function toolEditImage(imageBuffer, prompt) {
    if (!imageBuffer) return { text: '❌ Tidak ada gambar. Kirim atau reply foto dulu, baru minta edit.' };
    if (!prompt || !prompt.trim()) return { text: '❌ Prompt edit kosong. Contoh: "ubah jadi gaya anime".' };
    try {
        const { buffer, status } = await editImageWithPrompt(imageBuffer, prompt);
        return {
            text: `✅ Gambar berhasil diedit.\nPrompt: ${prompt}`,
            media: { type: 'image', buffer },
        };
    } catch (e) {
        return { text: `❌ Gagal edit gambar: ${e.message}` };
    }
}
async function toolListFiles(dirpath = '.') {
    try {
        const resolved = path.resolve(BOT_ROOT, dirpath);
        if (!resolved.startsWith(BOT_ROOT)) return { text: '❌ Akses ditolak.' };
        if (isPathBlocked(resolved)) return { text: '🔒 Folder ini diblokir demi keamanan (kredensial WhatsApp).' };
        if (!fs.existsSync(resolved)) return { text: `❌ Direktori tidak ditemukan: ${dirpath}` };
        if (!fs.statSync(resolved).isDirectory()) return { text: `❌ ${dirpath} bukan direktori.` };
        const SKIP = new Set(['.git', 'node_modules', '.DS_Store', '__pycache__', 'session']);
        const items = fs.readdirSync(resolved, { withFileTypes: true });
        const dirs = [];
        const files = [];
        for (const item of items) {
            if (SKIP.has(item.name)) continue;
            item.isDirectory() ? dirs.push(`📁 ${item.name}/`) : files.push(`📄 ${item.name}`);
        }
        const list = [...dirs.sort(), ...files.sort()].join('\n') || '(kosong)';
        const relPath = path.relative(BOT_ROOT, resolved) || '.';
        return { text: `📁 *${relPath}*\n\n${list}` };
    } catch (e) {
        return { text: `❌ Error list files: ${e.message}` };
    }
}
async function toolReadFile(filepath) {
    try {
        const resolved = path.resolve(BOT_ROOT, filepath);
        if (!resolved.startsWith(BOT_ROOT + path.sep) && resolved !== BOT_ROOT) return { text: '❌ Akses ditolak.' };
        if (isPathBlocked(resolved)) return { text: '🔒 File ini diblokir demi keamanan (kredensial WhatsApp).' };
        if (!fs.existsSync(resolved)) return { text: `❌ File tidak ditemukan: ${filepath}` };
        const stat = fs.statSync(resolved);
        if (stat.isDirectory()) return { text: `❌ ${filepath} adalah direktori, gunakan list_files.` };
        if (BINARY_EXTS.some((ext) => filepath.toLowerCase().endsWith(ext))) return { text: `⚠️ File binary tidak bisa dibaca: ${filepath}` };
        if (stat.size > 80 * 1024) return { text: `⚠️ File terlalu besar (${Math.round(stat.size / 1024)}KB). Max 80KB.` };
        const content = fs.readFileSync(resolved, 'utf-8');
        const relPath = path.relative(BOT_ROOT, resolved);
        return { text: `📄 *${relPath}* (${stat.size} bytes):\n\`\`\`\n${content}\n\`\`\`` };
    } catch (e) {
        return { text: `❌ Error read file: ${e.message}` };
    }
}
async function toolWritePlugin(filename, code) {
    try {
        if (!filename || !code) return { text: '❌ filename dan code tidak boleh kosong.' };
        let rel = String(filename).trim();
        rel = rel.replace(/^\.?\/*/, '').replace(/^Plugins-ESM\/+/, '');
        rel = rel.replace(/\.(ts|js)$/i, '');
        const targetPath = path.join(PLUGIN_ROOT, `${rel}.js`);
        if (!targetPath.startsWith(PLUGIN_ROOT + path.sep)) {
            return { text: '❌ Target file harus di dalam Plugins-ESM/' };
        }
        if (!code.includes('export default')) return { text: '❌ Kode tidak valid: tidak ada "export default".' };
        if (!/handler\.command\s*=\s*\//.test(code)) {
            return { text: '❌ Kode tidak valid: "handler.command" harus berupa RegExp, contoh: /^namacommand$/i (bukan array/string).' };
        }
        const result = await pluginManager.addPlugin(rel, code);
        if (!result.success) return { text: `❌ Gagal simpan plugin: ${result.error}` };
        return {
            text: `✅ *Plugin berhasil ditulis & di-load!*\n\n📄 File    : \`Plugins-ESM/${rel}.js\`\n🔧 Command : ${result.command}\n\n🔄 Plugin manager auto-reload sudah memuatnya, langsung bisa dipakai.`,
        };
    } catch (e) {
        return { text: `❌ Error write plugin: ${e.message}` };
    }
}
async function toolEditFile(filepath, mode, oldText, newText, content) {
    try {
        if (!filepath) return { text: '❌ filepath tidak boleh kosong.' };
        if (!['replace', 'overwrite'].includes(mode)) return { text: '❌ mode harus "replace" atau "overwrite".' };
        const resolved = path.resolve(BOT_ROOT, filepath);
        if (!resolved.startsWith(BOT_ROOT + path.sep) && resolved !== BOT_ROOT) {
            return { text: '❌ Akses ditolak: path di luar direktori bot.' };
        }
        if (isPathBlocked(resolved)) return { text: '🔒 File ini diblokir demi keamanan (kredensial WhatsApp).' };
        if (BINARY_EXTS.some((ext) => filepath.toLowerCase().endsWith(ext))) {
            return { text: `⚠️ Tidak bisa edit file binary: ${filepath}` };
        }
        const relPath = path.relative(BOT_ROOT, resolved);
        if (mode === 'overwrite') {
            if (!content) return { text: '❌ Parameter "content" diperlukan untuk mode overwrite.' };
            let backupInfo = '';
            if (fs.existsSync(resolved)) {
                const oldContent = fs.readFileSync(resolved, 'utf-8');
                const backupPath = resolved + '.bak';
                fs.writeFileSync(backupPath, oldContent, 'utf-8');
                backupInfo = `\n💾 Backup disimpan: \`${relPath}.bak\``;
            }
            const dir = path.dirname(resolved);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            await writeFile(resolved, content, 'utf-8');
            const newLines = content.split('\n').length;
            return { text: `✅ *File berhasil di-overwrite!*\n\n📄 File    : \`${relPath}\`\n📝 Baris   : ${newLines}${backupInfo}\n\n_(Kalau file di luar Plugins-ESM/, restart bot manual kalau perlu)_` };
        }
        if (!oldText) return { text: '❌ Parameter "old_text" diperlukan untuk mode replace.' };
        if (newText === undefined || newText === null) return { text: '❌ Parameter "new_text" diperlukan untuk mode replace.' };
        if (!fs.existsSync(resolved)) return { text: `❌ File tidak ditemukan: ${filepath}` };
        if (fs.statSync(resolved).isDirectory()) return { text: `❌ ${filepath} adalah direktori.` };
        const fileContent = fs.readFileSync(resolved, 'utf-8');
        const occurrences = fileContent.split(oldText).length - 1;
        if (occurrences === 0) {
            const trimmedOld = oldText.trim();
            const found = fileContent.includes(trimmedOld);
            return {
                text: `❌ Teks tidak ditemukan di file \`${relPath}\`.\n\n` +
                    `Versi trim: ${found ? '✅ ditemukan (mungkin ada perbedaan whitespace/indentasi)' : '❌ tetap tidak ditemukan'}.\n\n` +
                    `Tips: Gunakan "baca file ${filepath}" untuk melihat isi file yang tepat, lalu pastikan old_text persis sama.`,
            };
        }
        if (occurrences > 1) {
            return { text: `⚠️ old_text ditemukan ${occurrences}x di \`${relPath}\`.\n\nHarus unik agar edit aman. Tambahkan lebih banyak konteks di old_text agar hanya 1 kemunculan.` };
        }
        const backupPath = resolved + '.bak';
        fs.writeFileSync(backupPath, fileContent, 'utf-8');
        const updated = fileContent.replace(oldText, newText);
        await writeFile(resolved, updated, 'utf-8');
        const oldLines = oldText.split('\n').length;
        const newLines = newText.split('\n').length;
        return { text: `✅ *File berhasil diedit!*\n\n📄 File    : \`${relPath}\`\n🔄 Ganti   : ${oldLines} baris → ${newLines} baris\n💾 Backup  : \`${relPath}.bak\`\n\n_(Plugin di Plugins-ESM/ otomatis reload, file lain restart manual kalau perlu)_` };
    } catch (e) {
        return { text: `❌ Error edit file: ${e.message}` };
    }
}
async function toolScanAndCount(extensions = ['.js'], dirpath = '.', skipDirs = ['node_modules', '.git', 'dist', 'build', '__pycache__', '.DS_Store', 'session', 'data', 'media']) {
    try {
        const resolved = path.resolve(BOT_ROOT, dirpath);
        if (!resolved.startsWith(BOT_ROOT)) return { text: '❌ Akses ditolak: path di luar direktori bot.' };
        const results = [];
        const skipped = [];
        const exts = extensions.map((e) => (e.startsWith('.') ? e : `.${e}`));
        const skipSet = new Set([...skipDirs, ...HARD_BLOCKED_DIRS]);
        function walkDir(dir) {
            let entries;
            try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
            for (const entry of entries) {
                if (skipSet.has(entry.name)) continue;
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    walkDir(fullPath);
                } else if (entry.isFile()) {
                    const ext = path.extname(entry.name).toLowerCase();
                    if (!exts.includes(ext)) continue;
                    const stat = fs.statSync(fullPath);
                    if (stat.size > 500 * 1024) {
                        skipped.push(path.relative(BOT_ROOT, fullPath) + ' (>500KB)');
                        continue;
                    }
                    try {
                        const content = fs.readFileSync(fullPath, 'utf-8');
                        const lines = content.split('\n');
                        const blank = lines.filter((l) => l.trim() === '').length;
                        const code = lines.length - blank;
                        results.push({ file: path.relative(BOT_ROOT, fullPath), lines: lines.length, blank, code });
                    } catch {
                        skipped.push(path.relative(BOT_ROOT, fullPath));
                    }
                }
            }
        }
        walkDir(resolved);
        if (!results.length) return { text: `⚠️ Tidak ada file dengan ekstensi ${exts.join(', ')} ditemukan di ${dirpath}.` };
        results.sort((a, b) => b.lines - a.lines);
        const totalLines = results.reduce((s, r) => s + r.lines, 0);
        const totalCode = results.reduce((s, r) => s + r.code, 0);
        const totalBlank = results.reduce((s, r) => s + r.blank, 0);
        const totalFiles = results.length;
        const top = results.slice(0, 15);
        const topText = top.map((r, i) => `${String(i + 1).padStart(2, ' ')}. ${r.file.padEnd(45, ' ')} ${String(r.lines).padStart(5)} baris`).join('\n');
        const folderMap = {};
        for (const r of results) {
            const folder = r.file.includes('/') ? r.file.split('/')[0] : '(root)';
            folderMap[folder] = (folderMap[folder] || 0) + r.lines;
        }
        const folderText = Object.entries(folderMap)
            .sort((a, b) => b[1] - a[1])
            .map(([folder, lines]) => `  📁 ${folder}: ${lines.toLocaleString()} baris`)
            .join('\n');
        let result = '📊 *Hasil Scan Kode Bot*\n';
        result += '━━━━━━━━━━━━━━━━━━━━━━━━\n';
        result += `📁 Total File  : ${totalFiles}\n`;
        result += `📝 Total Baris : ${totalLines.toLocaleString()}\n`;
        result += `✅ Baris Kode  : ${totalCode.toLocaleString()}\n`;
        result += `⬜ Baris Kosong: ${totalBlank.toLocaleString()}\n`;
        result += `🔍 Ekstensi    : ${exts.join(', ')}\n\n`;
        result += `📂 *Breakdown per Folder:*\n${folderText}\n\n`;
        result += `🏆 *Top ${top.length} File Terbesar:*\n\`\`\`\n${topText}\n\`\`\``;
        if (skipped.length) {
            result += `\n\n⚠️ File di-skip (${skipped.length}): ${skipped.slice(0, 5).join(', ')}${skipped.length > 5 ? '...' : ''}`;
        }
        return { text: result };
    } catch (e) {
        return { text: `❌ Error scan: ${e.message}` };
    }
}
async function toolCheckLogs(lines = 50, _type = 'all') {
    try {
        const os = await import('os');
        const candidates = [
            path.join(BOT_ROOT, 'logs', 'error.log'),
            path.join(BOT_ROOT, 'logs', 'combined.log'),
            path.join(BOT_ROOT, 'error.log'),
            path.join(BOT_ROOT, 'bot.log'),
            path.join(BOT_ROOT, 'nohup.out'),
        ];
        try {
            const pm2Dir = path.join(os.homedir(), '.pm2', 'logs');
            if (fs.existsSync(pm2Dir)) {
                const keyword = String(config.botName || 'morela').toLowerCase();
                for (const f of fs.readdirSync(pm2Dir)) {
                    if (f.toLowerCase().includes(keyword)) candidates.push(path.join(pm2Dir, f));
                }
            }
        } catch {  }
        let picked = null;
        for (const p of candidates) {
            if (!fs.existsSync(p)) continue;
            try {
                const content = fs.readFileSync(p, 'utf-8');
                const arr = content.split('\n').filter(Boolean);
                const sliced = arr.slice(-lines).join('\n');
                if (sliced.trim()) { picked = { path: p, text: sliced }; break; }
            } catch {  }
        }
        if (!picked) {
            return {
                text: 'ℹ️ Tidak ada file log ditemukan.\n\nDefault Morela hanya log ke console (tidak menulis file). Kalau bot dijalankan pakai PM2 atau `nohup node launcher.js > bot.log 2>&1 &`, log akan otomatis kebaca di sini.',
            };
        }
        const trimmed = picked.text.length > 3500 ? '...(dipotong)\n' + picked.text.slice(-3500) : picked.text;
        const errorCount = (picked.text.match(/\berror\b/gi) || []).length;
        const warningCount = (picked.text.match(/\bwarn(ing)?\b/gi) || []).length;
        const summary = errorCount || warningCount ? `\n\n📊 *Summary:* ${errorCount} error, ${warningCount} warning.` : '\n\n✅ *Tidak ada error terdeteksi.*';
        return { text: `🪵 *${path.relative(BOT_ROOT, picked.path)}* (${lines} baris terakhir):\n\`\`\`\n${trimmed}\n\`\`\`${summary}` };
    } catch (e) {
        return { text: `❌ Gagal baca log: ${e.message}` };
    }
}
async function toolAnalyzeError(errorText, context = '') {
    try {
        if (!errorText?.trim()) return { text: '❌ Error text tidak boleh kosong.' };
        const detections = [];
        if (/cannot find module/i.test(errorText)) detections.push('📦 *Module tidak ditemukan* - package belum di-install atau path import salah.');
        if (/syntaxerror/i.test(errorText)) detections.push('🔤 *Syntax Error* - ada kesalahan penulisan kode (kurung, titik koma, dll).');
        if (/typeerror/i.test(errorText)) detections.push('🔢 *Type Error* - variable undefined/null atau tipe data tidak sesuai.');
        if (/econnrefused|econnreset|etimedout/i.test(errorText)) detections.push('🌐 *Network Error* - koneksi gagal, cek internet atau API endpoint.');
        if (/401|unauthorized/i.test(errorText)) detections.push('🔑 *Auth Error* - API key salah, expired, atau tidak ada izin.');
        if (/403|forbidden/i.test(errorText)) detections.push('🚫 *Forbidden* - akses ditolak oleh server.');
        if (/404/i.test(errorText)) detections.push('❓ *Not Found* - endpoint atau resource tidak ditemukan.');
        if (/429|rate.?limit/i.test(errorText)) detections.push('⏱️ *Rate Limit* - terlalu banyak request, tunggu beberapa saat.');
        if (/500|internal server/i.test(errorText)) detections.push('💥 *Server Error* - error di sisi server eksternal, bukan bot.');
        if (/heap out of memory|javascript heap/i.test(errorText)) detections.push('🧠 *Out of Memory* - bot kekurangan RAM, perlu restart atau optimasi.');
        if (/enoent/i.test(errorText)) detections.push('📂 *File Not Found* - file atau direktori yang diakses tidak ada.');
        if (/permission denied|eacces/i.test(errorText)) detections.push('🔒 *Permission Denied* - tidak ada akses baca/tulis ke file/folder.');
        if (/export default|export \{/i.test(errorText)) detections.push('📤 *Export Error* - masalah pada format export module.');
        const analysisPrompt = `Kamu adalah expert software engineer spesialis Node.js dan JavaScript ESM untuk WhatsApp Bot development.

Analisis error berikut dan berikan:
1. Root Cause - penyebab utama error (1-2 kalimat)
2. Lokasi - di bagian kode mana error kemungkinan terjadi
3. Solusi - langkah konkret untuk fix (sertakan contoh kode jika perlu)
4. Pencegahan - cara mencegah error ini terjadi lagi

${context ? `Konteks tambahan: ${context}\n` : ''}

ERROR:
\`\`\`
${errorText.substring(0, 2000)}
\`\`\`

${detections.length ? `Pre-deteksi otomatis:\n${detections.join('\n')}\n` : ''}

Jawab dalam Bahasa Indonesia baku (EYD, tanpa typo, tanpa kata yang tidak ada artinya), langsung ke poin, TANPA markdown (tanpa **, ##, dll - pakai emoji sebagai bullet, huruf kapital hanya untuk 1-3 kata kunci pendek jika perlu, JANGAN satu kalimat penuh huruf kapital). Sertakan contoh kode dalam code block kalau ada solusi berupa kode.`;
        const aiMessages = [
            { role: 'system', content: 'Kamu adalah expert Node.js/JavaScript engineer. Analisis error dengan akurat dan berikan solusi konkret.' },
            { role: 'user', content: analysisPrompt },
        ];
        const aiResponse = await callOpenRouter(aiMessages, null);
        const aiText = aiResponse?.content?.trim() || '';
        const quickDetect = detections.length ? `🔍 *Deteksi Cepat:*\n${detections.join('\n')}\n\n` : '';
        const finalText = `🧠 *Analisis Error*\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n${quickDetect}${aiText || 'Tidak dapat menganalisis error ini.'}`;
        return { text: finalText.substring(0, 4000) };
    } catch (e) {
        return { text: `❌ Gagal analisis error: ${e.message}` };
    }
}
async function toolFindPlugin(keyword) {
    try {
        if (!keyword?.trim()) return { text: '❌ Keyword tidak boleh kosong.' };
        const kw = keyword.trim().toLowerCase().replace(/\.(ts|js)$/, '');
        const matches = [];
        const skipSet = new Set(['node_modules', '.git', 'dist', 'build', ...HARD_BLOCKED_DIRS]);
        function walkDir(dir) {
            let entries;
            try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
            for (const entry of entries) {
                if (skipSet.has(entry.name)) continue;
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    walkDir(fullPath);
                } else if (entry.isFile() && entry.name.endsWith('.js')) {
                    const stat = fs.statSync(fullPath);
                    if (stat.size > 200 * 1024) continue;
                    try {
                        const content = fs.readFileSync(fullPath, 'utf-8');
                        const lower = content.toLowerCase();
                        const fileNameBase = entry.name.toLowerCase().replace(/\.js$/, '');
                        const matchByName = fileNameBase.includes(kw);
                        const matchByContent = lower.includes(kw);
                        if (!matchByName && !matchByContent) continue;
                        const relPath = path.relative(BOT_ROOT, fullPath);
                        const cmdMatch = content.match(/handler\.command\s*=\s*(\/[\s\S]*?\/[a-z]*)/);
                        const commandStr = cmdMatch ? cmdMatch[1] : '(passive/no command)';
                        const lines = content.split('\n');
                        const matchLines = [];
                        for (let i = 0; i < lines.length; i++) {
                            if (lines[i].toLowerCase().includes(kw)) {
                                const start = Math.max(0, i - 1);
                                const end = Math.min(lines.length - 1, i + 1);
                                const snippet = lines.slice(start, end + 1).map((l, idx) => `${start + idx + 1}: ${l}`).join('\n');
                                matchLines.push(snippet);
                                if (matchLines.length >= 3) break;
                            }
                        }
                        matches.push({ file: relPath, commands: commandStr, snippets: matchLines, matchByName });
                    } catch {  }
                }
            }
        }
        walkDir(BOT_ROOT);
        if (!matches.length) {
            return { text: `❌ Tidak ditemukan file yang mengandung keyword "${keyword}".\n\nKemungkinan:\n- Nama file/command salah\n- File belum ada\n- Keyword terlalu umum` };
        }
        matches.sort((a, b) => (b.matchByName ? 1 : 0) - (a.matchByName ? 1 : 0));
        let result = `🔍 *Hasil pencarian: "${keyword}"*\n`;
        result += '━━━━━━━━━━━━━━━━━━━━━━━━\n';
        result += `Ditemukan di ${matches.length} file:\n\n`;
        for (const mm of matches) {
            result += `📄 *${mm.file}*${mm.matchByName ? ' ✅ (nama file cocok)' : ''}\n`;
            result += `🔧 Command: ${mm.commands}\n`;
            if (mm.snippets.length) result += `📝 Konteks:\n\`\`\`\n${mm.snippets[0]}\n\`\`\`\n`;
            result += '\n';
        }
        result += `_Gunakan "baca file ${matches[0].file}" untuk lihat kode lengkapnya._`;
        return { text: result.substring(0, 4000) };
    } catch (e) {
        return { text: `❌ Error find plugin: ${e.message}` };
    }
}
async function toolGetPlugin(name) {
    try {
        if (!name?.trim()) return { text: '❌ Nama plugin/fitur tidak boleh kosong.' };
        const result = pluginManager.getPluginSource(name.trim());
        if (!result.success) return { text: `❌ ${result.error}\n\n_Kalau tidak tahu nama pastinya, pakai find_plugin dulu._` };
        const { rel, code } = result;
        if (code.length > 50000) {
            return { text: `📄 File *${rel}.js* (${code.length} bytes) kepanjangan buat 1 pesan.\n\nGunakan read_file("Plugins-ESM/${rel}.js") untuk baca sebagian.` };
        }
        return { text: `📄 *${rel}.js*:\n\`\`\`javascript\n${code}\n\`\`\`` };
    } catch (e) {
        return { text: `❌ Error get plugin: ${e.message}` };
    }
}
const BACKUP_IGNORE_GLOBS = [
    'node_modules/**', '.git/**', '*.zip',
    'session/**', 'sessions/**',
    'tmp/**', 'temp/**',
    '.npm/**', '.pm2/**', '.config/**',
    '.cache/**', 'logs/**',
    'package-lock.json',
];
function fmtBackupSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
async function toolRunBackup(conn, chat) {
    const zipName = `backup-bot-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}.zip`;
    const zipPath = path.join(config.rootDir, zipName);
    const mainOwnerNum = getMainOwnerNumber();
    const ownerJid = mainOwnerNum ? `${mainOwnerNum}@s.whatsapp.net` : '';
    if (!ownerJid) return { text: '❌ config.mainOwner belum diisi, tidak tahu mau kirim backup ke nomor mana.' };
    try {
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        const done = new Promise((resolve, reject) => {
            output.on('close', resolve);
            output.on('error', reject);
            archive.on('error', reject);
        });
        archive.pipe(output);
        archive.glob('**/*', { cwd: config.rootDir, ignore: BACKUP_IGNORE_GLOBS });
        await archive.finalize();
        await done;
        const stats = fs.statSync(zipPath);
        const size = fmtBackupSize(stats.size);
        await conn.sendMessage(ownerJid, {
            document: fs.readFileSync(zipPath),
            fileName: zipName,
            mimetype: 'application/zip',
            caption: `📦 Backup Bot ${config.botName}\n📏 Size: ${size}`,
        });
        return chat === ownerJid
            ? { text: `✅ Backup selesai (${size}), dikirim di chat ini.` }
            : { text: `✅ Backup selesai (${size}), dikirim ke DM main owner.` };
    } catch (e) {
        return { text: `❌ Backup gagal: ${e.message}` };
    } finally {
        try { fs.unlinkSync(zipPath); } catch {  }
    }
}
async function executeTool(name, args, isMO, ctx = {}) {
    const moOnly = new Set(['write_plugin', 'edit_file', 'read_file', 'list_files', 'scan_and_count', 'check_logs', 'analyze_error', 'find_plugin', 'get_plugin', 'run_backup']);
    if (moOnly.has(name) && !isMO) return { text: '🔒 Tool ini hanya untuk Main Owner.' };
    switch (name) {
        case 'download_video': return toolDownloadVideo(args.url);
        case 'download_music': return toolDownloadMusic(args.query);
        case 'edit_image': return toolEditImage(ctx.imageBuffer, args.prompt);
        case 'list_files': return toolListFiles(args.dirpath || '.');
        case 'read_file': return toolReadFile(args.filepath);
        case 'write_plugin': return toolWritePlugin(args.filename, args.code);
        case 'edit_file': return toolEditFile(args.filepath, args.mode, args.old_text, args.new_text, args.content);
        case 'scan_and_count': return toolScanAndCount(args.extensions, args.dirpath, args.skip_dirs);
        case 'check_logs': return toolCheckLogs(args.lines || 50, args.type || 'all');
        case 'analyze_error': return toolAnalyzeError(args.error_text, args.context || '');
        case 'find_plugin': return toolFindPlugin(args.keyword);
        case 'get_plugin': return toolGetPlugin(args.name);
        case 'run_backup': return toolRunBackup(ctx.conn, ctx.chat);
        default: return { text: `❓ Tool "${name}" tidak dikenal.` };
    }
}
function remuxAudio(buffer, ext) {
    return new Promise((resolve, reject) => {
        const id = crypto.randomBytes(6).toString('hex');
        const inPath = path.join(os.tmpdir(), `aiagent_${id}_in.${ext}`);
        const outPath = path.join(os.tmpdir(), `aiagent_${id}_out.${ext}`);
        const cleanup = () => {
            try { fs.unlinkSync(inPath); } catch { }
            try { fs.unlinkSync(outPath); } catch { }
        };
        fs.writeFileSync(inPath, buffer);
        const ff = spawn('ffmpeg', ['-i', inPath, '-vn', '-acodec', 'copy', '-y', outPath]);
        let stderr = '';
        ff.stderr?.on('data', (d) => { stderr += d.toString(); });
        const timer = setTimeout(() => { ff.kill(); cleanup(); reject(new Error('ffmpeg timeout saat remux audio')); }, 60000);
        ff.on('close', (code) => {
            clearTimeout(timer);
            if (code === 0) {
                try { const out = fs.readFileSync(outPath); cleanup(); resolve(out); }
                catch (e) { cleanup(); reject(e); }
            }
            else { cleanup(); reject(new Error(`ffmpeg remux gagal (exit ${code}): ${stderr.slice(-300)}`)); }
        });
        ff.on('error', (e) => { clearTimeout(timer); cleanup(); reject(e); });
    });
}
async function sendMedia(conn, chatId, media, quoted) {
    if (!media?.url && !media?.buffer) return;
    if (media.type === 'video') {
        const buf = await axios.get(media.url, { responseType: 'arraybuffer', timeout: 60000 }).then((r) => Buffer.from(r.data));
        await conn.sendMessage(chatId, { video: buf, caption: media.caption || '', mimetype: 'video/mp4' }, { quoted });
        return;
    }
    if (media.type === 'audio') {
        const AUDIO_EXT = { M4A: 'm4a', OPUS: 'opus', WEBM: 'weba', MP3: 'mp3' };
        const AUDIO_MIME = { M4A: 'audio/mp4', OPUS: 'audio/ogg', WEBM: 'audio/webm', MP3: 'audio/mpeg' };
        const fmt = String(media.format || 'MP3').toUpperCase();
        if (fmt === 'WEBM') throw new Error('Format WEBM/Opus dari sumber ini sering gagal diputar di WhatsApp.');
        const ext = AUDIO_EXT[fmt] || 'mp3';
        const mimetype = AUDIO_MIME[fmt] || 'audio/mpeg';
        const dlRes = await axios.get(media.url, {
            responseType: 'arraybuffer',
            timeout: 60000,
            headers: {
                Referer: 'https://id.vidssave.com/',
                Origin: 'https://id.vidssave.com',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });
        const contentType = String(dlRes.headers?.['content-type'] || '');
        let buf = Buffer.from(dlRes.data);
        if (contentType.includes('text/html') || contentType.includes('application/json') || buf.length < 10000) {
            throw new Error(`Link download audio bukan file audio yang valid (content-type: ${contentType || 'unknown'}, size: ${buf.length} bytes).`);
        }
        buf = await remuxAudio(buf, ext);
        let thumb = null;
        if (media.thumb) {
            try { thumb = await axios.get(media.thumb, { responseType: 'arraybuffer', timeout: 10000 }).then((r) => Buffer.from(r.data)); } catch {  }
        }
        await conn.sendMessage(chatId, {
            audio: buf,
            mimetype,
            ptt: false,
            fileName: `${media.title || 'audio'}.${ext}`,
            contextInfo: thumb ? {
                externalAdReply: {
                    title: media.title || 'Audio', body: media.artist ? `👤 ${media.artist}` : '',
                    thumbnail: thumb, mediaType: 1, renderLargerThumbnail: false, showAdAttribution: false,
                },
            } : undefined,
        }, { quoted });
        return;
    }
    if (media.type === 'image') {
        if (media.buffer) {
            await conn.sendMessage(chatId, { image: media.buffer }, { quoted });
        } else {
            await conn.sendMessage(chatId, { image: { url: media.url } }, { quoted });
        }
    }
}
const delay = (ms) => new Promise((res) => setTimeout(res, ms));
function hasCodeBlock(text) {
    return /```[a-zA-Z]*\n[\s\S]*?```/.test(text);
}
function stripMarkdown(text) {
    if (!text) return text;
    const parts = text.split(/(```[\s\S]*?```|`[^`\n]+`)/g);
    return parts.map((part, i) => {
        if (i % 2 === 1) return part;
        return part
            .replace(/^#{1,6}\s+/gm, '')
            .replace(/\*\*([\s\S]*?)\*\*/g, '$1')
            .replace(/(?<!\w)\*([^*\n]+?)\*(?!\w)/g, '$1')
            .replace(/__([\s\S]*?)__/g, '$1')
            .replace(/(?<!\w)_([^_\n]+?)_(?!\w)/g, '$1')
            .replace(/^[ \t]*[*-]\s+/gm, '🔹 ')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/\*+/g, '');
    }).join('').trim();
}
async function sendPlainReply(conn, jid, text, quoted) {
    try {
        const clean = (text || '').trim();
        if (!clean) return false;
        await conn.sendMessage(jid, { text: clean }, { quoted });
        return true;
    } catch {
        return false;
    }
}
const toolLoadMsg = {
    download_video: '🎬 Sedang mengunduh video...',
    download_music: '🎵 Sedang mencari lagu...',
    edit_image: '🎨 Sedang mengedit gambar...',
    list_files: '📁 Membaca struktur folder server...',
    read_file: '📄 Membuka file...',
    write_plugin: '📝 Menulis plugin ke server...',
    edit_file: '✏️ Mengedit file...',
    scan_and_count: '🔍 Memindai semua file kode... (mungkin butuh beberapa detik)',
    check_logs: '🪵 Membaca log terbaru...',
    analyze_error: '🧠 Menganalisis error...',
    find_plugin: '🔍 Mencari plugin...',
    get_plugin: '📄 Membuka file...',
    run_backup: '📦 Membuat backup...',
};
const DIRECT_SEND_TOOLS = new Set(['write_plugin', 'edit_file', 'scan_and_count', 'analyze_error', 'run_backup', 'download_music', 'download_video', 'edit_image']);
const SILENT_TOOLS = new Set(['read_file', 'list_files', 'check_logs', 'get_plugin']);
const handler = async (m, { conn, participants }) => {
    if (!checkMainOwner(m, participants)) return;
    const userId = m.sender || m.key?.participant || '';
    const histKey = `${m.chat}:${userId}`;
    clearHistory(histKey);
    const fkontak = await buildFkontak(conn, config);
    await conn.sendMessage(m.chat, { text: '🧹 History percakapan Morela sudah direset. Siap melanjutkan dari awal.' }, { quoted: fkontak || m.raw });
};
handler.command = /^(reset|lupa|forget|clear)$/i;
handler.tags = ['ai'];
handler.group = false;
handler.admin = false;
handler.noLimit = true;
handler.help = ['reset - reset history percakapan dengan Morela AI'];
const WAKE_WORD_RE = /\bmorela\b/i;
const PREFIX_CHARS = new Set((config.prefix && config.prefix.length ? config.prefix : ['.', '!', '#', '/']));
handler.onText = async (m, { conn, participants }) => {
    let lockKey = null;
    try {
        if (!m.message) return false;
        if (m.message?.reactionMessage) return false;
        if (m.message?.protocolMessage) return false;
        if (m.message?.senderKeyDistributionMessage) return false;
        if (m.chat === 'status@broadcast') return false;
        if (m.fromMe) return false;
        const text = m.text || m.body || '';
        if (!text) return false;
        const trimmed = text.trim();
        if (!trimmed) return false;
        if (PREFIX_CHARS.has(trimmed[0])) return false;
        if (/^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&©^,🐤🗿]/i.test(trimmed)) return false;
        const isMO = checkMainOwner(m, participants);
        if (!isMO) return false;
        const userId = m.sender || m.key?.participant || '';
        const histKey = `${m.chat}:${userId}`;
        const fkontak = await buildFkontak(conn, config);
        const quoted = fkontak || m.raw;
        if (!WAKE_WORD_RE.test(trimmed)) return false;
        lockKey = `${m.chat}:${userId}`;
        if (globalThis.__aiAgentLock__.has(lockKey)) return false;
        globalThis.__aiAgentLock__.add(lockKey);
        const media = findMediaMessage(m);
        const hasImage = media?.type === 'imageMessage';
        let imageBuffer = null;
        if (hasImage) {
            try { imageBuffer = await downloadMessageMedia(m, conn); }
            catch (e) { console.error('[AI-AGENT] gagal download gambar:', e.message); }
        }
        const editImageMatch = hasImage && imageBuffer && /\b(edit|ubah|ubahin|editin|ganti|gantiin|hapus|hilangkan|tambah(?:in|kan)?)\b/i.test(trimmed);
        if (editImageMatch) {
            const editPrompt = trimmed.replace(WAKE_WORD_RE, ' ').replace(/\s+/g, ' ').trim() || 'perbaiki dan percantik gambar ini';
            await conn.sendMessage(m.chat, { text: '🎨 Sedang mengedit gambar...' }, { quoted });
            const result = await toolEditImage(imageBuffer, editPrompt);
            pushHistory(histKey, 'user', text);
            pushHistory(histKey, 'assistant', result.text);
            await conn.sendMessage(m.chat, { text: result.text }, { quoted });
            if (result.media) {
                try { await sendMedia(conn, m.chat, result.media, quoted); }
                catch (e) { console.error('[AI-AGENT] media error:', e.message); }
            }
            return true;
        }
        const musicMatch = trimmed.match(/\b(?:cari(?:in|kan)?|download(?:in)?|dl|putar(?:kan)?|unduh(?:kan)?)\s+(?:lagu|musik|music|mp3)\s+(.+)/i);
        if (musicMatch) {
            const query = musicMatch[1]
                .replace(WAKE_WORD_RE, '')
                .replace(/\b(aja|dong|ya|deh|nih|please|plis|dulu)\b/gi, '')
                .replace(/\s+/g, ' ')
                .trim();
            if (query) {
                await conn.sendMessage(m.chat, { text: '🎵 Sedang mencari lagu...' }, { quoted });
                const result = await toolDownloadMusic(query);
                pushHistory(histKey, 'user', text);
                pushHistory(histKey, 'assistant', result.text);
                await conn.sendMessage(m.chat, { text: result.text }, { quoted });
                if (result.media) {
                    try { await sendMedia(conn, m.chat, result.media, quoted); }
                    catch (e) { console.error('[AI-AGENT] media error:', e.message); }
                }
                return true;
            }
        }
        const urlMatch = trimmed.match(/https?:\/\/[^\s]+/i);
        if (urlMatch && /(tiktok\.com|instagram\.com|youtube\.com|youtu\.be|twitter\.com|x\.com|facebook\.com|fb\.watch)/i.test(urlMatch[0])) {
            await conn.sendMessage(m.chat, { text: '🎬 Sedang mengunduh video...' }, { quoted });
            const result = await toolDownloadVideo(urlMatch[0]);
            pushHistory(histKey, 'user', text);
            pushHistory(histKey, 'assistant', result.text);
            await conn.sendMessage(m.chat, { text: result.text }, { quoted });
            if (result.media) {
                try { await sendMedia(conn, m.chat, result.media, quoted); }
                catch (e) { console.error('[AI-AGENT] media error:', e.message); }
            }
            return true;
        }
        if (isMO) {
            if (/\b(backup|cadangkan|back\s*up)\b/i.test(trimmed)) {
                await conn.sendMessage(m.chat, { text: '📦 Membuat backup...' }, { quoted });
                const result = await toolRunBackup(conn, m.chat);
                pushHistory(histKey, 'user', text);
                pushHistory(histKey, 'assistant', result.text);
                await conn.sendMessage(m.chat, { text: result.text }, { quoted });
                return true;
            }
            const gpMatch = trimmed.match(/\b(?:cek|lihat|liat|buka|baca)\s+(?:isi\s+)?(?:fitur|plugin|kode|file)\s+([a-z0-9_\-\/]+)/i);
            if (gpMatch) {
                const pluginName = gpMatch[1];
                const gpResult = await toolGetPlugin(pluginName);
                pushHistory(histKey, 'user', text);
                pushHistory(histKey, 'assistant', gpResult.text);
                const sent = await sendPlainReply(conn, m.chat, gpResult.text, quoted);
                if (!sent) await conn.sendMessage(m.chat, { text: gpResult.text }, { quoted });
                return true;
            }
        }
        const systemPrompt = isMO ? SYSTEM_PROMPT_BASE + SYSTEM_PROMPT_MAIN_OWNER : SYSTEM_PROMPT_BASE;
        const tools = isMO ? [...TOOLS_BASE, ...TOOLS_MAIN_OWNER_EXTRA] : TOOLS_BASE;
        const history = getHistory(histKey);
        const userContent = (hasImage && imageBuffer)
            ? [
                { type: 'text', text },
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBuffer.toString('base64')}` } },
            ]
            : text;
        const messages = [
            { role: 'system', content: systemPrompt },
            ...history,
            { role: 'user', content: userContent },
        ];
        await conn.sendPresenceUpdate('composing', m.chat);
        const MAX_CHAIN = 6;
        let mediaToSend = null;
        let finalResponseText = '';
        let rawResponseText = '';
        const collectedResults = [];
        const sendLoad = async (toolName, toolArgs) => {
            if (SILENT_TOOLS.has(toolName)) return;
            const loadText = toolName === 'write_plugin'
                ? `📝 Sedang menulis plugin ${toolArgs.filename || ''}...`
                : toolName === 'edit_file'
                ? `✏️ Sedang mengedit file ${toolArgs.filepath || ''}...`
                : toolLoadMsg[toolName] || `🔧 Memproses ${toolName}...`;
            await conn.sendMessage(m.chat, { text: loadText }, { quoted });
        };
        const extractToolCall = (msg) => {
            if (msg.tool_calls?.length) {
                const tc = msg.tool_calls[0];
                try { return { name: tc.function.name, args: JSON.parse(tc.function.arguments) }; }
                catch { return { name: tc.function.name, args: {} }; }
            }
            const xml = parseXmlToolCall(msg.content || '');
            if (xml) return { name: xml.name, args: xml.args };
            return null;
        };
        const buildFollowUp = () => {
            const ctx = collectedResults.map((r) => `[HASIL ${r.name.toUpperCase()}]:\n${r.result}`).join('\n\n');
            return [
                ...messages,
                {
                    role: 'user',
                    content: `${text}\n\n--- DATA DARI SERVER ---\n${ctx}\n--- SELESAI ---\n\nBerdasarkan data di atas, jawab pertanyaan user secara langsung dan profesional. Jangan sebut nama tool atau function.`,
                },
            ];
        };
        let currentMsg = await callOpenRouter(messages, tools);
        if (!currentMsg) { return true; }
        for (let step = 0; step < MAX_CHAIN; step++) {
            const tc = extractToolCall(currentMsg);
            if (!tc) {
                rawResponseText = (currentMsg.content || '').replace(/<tool_call>[\s\S]*?<\/tool_call>/gi, '').replace(/<\/assistant>/gi, '').trim();
                finalResponseText = stripMarkdown(rawResponseText);
                break;
            }
            const { name: toolName, args: toolArgs } = tc;
            await sendLoad(toolName, toolArgs);
            const toolResult = await executeTool(toolName, toolArgs, isMO, { conn, chat: m.chat, imageBuffer });
            if (toolResult.media && !mediaToSend) mediaToSend = toolResult.media;
            if (DIRECT_SEND_TOOLS.has(toolName)) {
                pushHistory(histKey, 'user', text);
                pushHistory(histKey, 'assistant', toolResult.text);
                await conn.sendPresenceUpdate('paused', m.chat);
                await conn.sendMessage(m.chat, { text: toolResult.text }, { quoted });
                if (mediaToSend) {
                    try { await sendMedia(conn, m.chat, mediaToSend, quoted); }
                    catch (e) { console.error('[AI-AGENT] media error:', e.message); }
                }
                return true;
            }
            collectedResults.push({ name: toolName, result: toolResult.text || 'OK' });
            if (toolName === 'find_plugin') {
                const allMatches = [...toolResult.text.matchAll(/📄 \*([^*]+\.js)\*( ✅ \(nama file cocok\))?/g)];
                let filePath = null;
                if (allMatches.length === 1) filePath = allMatches[0][1];
                else if (allMatches.length > 1 && allMatches[0][2]) filePath = allMatches[0][1];
                if (filePath) {
                    await conn.sendMessage(m.chat, { text: `📄 Membuka ${filePath}...` }, { quoted });
                    const readResult = await toolReadFile(filePath);
                    collectedResults.push({ name: `read_file(${filePath})`, result: readResult.text || '' });
                }
                currentMsg = await callOpenRouter(buildFollowUp(), null);
                if (!currentMsg) break;
                continue;
            }
            const nextMessages = [
                ...messages,
                { role: 'assistant', content: (currentMsg.content || '').replace(/<tool_call>[\s\S]*?<\/tool_call>/gi, '').trim() || `[called ${toolName}]` },
                { role: 'user', content: `[HASIL ${toolName.toUpperCase()}]:\n${toolResult.text}\n\nLanjutkan atau jawab pertanyaan user jika sudah cukup data.` },
            ];
            currentMsg = await callOpenRouter(nextMessages, tools);
            if (!currentMsg) break;
        }
        if (!finalResponseText) finalResponseText = '...';
        const ALL_TOOL_NAMES = new Set([...TOOLS_BASE, ...TOOLS_MAIN_OWNER_EXTRA].map((t) => t.function.name));
        const looksLikeBareToolName = ALL_TOOL_NAMES.has(finalResponseText.trim().toLowerCase());
        if (looksLikeBareToolName) {
            finalResponseText = 'Maaf, ada kendala waktu menjalankan perintah ini. Coba ulangi lagi dengan kalimat yang lebih spesifik ya.';
        }
        if (!rawResponseText) rawResponseText = finalResponseText;
        finalResponseText = stripMarkdown(finalResponseText);
        pushHistory(histKey, 'user', text);
        pushHistory(histKey, 'assistant', finalResponseText);
        await delay(Math.min(3000, 500 + finalResponseText.length * 15));
        await conn.sendPresenceUpdate('paused', m.chat);
        const textToSend = hasCodeBlock(rawResponseText) ? rawResponseText : finalResponseText;
        const sent = await sendPlainReply(conn, m.chat, textToSend, quoted);
        if (!sent) await conn.sendMessage(m.chat, { text: finalResponseText }, { quoted });
        if (mediaToSend) {
            try { await sendMedia(conn, m.chat, mediaToSend, quoted); }
            catch (e) { console.error('[AI-AGENT] media error:', e.message); }
        }
        return true;
    } catch (err) {
        console.error('[AI-AGENT] error:', err?.message);
        try {
            await conn.sendMessage(m.chat, { text: `⚠️ AI Agent error: ${err?.message || 'unknown error'}` }, { quoted: m.raw });
        } catch {  }
        return false;
    } finally {
        if (lockKey) globalThis.__aiAgentLock__.delete(lockKey);
    }
};
export default handler;
