//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
    env: 'development',
    // 'development' -> Kasih lihat pesan error secara detail ke teknisi.
    // 'production' -> Sembunyikan pesan error dari pengguna biar nggak bingung.

    debug: false,
    // true -> Tampilkan proses di balik layar bot (khusus buat teknisi).
    // false -> Sembunyikan proses di balik layar biar tampilan rapi.

    botName: 'Morela',
    // Nama panggilan bot kamu yang bakal muncul di menu dan kontak.

    copyrightName: 'Morela',
    // Tulisan hak cipta (watermark) bot kamu di bawah pesan atau stiker, misal "© Morela". 
    // Ganti ini aja, semua otomatis berubah.

    stickerPackName: 'Morelaa',
    // Nama paten/permanen untuk stiker buatan bot kamu. 
    // Kalau dikosongin '', bot bakal pakai nama asli dari sumber stikernya.

    version: '0.0.1',
    // Versi bot kamu (buat catatan sistem).

    mainOwner: 'SENSOR_MAINOWNER',
    // Nomor WA utama kamu sebagai BOS TERTINGGI (pakai 62, jangan pakai 0 atau +).

    owners: [],
    // Daftar nomor teman yang mau kamu jadikan bos tambahan. Kosongin [] kalau nggak ada.

    prefix: ['.', '!', '#', '/'],
    // Simbol awalan buat manggil bot (kayak .menu, !menu, /menu).

    allowNoPrefix: true,
    // true -> Orang bisa manggil bot tanpa harus ngetik simbol awalan.
    // false -> Wajib pakai salah satu simbol awalan di atas.

    authMethod: 'qr',
    // Cara bot login ke WhatsApp: 'pairing' (masukin kode di HP) atau 'qr' (scan barcode).
    // Kalau nomor kamu susah/gagal terus pakai pairing code, ganti ke 'qr'.

    sessionDir: path.join(__dirname, 'session'),
    // Folder tempat nyimpen data login WA bot kamu.

    pairingNumber: 'SENSOR_PAIRINGNUMBER',
    // Nomor WA bot kamu yang dipakai buat minta kode masuk (login) pertama kali.

    pairingCustomCode: 'SENSOR_PAIRINGCUSTOMCODE',
    // Kode rahasia biar gampang diingat pas kamu mau login.

    thumbnail: 'https://cdn.ornzora.eu.cc/930925fe-c73f-459a-9314-13b45a5739f3-upload-1788218622715.jpg',
    // Link gambar utama bot untuk preview (gambar kecil).

    menuImage: 'https://cdn.ornzora.eu.cc/079ea34d-3911-42f8-96be-fc8a917d68f9-upload-1788218364891.jpg',
    // Link gambar besar yang muncul pas orang ngetik perintah menu.

    buttonv2Img: 'https://i.ibb.co/Jjq7VX2f/20d16a7f2928.jpg',
    // Link gambar cadangan untuk tombol pesan (kalau bot gagal ngambil foto profil user).

    registerImage: path.join(__dirname, 'media', 'register.jpg'),
    // Gambar yang dikirim ke orang yang belum daftar pas mereka mau pakai bot.

    didyoumeanImage: 'https://i.ibb.co/F4JwWz1r/5e6598a85e40.jpg',
    // Gambar yang muncul kalau ada orang yang salah ketik perintah bot.

    apiKeys: {
        neoxr: 'SENSOR_NEOXR',
        imgbb: 'SENSOR_IMGBB',
        // Kunci rahasia dari neoxr dan imgbb biar bot bisa jalanin fitur tertentu.

        evelyne: 'SENSOR_EVELYNE',
        // Kunci gratis buat bikin stiker gaya 'brat'.

        openrouter: 'SENSOR_OPENROUTER',
        // Kunci biar bot kamu bisa jadi AI pintar yang bisa ditanya-tanya.

        huggingface: [
            // Kumpulan kunci buat fitur AI tertentu. Kalau satu kena limit, bot otomatis ganti pakai kunci di bawahnya.
            'SENSOR_TOKEN', 
            'SENSOR_TOKEN', 
            'SENSOR_TOKEN', 
            'SENSOR_TOKEN', 
            'SENSOR_TOKEN',
            'SENSOR_TOKEN',
            'SENSOR_TOKEN',
            'SENSOR_TOKEN',
            'SENSOR_TOKEN',
            'SENSOR_TOKEN',
            'SENSOR_TOKEN',
            'SENSOR_TOKEN'
        ],
    },

    donation: {
        method: 'DANA',
        // Nama metode pembayaran (DANA, OVO, GOPAY, dll) yang muncul di tombol donasi.

        number: '6281271131435',
        // Nomor rekening/e-wallet tujuan donasi (pakai 62, jangan pakai 0 atau +).

        accountName: 'Morela',
        // Nama pemilik rekening/e-wallet yang muncul di info donasi.
    },

    sourceCodeUrl: 'https://github.com/Morelaa/Bot-whatsapp',
    // Link GitHub repo bot kamu, muncul di tombol "Lihat Source Code" (perintah .sc).

    githubToken: 'SENSOR_TOKEN',
    // Kunci buat nyimpen (backup) otomatis data bot kamu ke GitHub.

    githubRepo: 'SENSOR_GITHUBREPO',
    // Nama tempat nyimpen (repo) di GitHub.

    ownerName: ' ᴘᴜᴛʀᴀ ꜱᴛᴏʀᴇ ᴜᴄʜɪʜᴀ',
    // Nama kamu sebagai pemilik bot, bakal muncul di info bot.

    botVersion: 'v0.0.1',
    // Versi bot kamu yang bisa dilihat orang di menu.

    channelJid: 'SENSOR_CHANNELJID', 
    // ID Saluran (Channel WA) resmi milikmu.

    channelName: 'Kunjungi Saluran Resmi Kami ✨',
    // Nama Saluran WA kamu yang bakal muncul di pesan bot.

    brandedReplies: true,
    // true -> Bikin pesan bot kelihatan keren, kayak diteruskan (forwarded) dari saluran WA resmi.
    // false -> Pesan bot kelihatan biasa aja.

    defaultReplyStyle: 'v1',
    // Gaya pesan bot kalau fitur di atas aktif. 'v1' gaya lama, 'v2' gaya baru pakai tombol.

    rootDir: __dirname,
    dataDir: path.join(__dirname, 'data'),
    mediaDir: path.join(__dirname, 'media'),
    dbFile: path.join(__dirname, 'data', 'morela.db'),
    // INI JANGAN DIUBAH! Ini alamat folder di komputer/server buat nyimpen data-data bot.

    baileysLogLevel: 'silent',
    // Tingkat keribetan catatan sistem. Biarin 'silent' aja biar layar nggak penuh tulisan aneh.

    defaultSelfMode: true,
    // true -> Di dalam grup, cuma kamu (bos) yang bisa nyuruh-nyuruh bot. 
    // false -> Semua orang di grup bebas nyuruh bot.

    defaultPrivateMode: true,
    // true -> Di chat pribadi (DM), cuma kamu (bos) yang bisa chat bot.
    // false -> Semua orang bebas chat bot secara pribadi.

    defaultUsageLimit: 50,
    // Batas maksimal orang biasa (bukan premium) pakai bot dalam sehari.

    maxReconnectAttempts: 10,
    // Maksimal bot nyoba nyambung lagi ke WA kalau sinyalnya putus.

    reconnectDelayMs: 3000,
    // Jeda waktu tunggu sebelum bot nyoba nyambung lagi (dalam milidetik).

    pluginHotReload: true,
    // true -> Fitur ajaib! Kamu bisa nambah/ubah fitur bot tanpa harus matiin botnya.
    // false -> Kamu wajib restart bot tiap kali nambahin fitur baru.

    pluginDirs: ['owner', 'tools', 'games', 'admin', 'sticker', 'downloader', 'ai', 'maker', 'info'],
    // Daftar nama folder tempat kamu nyimpen file fitur-fitur bot.
};
export default config;
