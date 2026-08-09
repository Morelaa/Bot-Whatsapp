# Resolve Name & Mention Name Guide

## m.sender / m.senderAlt / m.senderPn - baca ini duluan

Field ini dibuat sekali per pesan masuk di `System/message.js`:

| Field | Isinya | Kapan dipakai |
|---|---|---|
| `m.sender` | JID pengirim **mentah**, bisa `@lid` atau `@s.whatsapp.net` | Keperluan internal Baileys (reply, match key). **Jangan** dipakai langsung untuk lookup nomor/pp/premium/owner. |
| `m.senderAlt` | Data mentah tambahan dari Baileys (`participantAlt`/`participantPn` di grup, `remoteJidAlt`/`remoteJidPn` di DM). Bisa `null`. | Jarang dipakai langsung, sudah diolah jadi `senderPn`. |
| **`m.senderPn`** | Nomor telepon asli pengirim dalam bentuk JID (`628xxx@s.whatsapp.net`), sudah dicoba lewat `senderAlt` dulu (jalan walau di DM & belum ada mapping database), fallback ke `resolveLidToPhone`, fallback ke `m.sender` apa adanya. | **Pakai ini** tiap kali butuh nomor/identitas asli pengirim pesan saat ini: pp, cek premium, cek owner, database key, dll. |

**Kenapa ini penting:** WhatsApp sekarang bisa kirim identitas pengirim lewat
`@lid` alih-alih nomor telepon langsung, terutama di DM yang baru pertama
kali kontak bot. Sebelum ada `m.senderPn`, beberapa plugin (`brat.js`,
`menu.js`, `register.js`, `aiagent.js`, `userinfo.js`, `getpp.js`,
`antivirtex.js`, `antigrup.js`, `anticatalog.js`) resolve nomor pengirim
sendiri pakai `toPhoneJid(m.sender)` atau `resolveLidToPhone(m.sender)`
langsung, keduanya **DB-only, tanpa `senderAlt`**, jadi diam-diam gagal
dan fallback ke identitas yang salah (misal pp bot sendiri, bukan pp
pengirim) begitu lid-nya belum ke-cache. Semua sudah diperbaiki pakai
`m.senderPn`.

`m.senderPn` **cuma berlaku untuk pengirim pesan saat ini**. Kalau target-nya
orang lain (mention/reply/argumen nomor), itu tetap urusan `resolveTarget()`
+ `findParticipant()` seperti dijelaskan di bawah, bukan `senderPn`.

```js
const handler = async (m, { conn }) => {
  const senderJid = m.senderPn; // sudah final, langsung pakai
  const pp = await conn.profilePictureUrl(senderJid, 'image').catch(() => null);
};
```

Untuk fallback "tanpa target = diri sendiri" di `resolveTarget`, selalu pass
eksplisit:

```js
resolveTarget(m, args, { senderJid: m.senderPn, fallbackSelf: true, minDigits: 8 })
```

Untuk cek owner/main owner pengirim pesan saat ini, **jangan** reimplementasi
manual, pakai helper yang sudah robust terhadap DM+lid baru:

```js
import { checkOwner, checkMainOwner } from '../../Core/permissions.js';

const isOwn = checkOwner(m, participants);
const isMainOwn = checkMainOwner(m, participants);
```

Kedua fungsi ini di dalamnya pakai `getSenderCandidates(m, participants)`,
sebuah **array** kandidat nomor buat pengecekan keanggotaan (`.some(...)`).
Jangan pernah ambil `candidates[0]` buat "nomor pasti pengirim", elemen
pertama bisa saja angka lid yang belum ke-resolve. Untuk nomor pasti,
`m.senderPn` sudah menyediakan itu.

## Dua Mekanisme Berbeda

Mention hijau: bot mengirim teks `@628xxx` beserta `mentionedJid`. WhatsApp di perangkat penerima yang merender ini menjadi nama hijau, diambil dari kontak masing-masing penerima.

Resolve nama: bot mencari nama dari database lalu menuliskannya sebagai teks biasa. Hasilnya sama untuk semua orang yang melihat pesan tersebut.

## Mention Hijau

```js
await conn.sendMessage(m.chat, {
  text: `Halo @${phoneNum} `,
  mentions: [phoneJid]
});
```

Syarat wajib: `mentions` harus berisi JID dengan akhiran `@s.whatsapp.net`, bukan `@lid`. Jika JID `@lid` masuk ke `mentions`, mention tidak akan tampil hijau.

Jika target JID adalah `@lid`, konversi dulu. Jangan menulis konversi manual, gunakan `getMentionJid` dari `Library/resolve.js`:

```js
import { getMentionJid } from '../../Library/resolve.js';

const mentionJid = getMentionJid(targetP.id);
```

## Normalisasi JID

Jangan menulis regex sendiri di dalam plugin. Gunakan `normNum` dari `Library/resolve.js`:

```js
import { normNum } from '../../Library/resolve.js';

const num = normNum(jid); // bagian nomor, session, dan domain dibuang, hasil hanya digit
```

## Resolve LID ke Phone

```js
import { getPhoneByLid, getLidByPhone } from '../../Database/db.js';

const phone = getPhoneByLid(lidNumber);   // '628xxx' atau null
const lid   = getLidByPhone(phoneNumber); // '151xxx@lid' atau null
```

Atau melalui wrapper di `resolve.js`, yang sudah menangani normalisasi input:

```js
import { resolveLidToPhone, resolvePhoneToLid } from '../../Library/resolve.js';

const phone = resolveLidToPhone(rawLidJidOrNumber);
const lid   = resolvePhoneToLid(rawPhoneJidOrNumber);
```

Pemetaan lid ke phone diperbarui otomatis lewat `autoMapParticipantLids`, dipanggil setiap kali `handler.js` memproses metadata grup (lihat fungsi `handleMessage` di `handler.js`).

## Mencari Participant dari Input Pengguna

Masalah paling umum: `m.mentionedJid[0]` bisa berupa JID `@lid`. Jangan menormalisasi nilai ini sebelum mencari participant, karena normalisasi akan merusak nomor lid menjadi angka yang tidak valid.

```js
// salah, jangan normalisasi mentionedJid terlebih dahulu
const target = normNum(m.mentionedJid[0]) + '@s.whatsapp.net';

// benar, biarkan apa adanya, serahkan ke findParticipant
const rawTarget = m.mentionedJid[0];
```

`findParticipant` sudah tersedia dan sudah menangani semua jalur fallback: exact match pada `p.id`, pencocokan `@lid` lewat `p.lid`, pencocokan `@lid` lewat `getPhoneByLid`, dan nomor biasa. Jangan diimplementasikan ulang, cukup diimpor dari `Library/resolve.js`:

```js
import { findParticipant } from '../../Library/resolve.js';

const targetP = findParticipant(participants, rawTarget);
```

Jika perlu resolve target sekaligus dari pesan yang di-reply, mention, atau argumen teks, tersedia helper `resolveTarget`:

```js
import { resolveTarget, findParticipant } from '../../Library/resolve.js';

const resolved = resolveTarget(m, args, { minDigits: 8 });
if (!resolved.raw) return m.reply('Reply, tag, atau kasih nomor.');

const targetP = findParticipant(participants, resolved.raw);
```

Pola ini persis yang digunakan di `Plugins-ESM/admin/kick.js`, `demote.js`, dan `promote.js`.

## Kick, Demote, dan Promote Participant

Gunakan `targetP.id` asli dari hasil `findParticipant`, bukan JID yang dibuat sendiri. Jika JID dibuat sendiri dan participant yang sebenarnya terdaftar sebagai `@lid`, aksi akan gagal secara diam-diam tanpa error.

```js
// salah, JID dibuat sendiri, gagal diam-diam jika participant berupa @lid
await conn.groupParticipantsUpdate(m.chat, ['628xxx@s.whatsapp.net'], 'remove');

// benar, gunakan p.id asli dari hasil findParticipant
const targetP = findParticipant(participants, resolved.raw);
await conn.groupParticipantsUpdate(m.chat, [targetP.id], 'remove');
```

Contoh nyata di `Plugins-ESM/admin/kick.js`:

```js
'use strict';
import { resolveTarget, findParticipant } from '../../Library/resolve.js';

const handler = async (m, { conn, args, participants }) => {
  let list = participants;
  if (!list) {
    list = (await conn.groupMetadata(m.chat)).participants;
  }
  const resolved = resolveTarget(m, args, { minDigits: 8 });
  const targetP = findParticipant(list, resolved.raw);
  if (!targetP) return m.reply('Member tidak ditemukan di grup ini.');

  await conn.groupParticipantsUpdate(m.chat, [targetP.id], 'remove');
  await m.reply({ text: ` Berhasil kick @${targetP.id.split('@')[0]}`, mentions: [targetP.id] });
};
handler.command = /^(kick|tendang)$/i;
handler.admin = true;
handler.group = true;
handler.botAdmin = true; // wajib bot admin, dicek otomatis sebelum handler jalan
export default handler;
```

## Memeriksa Status Admin Bot

Ada dua cara, tergantung kebutuhan.

Cara paling umum, set flag pada plugin agar diperiksa otomatis sebelum handler dijalankan (dilakukan oleh `evaluatePluginAccess` di `Core/permissions.js`):

```js
handler.botAdmin = true; // jika bot bukan admin, handler tidak akan dipanggil sama sekali
```

Jika nilainya dibutuhkan di dalam logika handler, destructure `isBotAdmin` dari context. Nilai ini sudah dihitung oleh `handler.js` melalui `checkBotAdmin` dan sudah aman terhadap LID:

```js
const handler = async (m, { conn, isBotAdmin }) => {
  if (!isBotAdmin) return m.reply('Bot bukan admin grup');
};
```

Jika benar-benar perlu dihitung manual di luar context handler, misalnya pada passive listener atau `onText`, gunakan `resolveBotAdmin` atau `findBotParticipant` dari `resolve.js`. Jangan menulis ulang ekstraksi digit secara manual:

```js
import { resolveBotAdmin } from '../../Library/resolve.js';

const botIsAdmin = await resolveBotAdmin(conn, m.chat, participants);
```

## Menghapus Pesan di Grup dengan LID

Jika field `participant` masih berupa `@lid` saat menghapus pesan, WhatsApp akan gagal diam-diam dan pesan tidak terhapus. Gunakan `safeDeleteParticipant` dari `resolve.js`:

```js
import { safeDeleteParticipant } from '../../Library/resolve.js';

const participant = safeDeleteParticipant(senderJid);
await conn.sendMessage(m.chat, {
  delete: { remoteJid: m.chat, fromMe: false, id: msgId, participant }
});
```

## Resolve Nama dari Database

Urutan prioritas dari yang paling akurat:

```
1. store.groupMetadata[chat].participants[].notify   paling akurat jika di dalam grup
2. store.contacts[jid].notify / .name / .verifiedName
3. getPushName(lidNum) / getPushName(phoneNum)        dari database, data/morela.db, via Database/db.js
4. quotedPushName / m.pushName                        hanya jika target adalah pengirim pesan itu sendiri
5. conn.groupMetadata(chat) live fetch                jalur terakhir, lebih lambat
```

Fungsi ini sudah diimplementasikan lengkap sebagai `resolveDisplayName` di `Library/resolve.js`. Jangan ditulis ulang, cukup diimpor dan dipakai:

```js
import { resolveDisplayName } from '../../Library/resolve.js';

const name = await resolveDisplayName(conn, m, targetP.id, {
  participants,
  quotedPushName: m.quoted?.pushName,
});
```

Untuk resolve nama singkat langsung dari objek participant, misalnya saat melakukan iterasi anggota grup untuk hidetag atau daftar member, gunakan `resolveNameFromParticipant`:

```js
import { resolveNameFromParticipant } from '../../Library/resolve.js';

const displayName = resolveNameFromParticipant(targetP, targetP.notify);
```

## Masalah dan Solusinya

**Mention menampilkan angka aneh, misalnya `+27 647xxx`, padahal bukan nomor tersebut.**
Penyebab: `mentionedJid[0]` yang berupa `@lid` dinormalisasi menjadi angka yang tidak valid sebelum pencarian participant dilakukan.
Solusi: biarkan `mentionedJid[0]` apa adanya, gunakan `findParticipant` dari `Library/resolve.js`.

**Kick, demote, atau promote gagal tanpa pesan error.**
Penyebab: JID yang dikirim ke `groupParticipantsUpdate` dibuat sendiri, misalnya `628xxx@s.whatsapp.net`, padahal participant sebenarnya terdaftar sebagai `@lid`.
Solusi: selalu gunakan `targetP.id` asli dari hasil `findParticipant`.

**Pesan tidak terhapus.**
Penyebab: field `participant` pada perintah delete masih berupa `@lid`.
Solusi: gunakan `safeDeleteParticipant(senderJid)` sebelum mengirim perintah delete.

**Bot selalu dianggap bukan admin padahal sudah admin.**
Penyebab: perbandingan `p.id === botJid` dilakukan secara langsung, padahal format JID pada grup dengan LID berbeda.
Solusi: set `handler.botAdmin = true` untuk pengecekan otomatis, atau destructure `isBotAdmin` dari context. Jika perlu perhitungan manual, gunakan `resolveBotAdmin`.

**`m.pushName` mengembalikan nama pengirim, bukan nama target.**
Penyebab: `m.pushName` adalah nama orang yang mengirim pesan, bukan target yang di-mention atau di-reply.
Solusi: gunakan `resolveDisplayName(conn, m, targetJid, opts)`.

**`getPushName(fullJid)` mengembalikan `null` untuk pengguna LID.**
Penyebab: key pada database pushname adalah nomor LID saja, bukan JID lengkap.
Solusi: gunakan `getPushName(lidNum)`, bukan `getPushName(lidNum + '@lid')`.

**Foto profil (pp) di ButtonV2/menu/brat malah ambil pp bot sendiri, padahal target-nya jelas ada pp-nya.**
Penyebab: resolve pp pengirim pesan pakai `toPhoneJid(m.sender)` atau
`m.sender` mentah tanpa convert, untuk pengirim ber-`@lid` yang belum
ke-cache di database (umum terjadi di DM baru), ini diam-diam gagal dan
jatuh ke fallback pp bot. Kasus nyata: `brat.js`, `menu.js`.
Solusi: pakai `m.senderPn`, bukan `toPhoneJid(m.sender)`/`m.sender`.

**Fitur AI Agent / fitur owner-only diam total tanpa error, padahal dari nomor main owner.**
Penyebab: pengecekan owner reimplementasi manual pakai resolver DB-only
(`resolveLidToPhone`/`toPhoneJid` tanpa `senderAlt`), bukan lewat
`checkOwner`/`checkMainOwner` dari `Core/permissions.js`. Kasus nyata:
`aiagent.js` (sebelum diperbaiki).
Solusi: selalu pakai `checkOwner(m, participants)` /
`checkMainOwner(m, participants)`, jangan resolve nomor manual buat
pengecekan owner.

**Data user di database kesimpen di bawah identitas lid, bukan nomor asli.**
Penyebab: key registrasi/database pakai `m.sender` mentah. Kasus nyata:
`register.js` (sebelum diperbaiki).
Solusi: pakai `m.senderPn` sebagai key, bukan `m.sender`.

## Perbandingan Implementasi

| File | Mention hijau | Resolve nama | Catatan |
|---|---|---|---|
| `Plugins-ESM/admin/kick.js` | ya | tidak, hanya tag | Pakai `resolveTarget` + `findParticipant`, kick memakai `targetP.id` asli. |
| `Plugins-ESM/admin/demote.js` | ya | tidak | Pola sama persis dengan `kick.js`. |
| `Plugins-ESM/admin/promote.js` | ya | tidak | Pola sama persis dengan `kick.js`. |
| `Plugins-ESM/admin/hidetag.js` | ya, mention semua member | tidak | `mentions` diisi langsung dari `p.id` hasil `groupMetadata`. |
| `Plugins-ESM/admin/welcome.js`, `goodbye.js` | ya | tidak | Ambil pp lewat `resolveThumbnail` (target dulu, fallback pp bot). Pola resolusinya sama seperti `toPhoneJid`, DB-only, tanpa live lookup tambahan, tapi biasanya aman karena event join-grup sudah bawa data lid+phone dari Baileys. |
| `handler.js`, gate `plugin.register` | ya | tidak | LID diresolve ke phone dulu lewat helper di `resolve.js` sebelum di-mention. Kalau resolve gagal, mention tidak dilakukan sama sekali. |

Fitur welcome dan goodbye message sudah diimplementasikan (`Plugins-ESM/admin/welcome.js` dan `goodbye.js`). Kalau bikin fitur baru yang mem-mention member baru/keluar, contek pola `resolveThumbnail` di file itu, dan pertimbangkan pakai `m.senderPn` kalau konteksnya pesan biasa (bukan event join/leave grup).

Seluruh helper resolve dan mention yang dijelaskan di guide ini sudah tersedia langsung di `Library/resolve.js`. Plugin baru yang butuh mention atau resolve nama cukup import dari sana, jangan diimplementasikan ulang dengan ekstraksi digit manual dari JID mentah, itu penyebab bug "angka aneh" yang dijelaskan di atas. Untuk identitas pengirim pesan saat ini, `m.senderPn` sudah tersedia langsung di object `m`, tidak perlu import apapun.

```js
import {
  getMentionJid, resolveLidToPhone, resolvePhoneToLid, normNum,
  mapSenderLid, resolveSenderLidLive, findParticipant, findBotParticipant,
  resolveBotAdmin, resolveTarget, resolveDisplayName, resolveNameFromParticipant,
  safeDeleteParticipant,
} from '../../Library/resolve.js';
import { checkOwner, checkMainOwner } from '../../Core/permissions.js';
```
