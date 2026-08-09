'use strict';
import { createCanvas, loadImage } from 'canvas';
import sharp from 'sharp';
import config from '../../config.js';
import { buildFkontak } from '../../Library/utils.js';
const handler = async (m, { conn, text, command }) => {
    if (!text?.trim()) return m.reply(`╭┈┈⬡「 *ᴍᴀꜱᴜᴋᴋᴀɴ ᴛᴇᴋꜱ!* 」\n┃\n┃ ✧ ᴄᴏɴᴛᴏʜ:\n┃ ✧ .${command || 'bratspongebob'} ꜰᴀʟᴢx ʜᴀᴍᴀ ʙᴀɴɢᴇᴛ ᴊɪʀ\n╰┈┈┈┈┈┈┈┈⬡`);
    try {
        const imageUrl = 'https://img1.pixhost.to/images/11791/687260942_vynaa-valerie.jpg';
        const res = await fetch(imageUrl);
        const buffer = await res.arrayBuffer();
        const img = await loadImage(Buffer.from(buffer));
        const canvas = createCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, img.width, img.height);
        const boardX = img.width * 0.55;
        const boardY = img.height * 0.18;
        const boardW = img.width * 0.35;
        const boardH = img.height * 0.42;
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const wrapText = (ctx2, txt, x, y, maxWidth, lineHeight) => {
            const words = txt.split(' ');
            let line = '';
            let lines = [];
            for (let i = 0; i < words.length; i++) {
                const testLine = line + words[i] + ' ';
                if (ctx2.measureText(testLine).width > maxWidth && i > 0) {
                    lines.push(line);
                    line = words[i] + ' ';
                } else {
                    line = testLine;
                }
            }
            lines.push(line);
            lines.forEach((l, i) => ctx2.fillText(l, x, y + i * lineHeight));
            return lines.length * lineHeight;
        };
        let fontSize = 52;
        while (fontSize > 16) {
            ctx.font = `bold ${fontSize}px Arial`;
            if (wrapText(ctx, text, -9999, -9999, boardW, fontSize + 6) <= boardH) break;
            fontSize--;
        }
        ctx.font = `bold ${fontSize}px Arial`;
        wrapText(ctx, text, boardX + boardW / 2, boardY, boardW, fontSize + 6);
        const pngBuffer = canvas.toBuffer();
        const webpBuffer = await sharp(pngBuffer).webp({ quality: 90 }).toBuffer();
        await conn.sendMessage(m.chat, { sticker: webpBuffer }, { quoted: (await buildFkontak(conn, config).catch(() => null)) || m.raw });
    } catch (e) {
        console.error(e);
        m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ɢᴀɢᴀʟ ᴍᴇᴍʙᴜᴀᴛ ꜱᴛɪᴋᴇʀ\n╰┈┈┈┈┈┈┈┈⬡`);
    }
};
handler.command = /^(bratspongebob|spongebob)$/i;
handler.tags = ['sticker'];
handler.help = ['bratspongebob <teks>'];
handler.limit = true;
export default handler;
