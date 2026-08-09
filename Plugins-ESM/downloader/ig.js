'use strict';
import axios from 'axios';
import vm from 'vm';
import config from '../../config.js';
import { buildFkontak } from '../../Library/utils.js';
import { Carousel, Button } from '../../Library/MessageBuilder.js';
const SNAPSAVE_URL = 'https://snapsave.app/id/action.php?lang=id';
const SNAPSAVE_HEADERS = {
  'Content-Type': 'application/x-www-form-urlencoded',
  Referer: 'https://snapsave.app/id/download-video-instagram',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'X-Requested-With': 'XMLHttpRequest',
};
function decodePacked(script) {
  const matches = [...script.matchAll(/eval\(function\([a-z,]+\)\{[\s\S]*?\}\((.*?)\)\)/g)];
  const arr = ['', 'split', '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/', 'slice', 'indexOf', '', '', '.', 'pow', 'reduce', 'reverse', '0'];
  function baseConv(d, e, f) {
    const g = arr[2][arr[1]](arr[0]);
    const h = g[arr[3]](0, e);
    const i = g[arr[3]](0, f);
    let j = d[arr[1]](arr[0])[arr[10]]()[arr[9]]((a, b, c) => {
      if (h[arr[4]](b) !== -1) return a += h[arr[4]](b) * Math[arr[8]](e, c);
    }, 0);
    let k = arr[0];
    while (j > 0) { k = i[j % f] + k; j = (j - (j % f)) / f; }
    return k || arr[11];
  }
  function decoderFn(h, u, n, t, e, r) {
    r = '';
    for (let i = 0, len = h.length; i < len; i++) {
      let s = '';
      while (h[i] !== n[e]) { s += h[i]; i++; }
      for (let j = 0; j < n.length; j++) s = s.replace(new RegExp(n[j], 'g'), j);
      r += String.fromCharCode(baseConv(s, e, 10) - t);
    }
    return decodeURIComponent(escape(r));
  }
  let out = '';
  for (const m of matches) {
    try {
      const args = vm.runInNewContext('[' + m[1] + ']', {}, { timeout: 5000 });
      out += decoderFn(...args);
    } catch { }
  }
  return out;
}
async function fetchSnapsave(igUrl) {
  const res = await axios.post(SNAPSAVE_URL, new URLSearchParams({ url: igUrl }).toString(), { headers: SNAPSAVE_HEADERS, timeout: 30000 });
  const raw = decodePacked(String(res.data));
  if (!raw) throw new Error('Gagal decode respons snapsave (kemungkinan format situs berubah).');
  let html = '';
  const strMatches = [...raw.matchAll(/innerHTML\s*=\s*"((?:[^"\\]|\\.)*)"/g)];
  for (const sm of strMatches) {
    try { html += JSON.parse('"' + sm[1] + '"'); } catch { }
  }
  if (!html) html = raw; // fallback in case format changes and content is already plain HTML
  const items = [];
  const re = /<img src="([^"]+)"[^>]*>[\s\S]{0,300}?icon-(dlimage|dlvideo)[\s\S]{0,300}?href="([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) {
    items.push({ thumb: m[1], type: m[2] === 'dlvideo' ? 'video' : 'image', url: m[3] });
  }
  if (!items.length) {
    if (/tidak (ditemukan|valid)|not found|invalid|private/i.test(html)) {
      throw new Error('Post tidak ditemukan / akun private / link tidak valid.');
    }
    throw new Error('Tidak ada media yang berhasil di-parse dari snapsave.');
  }
  return items;
}
async function downloadBuf(url) {
  const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 60000, headers: { 'User-Agent': 'Mozilla/5.0' } });
  return Buffer.from(res.data);
}
const handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) return m.reply(
    `ɪɴꜱᴛᴀɢʀᴀᴍ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ\n\n` +
    `╭┈┈⬡「 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
    `┃ ✧ ${usedPrefix}${command} <ʟɪɴᴋ>\n` +
    `╰┈┈┈┈┈┈┈┈⬡\n\n` +
    `ᴄᴏɴᴛᴏʜ:\n${usedPrefix}${command} https://instagram.com/p/xxxxx`
  );
  if (conn.reactSafe) await conn.reactSafe(m.chat, m.key, '⏳');
  let items;
  try {
    items = await fetchSnapsave(text.trim());
  } catch (e) {
    if (conn.reactSafe) await conn.reactSafe(m.chat, m.key, '❌');
    return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ɢᴀɢᴀʟ ᴍᴇɴɢᴀᴍʙɪʟ ᴍᴇᴅɪᴀ.\n┃ ✧ ${e.message}\n╰┈┈┈┈┈┈┈┈⬡`);
  }
  await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ _ᴍᴇɴɢᴜɴᴅᴜʜ ${items.length} ᴍᴇᴅɪᴀ..._\n╰┈┈┈┈┈┈┈┈⬡`);
  const fkontak = await buildFkontak(conn, config);
  const fkontakContext = {
    quotedMessage: fkontak.message,
    participant: fkontak.key.participant,
    stanzaId: fkontak.key.id,
    remoteJid: fkontak.key.remoteJid,
  };
  const captionStr = `ɪɴꜱᴛᴀɢʀᴀᴍ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ\n\n╭┈┈⬡「 *ʀᴇꜱᴜʟᴛ* 」\n┃ ✧ ${items.length} ᴍᴇᴅɪᴀ\n╰┈┈┈┈┈┈┈┈⬡\n\n_© ${config.botName}_`;
  if (items.length > 1) {
    const cards = [];
    for (const item of items) {
      try {
        const buf = await downloadBuf(item.url);
        const cardBuilder = new Button(conn);
        if (item.type === 'video') cardBuilder.setVideo(buf);
        else cardBuilder.setImage(buf);
        cards.push(await cardBuilder.toCard());
      } catch {}
    }
    if (cards.length) {
      try {
        const carousel = new Carousel(conn).setBody(captionStr).setContextInfo(fkontakContext).addCard(cards);
        await carousel.send(m.chat);
      } catch (e) {
        console.error('[IG] gagal kirim carousel, fallback ke media satu-satu:', e.message);
        for (const item of items) {
          try {
            const buf = await downloadBuf(item.url);
            if (item.type === 'video') {
              await conn.sendMessage(m.chat, { video: buf, mimetype: 'video/mp4', caption: captionStr, contextInfo: fkontakContext });
            } else {
              await conn.sendMessage(m.chat, { image: buf, caption: captionStr, contextInfo: fkontakContext });
            }
          } catch {}
        }
      }
    }
  } else {
    const item = items[0];
    try {
      const buf = await downloadBuf(item.url);
      if (item.type === 'video') {
        await conn.sendMessage(m.chat, { video: buf, mimetype: 'video/mp4', caption: captionStr, contextInfo: fkontakContext });
      } else {
        await conn.sendMessage(m.chat, { image: buf, caption: captionStr, contextInfo: fkontakContext });
      }
    } catch {}
  }
  if (conn.reactSafe) await conn.reactSafe(m.chat, m.key, '✅');
};
handler.help = ['ig <url>'];
handler.tags = ['downloader'];
handler.command = /^(ig|instagram|igdl|insta)$/i;
handler.limit = true;
export default handler;
