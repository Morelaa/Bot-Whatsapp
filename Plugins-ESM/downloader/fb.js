'use strict';
import axios from 'axios';
import config from '../../config.js';
import { buildFkontak } from '../../Library/utils.js';
const BASE = 'https://fbdownloader.to';
const UA   = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
async function getToken() {
  const res  = await axios.get(`${BASE}/id`, { headers: { 'User-Agent': UA }, timeout: 10000 });
  const html = res.data;
  const k_exp   = html.match(/k_exp="(\d+)"/)?.[1]        || '';
  const k_token = html.match(/k_token="([a-f0-9]+)"/)?.[1] || '';
  if (!k_exp || !k_token) throw new Error('Gagal ambil token');
  return { k_exp, k_token };
}
async function fbDownload(url) {
  const { k_exp, k_token } = await getToken();
  const params = new URLSearchParams({ k_exp, k_token, p: 'home', q: url, lang: 'id', v: 'v2', w: '' });
  const res = await axios.post(`${BASE}/api/ajaxSearch`, params.toString(), {
    headers: {
      'Content-Type':     'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
      'Referer':          `${BASE}/id`,
      'User-Agent':       UA,
    },
    timeout: 15000
  });
  const d = res.data;
  if (d.status !== 'ok') throw new Error('Gagal fetch data video');
  const html  = d.data;
  const title = html.match(/<h3>([^<]+)<\/h3>/)?.[1] || 'Facebook Video';
  const thumb = html.match(/img src="([^"&]+)/)?.[1]  || '';
  const rows  = [...html.matchAll(/<td class="video-quality">([^<]+)<\/td>\s*<td>([^<]+)<\/td>\s*<td>\s*<a href="([^"]+)"/g)];
  const links = rows.map(m => ({ quality: m[1].trim(), url: m[3] }));
  return { title, thumb, links };
}
function pickBestLink(links) {
  const priority = ['1080p', '720p', '480p', '360p'];
  for (const p of priority) {
    const found = links.find(l => l.quality.includes(p));
    if (found) return found;
  }
  return links[0];
}
const handler = async (m, { conn, text, usedPrefix, command }) => {
  const fk = await buildFkontak(conn, config);
  const footer = config.copyrightName || config.botName;
  if (!text) return m.reply(
    `*ꜰᴀᴄᴇʙᴏᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n` +
    `> Download video dari Facebook\n\n` +
    `╭┈┈⬡「 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
    `┃ ✧ ${usedPrefix}${command} <ᴜʀʟ>\n` +
    `╰┈┈┈┈┈┈┈┈⬡\n\n` +
    `*ᴄᴀʀᴀ ᴅᴀᴘᴀᴛ ᴜʀʟ:*\n` +
    `> 1. Buka aplikasi/web Facebook\n` +
    `> 2. Cari video atau reels\n` +
    `> 3. Klik Bagikan (Share) lalu Salin Tautan\n\n` +
    `*ᴄᴏɴᴛᴏʜ:*\n` +
    `> ${usedPrefix}${command} https://fb.watch/xxx`
  );
  if (!text.match(/facebook\.com|fb\.watch|fb\.me/i)) {
    return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ❌ ʟɪɴᴋ ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ, ᴍᴀꜱᴜᴋᴋᴀɴ ʟɪɴᴋ ꜰᴀᴄᴇʙᴏᴏᴋ ʏᴀɴɢ ʙᴇɴᴀʀ.\n╰┈┈┈┈┈┈┈┈⬡`);
  }
  if (conn.reactSafe) await conn.reactSafe(m.chat, m.key, '⏳');
  let result;
  try {
    result = await fbDownload(text.trim());
  } catch (e) {
    if (conn.reactSafe) await conn.reactSafe(m.chat, m.key, '❌');
    return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ❌ ɢᴀɢᴀʟ ᴍᴇɴɢᴀᴍʙɪʟ ᴅᴀᴛᴀ: ${e.message}\n╰┈┈┈┈┈┈┈┈⬡`);
  }
  if (!result.links || !result.links.length) {
    if (conn.reactSafe) await conn.reactSafe(m.chat, m.key, '❌');
    return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ❌ ᴛɪᴅᴀᴋ ᴀᴅᴀ ʟɪɴᴋ ᴅᴏᴡɴʟᴏᴀᴅ ʏᴀɴɢ ᴅɪᴛᴇᴍᴜᴋᴀɴ.\n╰┈┈┈┈┈┈┈┈⬡`);
  }
  const best = pickBestLink(result.links);
  await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ _ᴍᴇɴɢᴜɴᴅᴜʜ ${best.quality}..._\n╰┈┈┈┈┈┈┈┈⬡`);
  let vidBuf;
  try {
    const r = await axios.get(best.url, {
      responseType: 'arraybuffer',
      headers: { 'User-Agent': UA },
      timeout: 60000,
      maxContentLength: 200 * 1024 * 1024
    });
    vidBuf = Buffer.from(r.data);
  } catch (e) {
    if (conn.reactSafe) await conn.reactSafe(m.chat, m.key, '❌');
    return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ❌ ɢᴀɢᴀʟ ᴅᴏᴡɴʟᴏᴀᴅ ᴠɪᴅᴇᴏ: ${e.message}\n╰┈┈┈┈┈┈┈┈⬡`);
  }
  await conn.sendMessage(m.chat, {
    video:    vidBuf,
    mimetype: 'video/mp4',
    caption:
      `*ꜰᴀᴄᴇʙᴏᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n` +
      `╭┈┈⬡「 *ʀᴇꜱᴜʟᴛ* 」\n` +
      `┃ ✧ ᴊᴜᴅᴜʟ    : *${result.title}*\n` +
      `┃ ✧ ᴋᴜᴀʟɪᴛᴀꜱ : *${best.quality}*\n` +
      `╰┈┈┈┈┈┈┈┈⬡\n\n` +
      `_© ${footer}_`
  }, { quoted: fk });
  if (conn.reactSafe) await conn.reactSafe(m.chat, m.key, '✅');
};
handler.help    = ['fb <link>'];
handler.tags    = ['downloader'];
handler.command = /^(fb|fbdl|facebook)$/i;
handler.limit = true;
export default handler;
