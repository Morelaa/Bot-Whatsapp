'use strict';
import crypto from 'crypto';
import { PassThrough } from 'stream';
import * as baileys from '@itsliaaa/baileys';
import { Button } from '../../Library/MessageBuilder.js';
import { buildFkontak } from '../../Library/utils.js';
import { findMediaMessage, downloadMessageMedia } from '../../Library/handle.js';
import config from '../../config.js';
const { generateWAMessageContent, generateWAMessageFromContent } = baileys;
export const pendingSwgc = new Map();
async function sendGroupStatus(conn, jid, content) {
    const backgroundColor = content.backgroundColor;
    const contentCopy = { ...content };
    delete contentCopy.backgroundColor;
    const inside = await generateWAMessageContent(contentCopy, {
        upload: conn.waUploadToServer,
        backgroundColor,
    });
    const secret = crypto.randomBytes(32);
    const msg = generateWAMessageFromContent(jid, {
        messageContextInfo: { messageSecret: secret },
        groupStatusMessageV2: {
            message: { ...inside, messageContextInfo: { messageSecret: secret } },
        },
    }, {});
    await conn.relayMessage(jid, msg.message, { messageId: msg.key.id });
    return msg;
}
async function toOggOpus(buffer) {
    let ffmpeg;
    try {
        const mod = await import('fluent-ffmpeg');
        ffmpeg = mod.default;
    } catch {
        return buffer;
    }
    return new Promise((resolve, reject) => {
        const input = new PassThrough();
        const output = new PassThrough();
        const chunks = [];
        input.end(buffer);
        ffmpeg(input)
            .noVideo()
            .audioCodec('libopus')
            .format('ogg')
            .on('error', reject)
            .on('end', () => resolve(Buffer.concat(chunks)))
            .pipe(output);
        output.on('data', (c) => chunks.push(c));
    });
}
async function buildContent(raw) {
    if (raw.image) return { image: raw.image, caption: raw.caption || '' };
    if (raw.video) return { video: raw.video, caption: raw.caption || '' };
    if (raw.audio) {
        const audioBuffer = await toOggOpus(raw.audio);
        return { audio: audioBuffer, mimetype: 'audio/ogg; codecs=opus', ptt: true };
    }
    if (raw.text) {
        return { text: raw.text, font: raw.font ?? 0, backgroundColor: raw.backgroundColor ?? '#128C7E' };
    }
    return {};
}
function getMediaLabel(raw) {
    if (raw.text) return 'ᴛᴇᴋs';
    if (raw.image) return 'ɢᴀᴍʙᴀʀ';
    if (raw.video) return 'ᴠɪᴅᴇᴏ';
    if (raw.audio) return 'ᴀᴜᴅɪᴏ';
    return 'ᴍᴇᴅɪᴀ';
}
const handler = async (m, { conn, args, text, command }) => {
    const footer = config.copyrightName || config.botName;
    if (command === 'cancelswgc') {
        pendingSwgc.delete(m.sender);
        return m.reply(`╭┈┈⬡「 *sᴡɢᴄ ᴅɪʙᴀᴛᴀʟᴋᴀɴ* 」\n┃\n┃ ✧ ᴘᴏsᴛɪɴɢ sᴛᴏʀʏ sᴜᴅᴀʜ ᴅɪʙᴀᴛᴀʟᴋᴀɴ.\n╰┈┈┈┈┈┈┈┈⬡`);
    }
    if (args[0] === '--confirm' && args[1]) {
        const targetGroupId = args[1];
        const pending = pendingSwgc.get(m.sender);
        if (!pending) {
            return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴛɪᴅᴀᴋ ᴀᴅᴀ ᴅᴀᴛᴀ ᴘᴇɴᴅɪɴɢ.\n┃ ✧ ᴋɪʀɪᴍ ᴜʟᴀɴɢ ᴍᴇᴅɪᴀ ʟᴀʟᴜ .sᴡɢᴄ ʟᴀɢɪ.\n╰┈┈┈┈┈┈┈┈⬡`);
        }
        let groupName = 'Grup';
        try {
            const meta = await conn.groupMetadata(targetGroupId);
            groupName = meta.subject || 'Grup';
        } catch {}
        await conn.sendMessage(m.chat, { react: { text: '🕕', key: m.key } });
        try {
            const content = await buildContent(pending.rawContent);
            await sendGroupStatus(conn, targetGroupId, content);
            await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            await m.reply(`╭┈┈⬡「 *ʙᴇʀʜᴀsɪʟ* 」\n┃ ✧ sᴛᴏʀʏ ᴛᴇʀᴋɪʀɪᴍ ᴋᴇ ɢʀᴜᴘ ${groupName}\n╰┈┈┈┈┈┈┈┈⬡`);
        } catch (err) {
            await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            await m.reply(`╭┈┈⬡「 *ɢᴀɢᴀʟ ᴘᴏsᴛ sᴛᴏʀʏ* 」\n┃ ✧ ${err?.message || 'Unknown error'}\n╰┈┈┈┈┈┈┈┈⬡`);
        } finally {
            pendingSwgc.delete(m.sender);
        }
        return;
    }
    const rawContent = {};
    const media = findMediaMessage(m);
    if (media && ['imageMessage', 'videoMessage', 'audioMessage'].includes(media.type)) {
        const buffer = await downloadMessageMedia(m, conn);
        if (!buffer) return m.reply(`╭┈┈⬡「 *ɢᴀɢᴀʟ* 」\n┃ ✧ ᴛɪᴅᴀᴋ ʙɪsᴀ ᴍᴇɴɢᴀᴍʙɪʟ ᴍᴇᴅɪᴀ.\n╰┈┈┈┈┈┈┈┈⬡`);
        if (media.type === 'imageMessage') {
            rawContent.image = buffer;
            rawContent.caption = text || media.message?.caption || '';
        } else if (media.type === 'videoMessage') {
            rawContent.video = buffer;
            rawContent.caption = text || media.message?.caption || '';
        } else {
            rawContent.audio = buffer;
        }
    } else if (text && text.trim()) {
        rawContent.text = text.trim();
        rawContent.font = 0;
        rawContent.backgroundColor = '#128C7E';
    } else {
        return m.reply(
            `╭┈┈⬡「 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
            `┃ ✧ .sᴡɢᴄ ᴛᴇᴋs — sᴛᴏʀʏ ᴛᴇᴋs\n` +
            `┃ ✧ ʀᴇᴘʟʏ ɢᴀᴍʙᴀʀ/ᴠɪᴅᴇᴏ/ᴀᴜᴅɪᴏ + .sᴡɢᴄ\n` +
            `┃ ✧ ᴋɪʀɪᴍ ɢᴀᴍʙᴀʀ/ᴠɪᴅᴇᴏ/ᴀᴜᴅɪᴏ + ᴄᴀᴘᴛɪᴏɴ .sᴡɢᴄ\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        );
    }
    const isFromGroup = m.chat?.endsWith('@g.us');
    if (isFromGroup) {
        await conn.sendMessage(m.chat, { react: { text: '🕕', key: m.key } });
        try {
            const content = await buildContent(rawContent);
            await sendGroupStatus(conn, m.chat, content);
            await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        } catch (err) {
            await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            await m.reply(`╭┈┈⬡「 *ɢᴀɢᴀʟ ᴘᴏsᴛ sᴛᴏʀʏ* 」\n┃ ✧ ${err?.message || 'Unknown error'}\n╰┈┈┈┈┈┈┈┈⬡`);
        }
        return;
    }
    pendingSwgc.set(m.sender, { rawContent, timestamp: Date.now() });
    try {
        const groups = await conn.groupFetchAllParticipating();
        const groupList = Object.entries(groups);
        if (groupList.length === 0) {
            pendingSwgc.delete(m.sender);
            return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ʙᴏᴛ ᴛɪᴅᴀᴋ ʙᴇʀᴀᴅᴀ ᴅɪ ɢʀᴜᴘ ᴍᴀɴᴀᴘᴜɴ.\n╰┈┈┈┈┈┈┈┈⬡`);
        }
        const mediaLabel = getMediaLabel(rawContent);
        const MAX_PER_SECTION = 10;
        const bodyText =
            `╭┈┈⬡「 *ᴘɪʟɪʜ ɢʀᴜᴘ ᴜɴᴛᴜᴋ ᴘᴏsᴛ sᴛᴏʀʏ* 」\n` +
            `┃ ✧ ᴍᴇᴅɪᴀ       : ${mediaLabel}\n` +
            `┃ ✧ ᴛᴏᴛᴀʟ ɢʀᴜᴘ : ${groupList.length}\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `Pilih grup dari daftar di bawah untuk posting story.`;
        const btn = new Button(conn).setBody(bodyText).setFooter(`© ${footer}`);
        btn.addSelection('Pilih Grup');
        for (let i = 0; i < groupList.length; i += MAX_PER_SECTION) {
            const slice = groupList.slice(i, i + MAX_PER_SECTION);
            const sectionTitle = `Grup ${i + 1}–${Math.min(i + MAX_PER_SECTION, groupList.length)} dari ${groupList.length}`;
            btn.makeSection(sectionTitle);
            for (const [id, meta] of slice) {
                btn.makeRow(
                    meta.subject?.slice(0, 20) || 'Grup',
                    (meta.subject || 'Unknown Group').slice(0, 40),
                    id,
                    `.swgc --confirm ${id}`
                );
            }
        }
        btn.addReply('Batal', '.cancelswgc');
        const fkontak = await buildFkontak(conn, config);
        await btn.send(m.chat, { quoted: fkontak || m });
    } catch (err) {
        pendingSwgc.delete(m.sender);
        return m.reply(`╭┈┈⬡「 *ɢᴀɢᴀʟ* 」\n┃ ✧ ᴛɪᴅᴀᴋ ʙɪsᴀ ᴍᴇɴɢᴀᴍʙɪʟ ᴅᴀꜰᴛᴀʀ ɢʀᴜᴘ.\n┃ ✧ ${err?.message || 'Unknown error'}\n╰┈┈┈┈┈┈┈┈⬡`);
    }
};
handler.help = ['swgc <teks>', 'swgc (reply media)'];
handler.tags = ['tools'];
handler.command = /^(swgc|statusgrup|swgroup|groupstory|toswgc|cancelswgc)$/i;
handler.limit = true;
export default handler;
export { sendGroupStatus };