'use strict';
import { createCanvas, loadImage, registerFont } from 'canvas';
import path from 'path';
import fs from 'fs';
import { DateTime } from 'luxon';
import * as baileys from '@itsliaaa/baileys';
import config from '../../config.js';
import db from '../../Database/db.js';
import { loadConfigImage, buildFkontak } from '../../Library/utils.js';
import { resolveLidToPhone, normNum } from '../../Library/resolve.js';
const { proto, generateWAMessageContent, generateWAMessageFromContent } = baileys;
const FONT_DIR = path.join(config.dataDir, 'font');
const FONT_BOLD = path.join(FONT_DIR, 'Poppins-Bold.ttf');
const FONT_MED = path.join(FONT_DIR, 'Poppins-Medium.ttf');
const FONT_REG = path.join(FONT_DIR, 'Poppins-Regular.ttf');
const FONT_LIGHT = path.join(FONT_DIR, 'Poppins-Light.ttf');
let _fontsLoaded = false;
function loadFonts() {
    if (_fontsLoaded) return;
    try {
        if (fs.existsSync(FONT_BOLD)) registerFont(FONT_BOLD, { family: 'Poppins', weight: 'bold' });
        if (fs.existsSync(FONT_MED)) registerFont(FONT_MED, { family: 'Poppins', weight: '500' });
        if (fs.existsSync(FONT_REG)) registerFont(FONT_REG, { family: 'Poppins', weight: 'normal' });
        if (fs.existsSync(FONT_LIGHT)) registerFont(FONT_LIGHT, { family: 'Poppins', weight: '300' });
        _fontsLoaded = true;
    } catch (e) {
        console.error('[REGISTER CANVAS] Font:', e.message);
    }
}
async function sendQuickReply(conn, jid, caption, buttonText, buttonId, imgBuf, quoted) {
    const IM = proto.Message.InteractiveMessage;
    let header;
    if (imgBuf && imgBuf.length) {
        try {
            const { imageMessage } = await generateWAMessageContent({ image: imgBuf }, { upload: conn.waUploadToServer });
            header = IM.Header.fromObject({ hasMediaAttachment: true, imageMessage });
        } catch {
            header = IM.Header.fromObject({ hasMediaAttachment: false });
        }
    } else {
        header = IM.Header.fromObject({ hasMediaAttachment: false });
    }
    const msg = generateWAMessageFromContent(
        jid,
        {
            viewOnceMessage: {
                message: {
                    messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                    interactiveMessage: IM.fromObject({
                        body: IM.Body.fromObject({ text: caption }),
                        footer: IM.Footer.fromObject({ text: '' }),
                        header,
                        nativeFlowMessage: IM.NativeFlowMessage.fromObject({
                            buttons: [
                                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: buttonText, id: buttonId }) },
                            ],
                        }),
                    }),
                },
            },
        },
        { quoted }
    );
    await conn.relayMessage(jid, msg.message, { messageId: msg.key.id });
}
function generateSN() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 11 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
function fmtTgl(ts) {
    return DateTime.fromMillis(ts).setZone('Asia/Jakarta').setLocale('id').toFormat('d/M/yyyy, HH.mm.ss');
}
function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}
function circleClip(ctx, cx, cy, r) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.closePath();
}
async function generateRegCanvas(nama, snCode, tanggal, ppBuf) {
    loadFonts();
    const F = fs.existsSync(FONT_REG) ? 'Poppins' : 'Arial';
    const W = 900;
    const H = 420;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#040410');
    bg.addColorStop(0.5, '#08081C');
    bg.addColorStop(1, '#0C0618');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    const g1 = ctx.createRadialGradient(0, H * 0.5, 0, 0, H * 0.5, 400);
    g1.addColorStop(0, 'rgba(0,200,200,0.13)');
    g1.addColorStop(1, 'rgba(0,200,200,0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, W, H);
    const g2 = ctx.createRadialGradient(W, H * 0.4, 0, W, H * 0.4, 350);
    g2.addColorStop(0, 'rgba(120,60,255,0.12)');
    g2.addColorStop(1, 'rgba(120,60,255,0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < W; i += 3) {
        for (let j = 0; j < H; j += 3) {
            const v = Math.random();
            if (v > 0.7) {
                ctx.fillStyle = `rgba(255,255,255,${0.015 * v})`;
                ctx.fillRect(i, j, 2, 2);
            }
        }
    }
    roundRect(ctx, 24, 24, W - 48, H - 48, 20);
    ctx.fillStyle = 'rgba(10,10,30,0.75)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,210,210,0.22)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    roundRect(ctx, 24, 24, 5, H - 48, 3);
    const barGrad = ctx.createLinearGradient(0, 24, 0, H - 24);
    barGrad.addColorStop(0, '#00E5E5');
    barGrad.addColorStop(0.5, '#7B4FFF');
    barGrad.addColorStop(1, '#00E5E5');
    ctx.fillStyle = barGrad;
    ctx.fill();
    const titleGrad = ctx.createLinearGradient(60, 0, 600, 0);
    titleGrad.addColorStop(0, '#00E5E5');
    titleGrad.addColorStop(0.5, '#FFFFFF');
    titleGrad.addColorStop(1, '#7B4FFF');
    ctx.fillStyle = titleGrad;
    ctx.font = `bold 28px "${F}"`;
    ctx.textAlign = 'left';
    ctx.shadowColor = 'rgba(0,210,210,0.6)';
    ctx.shadowBlur = 12;
    ctx.fillText(' REGISTRASI BERHASIL', 60, 80);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(0,210,210,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, 95);
    ctx.lineTo(W - 60, 95);
    ctx.stroke();
    const AVATAR_X = W - 140;
    const AVATAR_Y = H / 2 - 10;
    const AVATAR_R = 75;
    const TEXT_MAX_X = AVATAR_X - AVATAR_R - 30;
    const rows = [
        { label: 'Nama', value: nama, color: '#FFFFFF', weight: 'bold' },
        { label: 'Kode', value: snCode, color: '#FFC107', weight: 'bold' },
        { label: 'Daftar', value: tanggal, color: '#CCCCDD', weight: 'normal' },
        { label: 'Status', value: 'Free', color: '#4ADE80', weight: '500' },
        { label: 'Verified', value: 'True', color: '#00E5E5', weight: '500' },
    ];
    const START_Y = 135;
    const ROW_H = 46;
    rows.forEach((row, i) => {
        const ry = START_Y + i * ROW_H;
        ctx.font = `normal 13px "${F}"`;
        ctx.fillStyle = 'rgba(160,160,200,0.85)';
        ctx.textAlign = 'left';
        ctx.fillText(row.label + ' :', 60, ry);
        ctx.font = `${row.weight} 17px "${F}"`;
        ctx.fillStyle = row.color;
        ctx.textAlign = 'left';
        let val = String(row.value);
        if (ctx.measureText(val).width > TEXT_MAX_X - 160) {
            while (val.length > 1 && ctx.measureText(val + '…').width > TEXT_MAX_X - 160) {
                val = val.slice(0, -1);
            }
            val += '…';
        }
        ctx.fillText(val, 160, ry);
        if (i < rows.length - 1) {
            ctx.strokeStyle = 'rgba(100,100,150,0.18)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(60, ry + 12);
            ctx.lineTo(TEXT_MAX_X - 10, ry + 12);
            ctx.stroke();
        }
    });
    ctx.save();
    circleClip(ctx, AVATAR_X, AVATAR_Y, AVATAR_R + 6);
    const ringGrad = ctx.createLinearGradient(AVATAR_X - AVATAR_R, AVATAR_Y - AVATAR_R, AVATAR_X + AVATAR_R, AVATAR_Y + AVATAR_R);
    ringGrad.addColorStop(0, '#00E5E5');
    ringGrad.addColorStop(0.5, '#7B4FFF');
    ringGrad.addColorStop(1, '#00E5E5');
    ctx.fillStyle = ringGrad;
    ctx.fill();
    ctx.restore();
    ctx.save();
    circleClip(ctx, AVATAR_X, AVATAR_Y, AVATAR_R);
    ctx.clip();
    if (ppBuf) {
        try {
            const ppImg = await loadImage(ppBuf);
            const s = Math.max((AVATAR_R * 2) / ppImg.width, (AVATAR_R * 2) / ppImg.height);
            const iw = ppImg.width * s;
            const ih = ppImg.height * s;
            const ix = AVATAR_X - iw / 2;
            const iy = AVATAR_Y - ih / 2;
            ctx.drawImage(ppImg, ix, iy, iw, ih);
        } catch {
            const av = ctx.createRadialGradient(AVATAR_X, AVATAR_Y, 0, AVATAR_X, AVATAR_Y, AVATAR_R);
            av.addColorStop(0, '#1A1A40');
            av.addColorStop(1, '#0A0A20');
            ctx.fillStyle = av;
            ctx.fill();
        }
    } else {
        const av = ctx.createRadialGradient(AVATAR_X, AVATAR_Y, 0, AVATAR_X, AVATAR_Y, AVATAR_R);
        av.addColorStop(0, '#1A1A40');
        av.addColorStop(1, '#0A0A20');
        ctx.fillStyle = av;
        ctx.fill();
    }
    ctx.restore();
    const badgeW = 110;
    const badgeH = 28;
    const badgeX = AVATAR_X - badgeW / 2;
    const badgeY = AVATAR_Y + AVATAR_R + 10;
    roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 14);
    const badgeGrad = ctx.createLinearGradient(badgeX, 0, badgeX + badgeW, 0);
    badgeGrad.addColorStop(0, 'rgba(0,200,200,0.85)');
    badgeGrad.addColorStop(1, 'rgba(0,150,180,0.85)');
    ctx.fillStyle = badgeGrad;
    ctx.fill();
    ctx.font = `bold 11px "${F}"`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,200,200,0.6)';
    ctx.shadowBlur = 6;
    ctx.fillText('  VERIFIED', badgeX + badgeW / 2, badgeY + 19);
    ctx.shadowBlur = 0;
    const FY = H - 50;
    ctx.strokeStyle = 'rgba(0,210,210,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, FY);
    ctx.lineTo(W - 40, FY);
    ctx.stroke();
    ctx.font = `500 13px "${F}"`;
    ctx.fillStyle = 'rgba(160,160,200,0.8)';
    ctx.textAlign = 'center';
    ctx.fillText(` ${config.botName} `, W / 2, FY + 22);
    ctx.font = `300 11px "${F}"`;
    ctx.fillStyle = 'rgba(100,100,150,0.7)';
    ctx.fillText(DateTime.now().setZone('Asia/Jakarta').setLocale('id').toFormat('dd MMM yyyy · HH:mm') + ' WIB', W / 2, FY + 38);
    return canvas.toBuffer('image/png');
}
async function fetchPP(conn, jid) {
    try {
        const url = await conn.profilePictureUrl(jid, 'image');
        const res = await fetch(url);
        return Buffer.from(await res.arrayBuffer());
    } catch {
        return null;
    }
}
const handler = async (m, { conn, text, isOwner }) => {
    const from = m.chat;
    const userJid = m.senderPn || m.sender;
    const userNumber = userJid.replace('@s.whatsapp.net', '').replace(/[^0-9]/g, '');
    const pushname = m.pushName || userNumber;
    const command = m.command;
    const isOwn = !!isOwner;
    const isPrem = !!db.getUser(userJid)?.premium;
    const botName = config.botName;
    const fkontak = await buildFkontak(conn, config);
    if (command === 'daftar' || command === 'register') {
        if (isOwn || isPrem) {
            return m.reply(
                `╭┈┈⬡「 *ᴀᴄᴄᴏᴜɴᴛ ᴘʀɪᴠɪʟᴇɢᴇᴅ* 」\n┃\n` +
                `┃ ✧ ᴋᴀᴍᴜ ᴀᴅᴀʟᴀʜ *ᴏᴡɴᴇʀ/ᴘʀᴇᴍɪᴜᴍ*\n` +
                `┃ ✧ ᴀᴋᴜɴ ꜱᴜᴅᴀʜ ᴏᴛᴏᴍᴀᴛɪꜱ ᴅɪɪᴢɪɴᴋᴀɴ\n┃\n` +
                `╰┈┈┈┈┈┈┈┈⬡\n\n꒰ © ${botName} ꒱`
            );
        }
        if (db.isRegistered(userJid)) {
            const data = db.getUser(userJid);
            return m.reply(
                `╭┈┈⬡「 *ꜱᴜᴅᴀʜ ᴛᴇʀᴅᴀꜰᴛᴀʀ* 」\n┃\n` +
                `┃ ✧ ɴᴀᴍᴀ  : *${data?.name || '-'}*\n` +
                `┃ ✧ ɢᴜɴᴀᴋᴀɴ *.ᴄᴇᴋʀɢ* ᴜɴᴛᴜᴋ ʟɪʜᴀᴛ ᴘʀᴏꜰɪʟ\n┃\n` +
                `╰┈┈┈┈┈┈┈┈⬡\n\n꒰ © ${botName} ꒱`
            );
        }
        if (text && text.trim().length > 0) {
            const namaInput = text.trim().slice(0, 25);
            const snCode = generateSN();
            const nowMs = Date.now();
            const now = Math.floor(nowMs / 1000);
            db.registerUser(userJid, namaInput);
            db.updateUser(userJid, { sn_code: snCode, registered_at: now });
            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
            const tanggal = fmtTgl(nowMs);
            const ppBuf = await fetchPP(conn, userJid);
            const caption =
                ` *Registrasi Berhasil!*\n\n` +
                `Nama: *${namaInput}*\n` +
                `Kode: *${snCode}*\n` +
                `Tanggal Daftar: ${tanggal}\n` +
                `Status: *Free*\n` +
                `Verified: *True*\n\n` +
                `꒰ © ${botName} ꒱`;
            try {
                const canvasBuf = await generateRegCanvas(namaInput, snCode, tanggal, ppBuf);
                await sendQuickReply(conn, from, caption, ' Menu', '.menu', canvasBuf, fkontak || m.raw);
            } catch (e) {
                console.error('[REGISTER DIRECT CANVAS]', e.message);
                await m.reply(caption);
            }
            return;
        }
        const imgBuf = await loadConfigImage(config.registerImage);
        const caption = `Selamat datang! \n\n` + `Klik tombol di bawah untuk registrasi otomatis.\n\n` + `꒰ © ${botName} ꒱`;
        await sendQuickReply(conn, from, caption, ' Register Automatic', '.daftar_auto', imgBuf, fkontak || m.raw);
        return;
    }
    if (command === 'daftar_auto') {
        if (isOwn || isPrem) {
            return m.reply(`╭┈┈⬡「 *ᴘʀɪᴠɪʟᴇɢᴇᴅ* 」\n┃ ✧ ᴋᴀᴍᴜ ᴏᴡɴᴇʀ/ᴘʀᴇᴍɪᴜᴍ — ᴛɪᴅᴀᴋ ᴘᴇʀʟᴜ ᴅᴀꜰᴛᴀʀ!\n╰┈┈┈┈┈┈┈┈⬡\n\n꒰ © ${botName} ꒱`);
        }
        if (db.isRegistered(userJid)) {
            const data = db.getUser(userJid);
            return m.reply(
                `╭┈┈⬡「 *ꜱᴜᴅᴀʜ ᴛᴇʀᴅᴀꜰᴛᴀʀ* 」\n┃\n` +
                `┃ ✧ *${data?.name || '-'}*\n` +
                `┃ ✧ ɢᴜɴᴀᴋᴀɴ *.ᴄᴇᴋʀɢ* ᴜɴᴛᴜᴋ ʟɪʜᴀᴛ ᴘʀᴏꜰɪʟ\n┃\n╰┈┈┈┈┈┈┈┈⬡\n\n꒰ © ${botName} ꒱`
            );
        }
        const nama = String(pushname).slice(0, 25) || 'User';
        const snCode = generateSN();
        const nowMs = Date.now();
        const now = Math.floor(nowMs / 1000);
        db.registerUser(userJid, nama);
        db.updateUser(userJid, { sn_code: snCode, registered_at: now });
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        const tanggal = fmtTgl(nowMs);
        const ppBuf = await fetchPP(conn, userJid);
        const caption =
            ` *Registrasi Berhasil!*\n\n` +
            `Nama: *${nama}*\n` +
            `Kode: *${snCode}*\n` +
            `Tanggal Daftar: ${tanggal}\n` +
            `Status: *Free*\n` +
            `Verified: *True*\n\n` +
            `꒰ © ${botName} ꒱`;
        try {
            const canvasBuf = await generateRegCanvas(nama, snCode, tanggal, ppBuf);
            await sendQuickReply(conn, from, caption, ' Menu', '.menu', canvasBuf, fkontak || m.raw);
        } catch (e) {
            console.error('[REGISTER CANVAS]', e.message);
            await m.reply(caption);
        }
        return;
    }
    if (command === 'unreg' || command === 'unregister') {
        if (!db.isRegistered(userJid)) {
            return m.reply(
                `╭┈┈⬡「 *ʙᴇʟᴜᴍ ᴛᴇʀᴅᴀꜰᴛᴀʀ* 」\n┃\n┃ ✧ ᴋᴀᴍᴜ ʙᴇʟᴜᴍ ᴛᴇʀᴅᴀꜰᴛᴀʀ!\n┃ ✧ ᴋᴇᴛɪᴋ *.ᴅᴀꜰᴛᴀʀ* ᴜɴᴛᴜᴋ ᴅᴀꜰᴛᴀʀ\n┃\n` +
                `╰┈┈┈┈┈┈┈┈⬡\n\n꒰ © ${botName} ꒱`
            );
        }
        const data = db.getUser(userJid);
        const inputSN = (text || '').trim().toUpperCase();
        if (!inputSN) {
            return m.reply(
                `╭┈┈⬡「 *ᴄᴀʀᴀ ᴜɴʀᴇɢ* 」\n┃\n` +
                `┃ ✧ ꜰᴏʀᴍᴀᴛ : *.ᴜɴʀᴇɢ ᴋᴏᴅᴇ-ꜱɴ*\n` +
                `┃ ✧ ᴄᴏɴᴛᴏʜ : *.ᴜɴʀᴇɢ ʀʏᴜ7ᴄᴡꜰ62ʜꜱ*\n┃\n` +
                `╰┈┈┈┈┈┈┈┈⬡\n\n꒰ © ${botName} ꒱`
            );
        }
        const storedSN = (data?.sn_code || '').toUpperCase();
        if (inputSN !== storedSN) {
            return m.reply(`╭┈┈⬡「 *ᴋᴏᴅᴇ ꜱɴ ꜱᴀʟᴀʜ* 」\n┃\n┃ ✧ ᴋᴏᴅᴇ ꜱɴ ᴛɪᴅᴀᴋ ᴄᴏᴄᴏᴋ!\n┃\n╰┈┈┈┈┈┈┈┈⬡\n\n꒰ © ${botName} ꒱`);
        }
        const ok = db.unregisterUser(userJid);
        if (!ok) return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ɢᴀɢᴀʟ ᴜɴʀᴇɢ. ᴄᴏʙᴀ ʟᴀɢɪ.\n╰┈┈┈┈┈┈┈┈⬡`);
        await conn.sendMessage(from, { react: { text: '', key: m.key } });
        return m.reply(
            `╭┈┈⬡「 *ᴜɴʀᴇɢ ʙᴇʀʜᴀꜱɪʟ* 」\n┃\n` +
            `┃ ✧ ᴀᴋᴜɴ *${data?.name || '-'}* ᴅɪʜᴀᴘᴜꜱ\n` +
            `┃ ✧ ᴋᴇᴛɪᴋ *.ᴅᴀꜰᴛᴀʀ* ᴜɴᴛᴜᴋ ᴅᴀꜰᴛᴀʀ ᴜʟᴀɴɢ\n┃\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n꒰ © ${botName} ꒱`
        );
    }
    if (command === 'cekrg' || command === 'profil' || command === 'profile') {
        if (!isOwn && !isPrem && !db.isRegistered(userJid)) {
            return m.reply(`╭┈┈⬡「 *ʙᴇʟᴜᴍ ᴛᴇʀᴅᴀꜰᴛᴀʀ* 」\n┃\n┃ ✧ ᴋᴇᴛɪᴋ *.ᴅᴀꜰᴛᴀʀ* ᴜɴᴛᴜᴋ ᴅᴀꜰᴛᴀʀ\n┃\n╰┈┈┈┈┈┈┈┈⬡\n\n꒰ © ${botName} ꒱`);
        }
        const data = db.getUser(userJid);
        const nama = data?.name || pushname;
        const snCode = data?.sn_code || '-';
        const tgl = data?.registered_at ? fmtTgl(data.registered_at * 1000) : '-';
        const premium = data?.premium ? ' Premium' : 'Free';
        const caption =
            `╭┈┈⬡「 *ᴘʀᴏꜰɪʟ ᴀᴋᴜɴ* 」\n┃\n` +
            `┃ ✧ ɴᴀᴍᴀ    : *${nama}*\n` +
            `┃ ✧ ɴᴏᴍᴏʀ   : *${userNumber}*\n` +
            `┃ ✧ ᴋᴏᴅᴇ ꜱɴ : *${snCode}*\n` +
            `┃ ✧ ᴅᴀꜰᴛᴀʀ  : *${tgl}*\n` +
            `┃ ✧ ꜱᴛᴀᴛᴜꜱ  : *${premium}*\n` +
            `┃ ✧ ᴠᴇʀɪꜰɪᴇᴅ : *ᴛʀᴜᴇ*\n┃\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n꒰ © ${botName} ꒱`;
        try {
            const ppBuf = await fetchPP(conn, userJid);
            const canvasBuf = await generateRegCanvas(nama, snCode, tgl, ppBuf);
            await conn.sendMessage(from, { image: canvasBuf, caption }, { quoted: fkontak || m.raw });
        } catch (e) {
            console.error('[CEKRG CANVAS]', e.message);
            await m.reply(caption);
        }
        return;
    }
    if (command === 'deldaftar') {
        if (!isOwn) return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ꜰɪᴛᴜʀ ɪɴɪ ʜᴀɴʏᴀ ᴜɴᴛᴜᴋ ᴏᴡɴᴇʀ!\n╰┈┈┈┈┈┈┈┈⬡`);
        const allUsers = db.getUsers();
        const total = db.countUsers();
        if (total === 0) {
            return m.reply(`╭┈┈⬡「 *ᴅᴀꜰᴛᴀʀ ᴘᴇɴᴅᴀꜰᴛᴀʀ* 」\n┃\n┃ ✧ ʙᴇʟᴜᴍ ᴀᴅᴀ ᴜꜱᴇʀ ᴛᴇʀᴅᴀꜰᴛᴀʀ\n┃\n╰┈┈┈┈┈┈┈┈⬡\n\n꒰ © ${botName} ꒱`);
        }
        if (text && text.trim()) {
            const targetJid = text.trim();
            const targetUser =
                allUsers[targetJid] ||
                Object.values(allUsers).find((u) => u.phone === targetJid.replace('@s.whatsapp.net', ''));
            if (!targetUser) return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴜꜱᴇʀ ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ ᴅɪ ᴅᴀᴛᴀʙᴀꜱᴇ.\n╰┈┈┈┈┈┈┈┈⬡`);
            const ok = db.unregisterUser(targetUser.jid);
            if (!ok) return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ɢᴀɢᴀʟ ᴍᴇɴɢʜᴀᴘᴜꜱ ᴜꜱᴇʀ. ᴄᴏʙᴀ ʟᴀɢɪ.\n╰┈┈┈┈┈┈┈┈⬡`);
            await conn.sendMessage(from, { react: { text: '', key: m.key } });
            return m.reply(
                `╭┈┈⬡「 *ʜᴀᴘᴜꜱ ꜱᴜᴋꜱᴇꜱ* 」\n┃\n` +
                `┃ ✧ ᴜꜱᴇʀ *${targetUser.name || '-'}* ᴅɪʜᴀᴘᴜꜱ\n` +
                `┃ ✧ ᴜꜱᴇʀ ʜᴀʀᴜꜱ ᴋᴇᴛɪᴋ *.ᴅᴀꜰᴛᴀʀ* ᴜɴᴛᴜᴋ ᴅᴀꜰᴛᴀʀ ᴜʟᴀɴɢ\n┃\n` +
                `╰┈┈┈┈┈┈┈┈⬡\n\n꒰ © ${botName} ꒱`
            );
        }
        const sorted = Object.values(allUsers).sort((a, b) => (a.registered_at || 0) - (b.registered_at || 0));
        const IM = proto.Message.InteractiveMessage;
        const rows = sorted.map((u) => {
            const tgl = u.registered_at ? fmtTgl(u.registered_at * 1000) : '-';
            const ageStr = u.age != null ? `${u.age} th` : u.premium ? ' Premium' : 'Free';
            return {
                header: ` ${tgl}`,
                title: `${u.name || 'User'} (${ageStr})`,
                description: ` Verified: Ya`,
                id: `.deldaftar ${u.jid}`,
            };
        });
        const buttonParamsJson = JSON.stringify({
            title: 'Pilih User',
            sections: [{ title: 'Daftar Pendaftar', highlight_label: 'Pilih', rows }],
        });
        const msg = generateWAMessageFromContent(
            from,
            {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                        interactiveMessage: IM.fromObject({
                            body: IM.Body.fromObject({ text: ` *Daftar Pendaftar*\n\n Pilih user yang ingin dihapus dari daftar pendaftar:` }),
                            footer: IM.Footer.fromObject({ text: `© ${botName}` }),
                            header: IM.Header.fromObject({ hasMediaAttachment: false }),
                            nativeFlowMessage: IM.NativeFlowMessage.fromObject({ buttons: [{ name: 'single_select', buttonParamsJson }] }),
                        }),
                    },
                },
            },
            { quoted: fkontak || m.raw }
        );
        await conn.relayMessage(from, msg.message, { messageId: msg.key.id });
        return;
    }
    if (command === 'listuser' || command === 'listusers' || command === 'daftaruser') {
        if (!isOwn) return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ꜰɪᴛᴜʀ ɪɴɪ ʜᴀɴʏᴀ ᴜɴᴛᴜᴋ ᴏᴡɴᴇʀ!\n╰┈┈┈┈┈┈┈┈⬡`);
        const allUsers = db.getUsers();
        const total = db.countUsers();
        if (total === 0) {
            return m.reply(`╭┈┈⬡「 *ʟɪꜱᴛ ᴜꜱᴇʀ* 」\n┃\n┃ ✧ ʙᴇʟᴜᴍ ᴀᴅᴀ ᴜꜱᴇʀ ᴛᴇʀᴅᴀꜰᴛᴀʀ\n┃\n╰┈┈┈┈┈┈┈┈⬡\n\n꒰ © ${botName} ꒱`);
        }
        const sorted = Object.values(allUsers).sort((a, b) => (b.registered_at || 0) - (a.registered_at || 0));
        let txt = `╭┈┈⬡「 *ʟɪꜱᴛ ᴜꜱᴇʀ* 」\n┃\n┃ ✧ ᴛᴏᴛᴀʟ : *${total} ᴜꜱᴇʀ*\n┃\n`;
        sorted.forEach((u, i) => {
            const tgl = u.registered_at ? fmtTgl(u.registered_at * 1000) : '-';
            const prem = u.premium ? ' ' : '';
            const banned = u.banned ? ' ' : '';
            const ageStr = u.age != null ? ` (${u.age} th)` : '';
            const rawJid = u.jid || '';
            const isLid = rawJid.endsWith('@lid');
            const resolvedPhone = u.phone || (isLid ? resolveLidToPhone(rawJid) : normNum(rawJid));
            const numberLine = resolvedPhone
                ? `┃ ✧ +${resolvedPhone}\n`
                : `┃ ✧ LID: ${normNum(rawJid)} (nomor belum diketahui)\n`;
            txt += `┃ ✧ *${i + 1}.* ${u.name || 'User'}${ageStr}${prem}${banned}\n` + numberLine + `┃ ✧ ${tgl}\n┃\n`;
        });
        txt += `╰┈┈┈┈┈┈┈┈⬡\n\n꒰ © ${botName} ꒱`;
        await m.reply(txt);
    }
};
handler.help = ['daftar', 'unreg kode_sn', 'cekrg', 'listuser'];
handler.tags = ['tools'];
handler.noLimit = true;
handler.noRegisterGate = true;
handler.command = /^(daftar|register|daftar_auto|unreg|unregister|cekrg|profil|profile|listuser|listusers|daftaruser|deldaftar)$/i;
export default handler;
