//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import axios from 'axios';
import * as cheerio from 'cheerio';
import config from '../../config.js';
import { buildFkontak } from '../../Library/utils.js';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
const headers = {
    'User-Agent': UA,
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    Referer: 'https://www.mediafire.com/',
    'Upgrade-Insecure-Requests': '1',
};
async function mediafiredl(url) {
    const res = await axios.get(url, { headers, maxRedirects: 5, timeout: 20000 });
    const $ = cheerio.load(res.data);
    const download = $('#download_link > a.input.popsok').attr('href') || null;
    const filename = $('.dl-btn-label').first().text().trim() || null;
    const filesize = $('#download_link > a.input.popsok').text().match(/\(([^)]+)\)/)?.[1] || null;
    const filetype = $('.dl-info .filetype span').first().text().trim() || null;
    const uploaded = $('.details li').eq(1).find('span').text().trim() || null;
    if (!download) throw new Error('Link download tidak ditemukan (file mungkin sudah dihapus/private).');
    return { filename, filetype, filesize, uploaded, download };
}
const handler = async (m, { conn, text, usedPrefix, command }) => {
    const footer = config.copyrightName || config.botName;
    if (!text)
        return m.reply(
            `╭┈┈⬡「 *ᴍᴇᴅɪᴀꜰɪʀᴇ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ* 」\n` +
            `┃ ✧ ᴄᴀʀᴀ ᴘᴀᴋᴀɪ:\n` +
            `┃ ✧ ${usedPrefix}${command} <ᴜʀʟ>\n` +
            `┃ ✧ ᴄᴏɴᴛᴏʜ:\n` +
            `┃ ✧ ${usedPrefix}${command} https://www.mediafire.com/file/xxx\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        );
    if (!text.includes('mediafire.com'))
        return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ❌ ʟɪɴᴋ ʙᴜᴋᴀɴ ᴍᴇᴅɪᴀꜰɪʀᴇ.\n╰┈┈┈┈┈┈┈┈⬡`);
    if (conn.reactSafe) await conn.reactSafe(m.chat, m.key, '⏳');
    let data;
    try {
        data = await mediafiredl(text.trim());
    }
    catch (e) {
        if (conn.reactSafe) await conn.reactSafe(m.chat, m.key, '❌');
        return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ❌ ɢᴀɢᴀʟ ᴍᴇɴɢᴀᴍʙɪʟ ᴅᴀᴛᴀ: ${e.message}\n╰┈┈┈┈┈┈┈┈⬡`);
    }
    let mime = 'application/octet-stream';
    try {
        const head = await axios.head(data.download, { headers: { 'User-Agent': UA }, timeout: 15000 });
        mime = head.headers['content-type'] || mime;
    }
    catch { }
    const ext = data.download.split('.').pop().split('?')[0];
    let fileName = data.filename || 'mediafire_file';
    if (!fileName.includes('.')) fileName = `${fileName}.${ext}`;
    const caption =
        `╭┈┈⬡「 *ᴍᴇᴅɪᴀꜰɪʀᴇ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ* 」\n` +
        `┃ ✧ ɴᴀᴍᴀ    : ${fileName}\n` +
        `┃ ✧ ᴛɪᴘᴇ    : ${data.filetype || '-'}\n` +
        `┃ ✧ ᴜᴋᴜʀᴀɴ  : ${data.filesize || '-'}\n` +
        `┃ ✧ ᴜᴘʟᴏᴀᴅ  : ${data.uploaded || '-'}\n` +
        `╰┈┈┈┈┈┈┈┈⬡\n\n` +
        `_© ${footer}_`;
    const fk = await buildFkontak(conn, config);
    try {
        await conn.sendMessage(m.chat, {
            document: { url: data.download },
            fileName,
            mimetype: mime,
            caption,
        }, { quoted: fk });
    }
    catch (e) {
        if (conn.reactSafe) await conn.reactSafe(m.chat, m.key, '❌');
        return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ❌ ɢᴀɢᴀʟ ᴍᴇɴɢɪʀɪᴍ ꜰɪʟᴇ: ${e.message}\n╰┈┈┈┈┈┈┈┈⬡`);
    }
    if (conn.reactSafe) await conn.reactSafe(m.chat, m.key, '✅');
};
handler.help = ['mf <link>', 'mfdl <link>', 'mediafire <link>'];
handler.tags = ['downloader'];
handler.command = /^(mf|mfdl|mediafire)$/i;
handler.limit = true;
export default handler;
