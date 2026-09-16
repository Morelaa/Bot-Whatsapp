//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import axios from 'axios';
import config from '../../config.js';
const handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) return m.reply(`Contoh: ${usedPrefix}${command} https://kyzorohan.web.id`);
  try {
    let url = text.trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    await m.reply('⏳ Sedang merender halaman, mohon tunggu...');
    const { data } = await axios.post(
      'https://urlbox.com/api/render',
      {
        url,
        width: 1440,
        height: 1024,
        full_page: true,
        dark_mode: true,
        hide_cookie_banners: true,
        format: 'png'
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    if (!data || !data.screenshotUrl) {
      return m.reply(`❌ Gagal merender.\nRespons API: ${JSON.stringify(data, null, 2)}`);
    }
    const imageRes = await axios.get(data.screenshotUrl, {
      responseType: 'arraybuffer'
    });
    if (!imageRes.data || !imageRes.data.length) {
      return m.reply('❌ Gagal mengunduh gambar dari URL screenshot.');
    }
    const buffer = Buffer.from(imageRes.data);
    await conn.sendMessage(
      m.chat,
      { image: buffer, caption: `📸 Screenshot FullPage\n${url}` },
      { quoted: m.raw }
    );
  } catch (e) {
    m.reply(`❌ Error: ${e.message}`);
  }
};
handler.help    = ['ssweb <url>'];
handler.tags    = ['tools'];
handler.command = /^ssweb$/i;
handler.owner   = false;
handler.admin   = false;
handler.group   = false;
handler.premium = false;
handler.limit   = false;
export default handler;
