'use strict';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const config = {
    env: 'development',
    // 'development' -> error command ditampilkan detail (stack/pesan asli).
    // 'production' -> error command disamarkan jadi pesan generik ke user.

    debug: false,
    // true -> aktifkan log [DEBUG] tambahan & log Baileys jadi verbose (abaikan baileysLogLevel).
    // false -> log [DEBUG] disembunyikan, log Baileys pakai level dari baileysLogLevel.

    botName: 'Morela',
    // Nama bot yang tampil di menu, kontak (vCard), footer "Powered by", dsb.

    copyrightName: 'Morela',
    // Teks copyright/branding yang tampil di footer game, watermark canvas,
    // dan metadata stiker (mis. "_© Morela Bot_"). Beda dari botName, ganti
    // nilai ini saja, semua fitur yang menampilkan teks copyright otomatis ikut berubah.

    stickerPackName: 'Morelaa',
    // Nama pack PERMANEN untuk semua fitur yang mengirim sticker pack WA
    // (.stikertele dan .stickersearch). Isi dengan teks apapun (mis.
    // 'Sticker Pack Morela') untuk selalu pakai nama ini di semua pack,
    // menggantikan judul asli dari sumbernya.
    // Kosongkan '' untuk pakai judul asli dari sumber masing-masing:
    // - .stikertele: judul dari Telegram (branding bot pembuatnya otomatis
    //   dibersihkan, mis. "Judul :: @fStikBot" -> "Judul")
    // - .stickersearch: judul dari getstickerpack.com
    // Custom nama per-command (.stikertele <url> | Nama) tetap bisa dipakai
    // dan akan menang di atas nilai ini.

    version: '0.0.1',
    // Versi internal bot (ditampilkan lewat botVersion di menu; field ini sendiri belum dipakai di kode).

    mainOwner: 'SENSOR_MAINOWNER',
    // Nomor WhatsApp main owner (format angka saja, tanpa +). Selalu dianggap owner
    // tertinggi di semua pengecekan permission, terlepas dari isi owners.

    owners: [],
    // Daftar nomor owner tambahan (selain mainOwner) yang juga lolos pengecekan owner-only.
    // Kosongkan [] kalau tidak ada owner tambahan.

    prefix: ['.', '!', '#', '/'],
    // Daftar karakter prefix command yang dikenali (mis. ".menu", "!menu", "#menu", "/menu").

    allowNoPrefix: true,
    // true -> pesan tanpa prefix sama sekali tetap dianggap command.
    // false -> command wajib pakai salah satu karakter di 'prefix'.

    authMethod: 'pairing',
    // Metode login ke WhatsApp. Saat ini cuma 'pairing' (pairing code) yang didukung/dipakai.

    sessionDir: path.join(__dirname, 'session'),
    // Folder tempat menyimpan file kredensial/sesi WhatsApp (auth state Baileys).

    pairingNumber: 'SENSOR_PAIRINGNUMBER',
    // Nomor WhatsApp bot yang dipakai untuk minta pairing code saat login pertama kali.

    pairingCustomCode: 'SENSOR_PAIRINGCUSTOMCODE',
    // Kode custom untuk pairing code (biar gampang diingat/dibaca user saat pairing).

    thumbnail: 'https://cdn.ornzora.eu.cc/87259d42-5697-4677-827b-8ef7aa14f9cf-upload-1784457032416.jpg',
    // URL gambar thumbnail default (dipakai untuk preview link/konten tertentu).

    menuImage: 'https://athars.space/uploads/7abef2f4.jpg',
    // URL gambar header yang tampil di command menu.

    registerImage: path.join(__dirname, 'media', 'register.jpg'),
    // Path gambar yang dikirim di gate "belum terdaftar" (saat user belum .daftar/.register).

    didyoumeanImage: 'https://i.ibb.co/B557dhw4/86c587d6f2d5.png',
    // Thumbnail yang tampil di kartu "Did You Mean" saat user salah ketik command.


    apiKeys: {
        neoxr: 'SENSOR_NEOXR',
        imgbb: 'SENSOR_IMGBB',
        // Daftar gratis di https://api.imgbb.com/ untuk dapat key ini.
        // Daftar gratis di https://api.neoxr.eu/ untuk dapat key ini.

        evelyne: 'SENSOR_EVELYNE',
        // Key gratis untuk api-evelyne.vercel.app, dipakai fitur brat (.bratruromiya, .brattren).

        openrouter: 'SENSOR_OPENROUTER',
        // API key OpenRouter (https://openrouter.ai/keys), dipakai fitur AI Agent
        // (Plugins-ESM/ai/aiagent.js — .aiagenton/.agenton). Wajib diisi supaya AI Agent bisa jawab.
    },

    githubToken: 'SENSOR_GITHUBTOKEN',
    // Token GitHub untuk fitur backup ke repo 

    githubRepo: 'SENSOR_GITHUBREPO',
    // Nama repo GitHub tujuan backup 

    ownerName: 'putra',
    // Nama owner yang tampil di menu & info kontak bot.

    botVersion: 'v0.0.1',
    // Versi bot yang ditampilkan ke user di command menu (boleh beda format dari 'version').

    channelJid: 'SENSOR_CHANNELJID', // isi jid saluran
    // JID channel/newsletter resmi yang dipakai untuk tampilan "forwarded dari channel".

    channelName: 'Kunjungi Saluran Resmi Kami ✨',
    // Nama channel yang tampil bareng channelJid di tampilan forwarded.

    brandedReplies: true,
    // true -> balasan teks/media dibungkus tampilan "forwarded/branded" (lihat Core/sockext.js).
    // false -> semua balasan dikirim polos tanpa bungkus branding.

    defaultReplyStyle: 'v1',
    // Gaya tampilan branded reply kalau belum pernah di-set lewat command .setreplystyle.
    // 'v1' -> extendedTextMessage (link preview card, gaya lama).
    // 'v2' -> interactiveMessage di dalam viewOnceMessage (gaya button/card baru).
    // Cuma berlaku kalau brandedReplies: true.

    rootDir: __dirname,
    // Path folder root project (otomatis, jangan diubah manual).

    dataDir: path.join(__dirname, 'data'),
    // Path folder data (soal game, database, dll, otomatis, jangan diubah manual).

    mediaDir: path.join(__dirname, 'media'),
    // Path folder media (gambar, file sementara, dll, otomatis, jangan diubah manual).

    dbFile: path.join(__dirname, 'data', 'morela.db'),
    // Path file database SQLite utama bot.

    baileysLogLevel: 'silent',
    // Level log dari library Baileys ('silent', 'error', 'warn', 'info', 'debug', dst).

    defaultSelfMode: true,
    // Nilai default self mode kalau belum pernah di-set lewat command toggle.
    // true -> di grup, cuma main owner & owner yang bisa chat/command ke bot.
    // false -> di grup, semua orang + main owner + owner bisa chat/command ke bot.

    defaultPrivateMode: true,
    // Nilai default private mode kalau belum pernah di-set lewat command toggle.
    // true -> di chat pribadi (DM), cuma main owner & owner yang bisa chat ke bot.
    // false -> di chat pribadi (DM), semua orang bebas chat ke bot.

    defaultUsageLimit: 50,
    // Jumlah pemakaian fitur ber-limit per hari untuk user non-premium.

    maxReconnectAttempts: 10,
    // Jumlah maksimal percobaan reconnect ke WhatsApp sebelum bot berhenti total.

    reconnectDelayMs: 3000,
    // Jeda (ms) antar percobaan reconnect, dikalikan jumlah percobaan ke berapa.

    pluginHotReload: true,
    // true -> perubahan file plugin otomatis di-reload tanpa restart bot.
    // false -> perubahan plugin baru kepakai setelah bot di-restart manual.

    pluginDirs: ['owner', 'tools', 'games', 'admin', 'sticker', 'downloader', 'ai', 'maker', 'info'],
    // Daftar nama folder di dalam Plugins-ESM yang di-scan & dimuat sebagai plugin.
};
export default config;
