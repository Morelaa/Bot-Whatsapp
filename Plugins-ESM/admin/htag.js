//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import { downloadMediaMessage, prepareWAMessageMedia, delay } from '@itsliaaa/baileys';
import crypto from 'crypto';
const handler = async (m, { conn, text, participants, groupMeta }) => {
    if (!groupMeta || !participants) {
        return m.reply('❌ Data grup tidak ditemukan di cache memori.');
    }
    const botId = conn.user.id.split(':')[0] + '@s.whatsapp.net';
    const memberParticipants = participants.filter(p => p.id !== botId && p.id !== m.senderPn && p.id !== m.sender);
    if (memberParticipants.length === 0) {
        return m.reply('❌ Tidak ada member lain yang bisa di-tag.');
    }
    let textToSend = text || '';
    const quotedRaw = m.quoted?.raw?.message;
    const quotedText = m.quoted?.text || '';
    if (!textToSend && quotedText) textToSend = quotedText;
    if (!textToSend) textToSend = '📢 Halo @!';
    const isImage = !!quotedRaw?.imageMessage;
    const isVideo = !!quotedRaw?.videoMessage;
    const hasMedia = isImage || isVideo;
    let preparedMedia = null;
    if (hasMedia) {
        try {
            const fakeMsg = { key: m.quoted.key, message: quotedRaw };
            const mediaBuffer = await downloadMediaMessage(fakeMsg, 'buffer', {}, { logger: console });
            if (isImage) {
                const { imageMessage } = await prepareWAMessageMedia({ image: mediaBuffer }, { upload: conn.waUploadToServer });
                preparedMedia = { type: 'image', proto: imageMessage };
            } else if (isVideo) {
                const { videoMessage } = await prepareWAMessageMedia({ video: mediaBuffer }, { upload: conn.waUploadToServer });
                preparedMedia = { type: 'video', proto: videoMessage };
            }
        } catch (err) {
            return m.reply(`❌ Gagal memproses media: ${err.message}`);
        }
    }
    await m.reply(`⏳ Memproses pengiriman Hidden Message ke ${memberParticipants.length} member...`);
    const originalMeta = globalThis.__botStore__.getGroupMetadata(m.chat);
    const sharedMsgId = crypto.randomBytes(16).toString('hex').toUpperCase();
    try {
        for (const p of memberParticipants) {
            const memberJid = p.id;
            const memberLid = p.lid;
            const includeJids = [memberJid, memberLid, botId, m.sender, m.senderPn].filter(Boolean);
            const spoofedMeta = {
                ...originalMeta,
                participants: originalMeta.participants.filter(x => includeJids.includes(x.id) || includeJids.includes(x.lid))
            };
            globalThis.__botStore__.setGroupMetadata(m.chat, spoofedMeta);
            const mentionTag = `@${memberJid.split('@')[0]}`;
            let personalText = textToSend;
            if (/(^|\s)@(?!\d)/.test(personalText)) {
                personalText = personalText.replace(/(^|\s)@(?!\d)/g, `$1${mentionTag}`);
            } else {
                personalText = `${personalText} ${mentionTag}`;
            }
            let msgContent = {};
            if (preparedMedia) {
                if (preparedMedia.type === 'image') {
                    msgContent = { imageMessage: { ...preparedMedia.proto, caption: personalText, contextInfo: { mentionedJid: [memberJid] } } };
                } else if (preparedMedia.type === 'video') {
                    msgContent = { videoMessage: { ...preparedMedia.proto, caption: personalText, contextInfo: { mentionedJid: [memberJid] } } };
                }
            } else {
                msgContent = { extendedTextMessage: { text: personalText, contextInfo: { mentionedJid: [memberJid] } } };
            }
            try {
                await conn.relayMessage(m.chat, msgContent, { messageId: sharedMsgId });
                await delay(150); 
            } catch (e) {
                console.error(`[hTag] Gagal kirim ke ${memberJid}:`, e.message);
            }
        }
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.raw.key } });
    } catch (err) {
        console.error('[hTag] Error fatal:', err);
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.raw.key } });
    } finally {
        if (originalMeta) {
            globalThis.__botStore__.setGroupMetadata(m.chat, originalMeta);
        }
    }
};
handler.command = /^htag$/i;
handler.tags = ['group', 'admin'];
handler.admin = true; 
handler.group = true; 
handler.help = ['htag <teks> — Mass tag member secara personal via Hidden Message'];
export default handler;
