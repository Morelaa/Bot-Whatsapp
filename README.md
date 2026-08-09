<div align="center">

# Morela Bot

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=20&duration=3000&pause=1000&color=6C63FF&center=true&vCenter=true&width=600&lines=Owner+%2F+Admin+%2F+Premium+Permission+System;SQLite+Database+%2B+Plugin+Hot-Reload;Dibangun+di+atas+%40itsliaaa%2Fbaileys" alt="Typing SVG" />

<br/>

![Node](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-3C873A?style=for-the-badge&logo=node.js&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![Database](https://img.shields.io/badge/Database-SQLite-07405e?style=for-the-badge&logo=sqlite&logoColor=white)
![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)

</div>

---

## Daftar Isi

- [Instalasi](#instalasi)
- [Struktur Project](#struktur-project)
- [Menulis Plugin Baru](#menulis-plugin-baru)
- [Gate Registrasi](#gate-registrasi-wajib-daftar)
- [Mode Eval / Shell (Main Owner)](#mode-eval--shell-main-owner)
- [Pelacakan Event Grup](#pelacakan-event-grup)
- [Fitur Welcome & Goodbye](#fitur-welcome--goodbye)
- [Tampilan Balasan](#tampilan-balasan-branded-replies)
- [Kontak & Bantuan](#kontak--bantuan)
- [Lisensi](#lisensi)

---

## Instalasi

```bash
npm install
# edit config.js langsung (semua konfigurasi ada di sana, bukan .env)
npm start
```

Login pakai **pairing code** (bukan QR): bot minta nomor WhatsApp lalu tampilkan kode di terminal → WhatsApp HP → **Perangkat Tertaut** → **Tautkan dengan nomor telepon**.

| Command | Kegunaan |
|---|---|
| `npm start` | Jalankan lewat `launcher.js` (auto-restart kalau proses crash) |
| `npm run start:direct` | Jalankan `utama.js` langsung, tanpa supervisor `launcher.js` |
| `npm run dev` | Alias, isinya sama persis dengan `start:direct` (`node utama.js`) |

> Project ini plain JavaScript (bukan TypeScript), jadi tidak ada langkah compile/build. `dev` bukan mode watch/nodemon, cuma nama lain untuk `node utama.js`. Kalau mau auto-restart pas develop, tetap pakai `npm start` (lewat `launcher.js`).

---

## Struktur Project

```
utama.js       entry point: socket, auth, reconnect, wiring event
launcher.js    supervisor proses (auto-restart)
handler.js     router pesan + middleware + pengecekan izin otomatis
config.js      semua konfigurasi bot (nama, owner, prefix, API key, dll)

Core/          event bus, store (cache + tulis DB tiap event grup), permission, logging
System/        self mode, private mode, pengecekan owner, eval/shell shortcut (superowner.js)
Library/       resolve LID/JID, MessageBuilder, sticker, canvas, util lain
Database/      SQLite (better-sqlite3): users, groups, group_members, dll
Plugins-ESM/   semua command, per folder kategori (owner/admin/tools/games/dst)
data/          file database SQLite + soal game JSON
media/         aset gambar (register.jpg untuk tampilan register, gambar menu diatur lewat config.menuImage)
session/       kredensial login WhatsApp (auto-generate, path diatur lewat config.sessionDir)
```

---

## Menulis Plugin Baru

Buat file `.js` di `Plugins-ESM/<kategori>/`:

```js
const handler = async (m, { conn, text, args, isOwner, isAdmin }) => {
  await m.reply('Halo juga!');
};

handler.command = /^(halo|hi)$/i; // wajib, dicocokkan ke command yang diketik
handler.help = ['halo'];
handler.tags = ['tools']; // harus sama dengan nama folder

// Flag akses opsional (default false):
handler.owner = false;
handler.mainOwner = false; // lebih ketat dari owner, cuma owner utama (checkMainOwner)
handler.admin = false;     // command ini cuma buat admin grup
handler.botAdmin = false;
handler.group = false;
handler.private = false;
handler.premium = false;   // butuh akun premium
handler.limit = false;     // true = potong 1 limit harian, atau isi angka buat potong lebih dari 1
handler.cooldown = 2000;   // ms, override cooldown default per-command
handler.ignoreRateLimit = false;
handler.noRegisterGate = false; // true = lolos wajib .daftar (dipakai plugin daftar/register sendiri)

export default handler;
```

Pengecekan akses & pesan penolakan sudah dihandle otomatis oleh `handler.js`, plugin tinggal pasang flag. File otomatis ke-reload saat disave (`pluginHotReload: true`), **tapi kalau ada perubahan yang gak nyangkut setelah save, restart proses bot manual, jangan cuma andalin hot-reload.**

Plugin juga bisa punya `handler.onText(m, { conn })` untuk menangkap pesan tanpa prefix (return `true` kalau sudah ditangani).

---

## Gate Registrasi (Wajib `.daftar`)

Semua command butuh registrasi (`.daftar`/`.register`) secara default, bukan opt-in per plugin. Kalau pengirim belum terdaftar, dia dapet balasan penolakan otomatis dan command-nya gak dijalankan.

Yang **otomatis lolos** dari gate ini:
- Owner bot (`config.owners`)
- Main owner (`checkMainOwner`)
- Admin grup, khusus command yang dipanggil di dalam grup (`checkGroupAdmin`)
- User dengan akun premium (`checkPremiumUser`)
- Plugin yang secara eksplisit ditandai `handler.noRegisterGate = true`

Pengecekan ini role-based (siapa yang ngirim), bukan berdasarkan flag command, jadi admin grup tetap lolos gate walau lagi manggil command biasa yang gak ditandai admin-only.

---

## Mode Eval / Shell (Main Owner)

Diimplementasikan di `System/superowner.js`, dipicu otomatis dari isi pesan (bukan command biasa lewat prefix), khusus **main owner**:

| Prefix | Fungsi |
|---|---|
| `>kode` | Eval JS langsung (statement/ekspresi), hasil di-`util.inspect` |
| `=>kode` | Eval JS dibungkus `return`, buat ekspresi singkat |
| `$perintah` | Jalankan shell command langsung di server, tampilkan stdout/stderr |

> ⚠️ Fitur ini setara akses shell penuh ke server, pastikan `config.owners`/main owner cuma diisi nomor yang beneran dipercaya.

---

## Pelacakan Event Grup

`Core/store.js` otomatis nulis ke database setiap ada perubahan di grup:
- Member join/keluar/promote/demote → tabel `group_members`
- Kalau bot sendiri yang dikick/keluar/dipromote/didemote → status tersimpan di tabel `groups`
- Kalau member join/keluar dan fitur welcome/goodbye grup itu aktif → otomatis kirim pesan

---

## Fitur Welcome & Goodbye

Dipicu otomatis dari event `group-participants.update`. Tampilan pakai card + thumbnail + 2 tombol.

| Command | Kegunaan |
|---|---|
| `.welcome on` / `.welcome off` | Aktif/nonaktifkan welcome otomatis di grup ini |
| `.welcome` / `.welcome status` | Cek status welcome |
| `.welcome @user` / `.teswelcome @user` | Kirim contoh pesan welcome manual (testing) |
| `.goodbye on` / `.goodbye off` | Aktif/nonaktifkan goodbye otomatis di grup ini |
| `.goodbye` / `.goodbye status` | Cek status goodbye |
| `.goodbye @user` / `.tesgoodbye @user` | Kirim contoh pesan goodbye manual (testing) |

Semua command di atas khusus admin grup (`handler.admin = true`, `handler.group = true`).

---

## Tampilan Balasan (Branded Replies)

Balasan teks otomatis dibungkus tampilan "forwarded dari channel" lewat `Core/sockext.js`. Atur lewat `config.js`: `ownerName`, `channelJid`, `channelName`, `thumbnail`. Matikan dengan `brandedReplies: false`.

---

## Kontak & Bantuan

Nemu error, bug, atau butuh bantuan setup? Langsung hubungi lewat WhatsApp:

<div align="center">

[![WhatsApp](https://img.shields.io/badge/Chat_di_WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://wa.me/6282184455955)

</div>

---

## Lisensi

MIT
