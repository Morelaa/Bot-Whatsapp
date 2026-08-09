'use strict';
import { downloadMediaMessage } from '@itsliaaa/baileys';
import sharp from 'sharp';
import config from '../config.js';
import { buildFkontak, buildForwardContext } from '../Library/utils.js';
import { logError, logWarn } from './logutil.js';
import { isUnbranded } from './brandcontext.js';
import { getReplyStyle } from '../System/replystyle.js';
let thumbCache = null;
async function getDocThumb() {
    if (thumbCache)
        return thumbCache;
    try {
        const res = await fetch(config.thumbnail);
        const raw = Buffer.from(await res.arrayBuffer());
        thumbCache = await sharp(raw).resize(320, 320, { fit: 'inside' }).jpeg({ quality: 80 }).toBuffer();
    }
    catch {
        thumbCache = Buffer.alloc(0);
    }
    return thumbCache;
}
function isBrandableContent(content) {
    if (!content || content.react || content.delete || content.poll || content.edit)
        return false;
    return true;
}
function isPureText(content) {
    return (!!content.text &&
        !content.image &&
        !content.video &&
        !content.audio &&
        !content.document &&
        !content.sticker &&
        !content.buttons &&
        !content.sections &&
        !content.footer &&
        !(content.mentions?.length));
}
export function extendSocket(sock) {
    const originalSendMessage = sock.sendMessage.bind(sock);
    sock.sendMessage = async (jid, content, options = {}) => {
        if (!config.brandedReplies || !isBrandableContent(content) || isUnbranded()) {
            return originalSendMessage(jid, content, options);
        }
        const fkontak = await buildFkontak(sock, config);
        if (isPureText(content)) {
            try {
                const thumb = await getDocThumb();
                const quotedRef = fkontak;
                const style = getReplyStyle();
                const messageContent = style === 'v2'
                    ? {
                        viewOnceMessage: {
                            message: {
                                interactiveMessage: {
                                    header: {
                                        title: '',
                                        subtitle: '',
                                        hasMediaAttachment: false,
                                    },
                                    body: {
                                        text: content.text,
                                    },
                                    footer: {
                                        text: `${config.ownerName}`,
                                    },
                                    nativeFlowMessage: {
                                        buttons: [
                                            {
                                                name: 'inapp_signup',
                                                buttonParamsJson: '{}',
                                            },
                                        ],
                                        messageParamsJson: '{}',
                                    },
                                    contextInfo: {
                                        ...buildForwardContext(config),
                                        isForwarded: false,
                                        forwardingScore: 0,
                                        participant: '13135550002@s.whatsapp.net',
                                        quotedMessage: {
                                            groupInviteMessage: {
                                                groupJid: '0@g.us',
                                                inviteCode: 'abdinr',
                                                caption: config.botName,
                                            },
                                        },
                                        remoteJid: 'status@broadcast',
                                        expiration: 0,
                                        quotedType: 'EXPLICIT',
                                    },
                                },
                            },
                        },
                    }
                    : {
                        extendedTextMessage: {
                            text: `https://google.com\n\n${content.text}`,
                            matchedText: 'https://google.com',
                            title: '',
                            description: `${config.ownerName}`,
                            previewType: 'NONE',
                            jpegThumbnail: thumb.toString('base64'),
                            contextInfo: {
                                ...buildForwardContext(config),
                                quotedMessage: quotedRef?.message,
                                participant: quotedRef?.key?.participant,
                                stanzaId: quotedRef?.key?.id,
                                remoteJid: quotedRef?.key?.remoteJid,
                            },
                        },
                    };
                const msgId = await sock.relayMessage(jid, messageContent, {});
                return {
                    key: { remoteJid: jid, fromMe: true, id: msgId },
                    message: messageContent,
                    messageTimestamp: Math.floor(Date.now() / 1000),
                };
            }
            catch (err) {
                logWarn('Gagal kirim styled text, fallback ke sendMessage biasa:', err?.message);
            }
        }
        const isSticker = !!content.sticker;
        const isAudio = !!content.audio;
        if (!isSticker && !isAudio && !options.quoted) {
            options = { ...options, quoted: fkontak };
        }
        return originalSendMessage(jid, content, options);
    };
    sock.safeSend = async (jid, content, options = {}, { retries = 2 } = {}) => {
        let lastErr;
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                return await sock.sendMessage(jid, content, options);
            }
            catch (err) {
                lastErr = err;
                logWarn(`safeSend gagal (percobaan ${attempt + 1}/${retries + 1}):`, err?.message);
                await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
            }
        }
        logError('safeSend menyerah setelah retry:', lastErr?.message);
        throw lastErr;
    };
    sock.reply = async (jid, text, quotedMsg, options = {}) => {
        return sock.safeSend(jid, { text, ...options }, { quoted: quotedMsg });
    };
    sock.setTyping = async (jid, type = 'composing') => {
        try {
            await sock.presenceSubscribe(jid);
            await sock.sendPresenceUpdate(type, jid);
        }
        catch {
        }
    };
    sock.downloadMedia = async (msg) => {
        try {
            return await downloadMediaMessage(msg, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
        }
        catch (err) {
            logError('Gagal download media:', err?.message);
            return null;
        }
    };
    sock.reactSafe = async (jid, msgKey, emoji) => {
        try {
            await sock.sendMessage(jid, { react: { text: emoji, key: msgKey } });
        }
        catch {
        }
    };
    sock.isInGroup = async (groupJid) => {
        try {
            await sock.groupMetadata(groupJid);
            return true;
        }
        catch {
            return false;
        }
    };
    return sock;
}
export default extendSocket;
