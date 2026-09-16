//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import crypto from 'crypto';
import { downloadMediaMessage } from '@itsliaaa/baileys';
import sharp from 'sharp';
import config from '../config.js';
import { buildFkontak, buildForwardContext, loadConfigImage } from '../Library/utils.js';
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
function stripBoxChars(text) {
    return String(text || '')
        .split('\n')
        .map((line) => line.replace(/^[╭╰┃│┊┈┄⬡「」\s]+|[╭╰┃│┊┈┄⬡」\s]+$/g, '').trim())
        .filter((line) => line.length > 0)
        .join('\n')
        .trim();
}
function extractCopyrightFooter(text) {
    const lines = String(text || '').split('\n');
    let lastIdx = lines.length - 1;
    while (lastIdx >= 0 && lines[lastIdx].replace(/[╭╰┃│┊┈┄⬡「」\s]/g, '').length === 0) {
        lastIdx--;
    }
    if (lastIdx < 0) return { body: text, footer: null };
    const candidate = lines[lastIdx].trim();
    if (/^©/.test(candidate)) {
        return { body: lines.slice(0, lastIdx).join('\n'), footer: candidate };
    }
    return { body: text, footer: null };
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
                let messageContent;
                if (style === 'v2') {
                    const { body: bodyRawV2, footer: footerLineV2 } = extractCopyrightFooter(content.text);
                    const bodyTextV2 = stripBoxChars(bodyRawV2);
                    messageContent = {
                        viewOnceMessage: {
                            message: {
                                interactiveMessage: {
                                    header: {
                                        title: '',
                                        subtitle: '',
                                        hasMediaAttachment: false,
                                    },
                                    body: {
                                        text: footerLineV2 ? `${bodyTextV2}\n\n\n${footerLineV2}` : bodyTextV2,
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
                    };
                }
                else if (style === 'v3') {
                    const { body: bodyRaw } = extractCopyrightFooter(content.text);
                    const rawImg = await loadConfigImage(config.thumbnail);
                    let imgBuf = rawImg;
                    try {
                        imgBuf = await sharp(rawImg).resize(300, 300, { fit: 'inside' }).jpeg({ quality: 70 }).toBuffer();
                    }
                    catch { }
                    messageContent = {
                        interactiveMessage: {
                            header: { title: config.botName || 'Bot' },
                            body: { text: stripBoxChars(bodyRaw) },
                            nativeFlowMessage: {
                                buttons: [
                                    { name: 'inapp_signup', buttonParamsJson: '{}' },
                                ],
                            },
                            contextInfo: {
                                ...buildForwardContext(config),
                                quotedMessage: {
                                    orderMessage: {
                                        orderId: String(Date.now()),
                                        thumbnail: imgBuf,
                                        itemCount: 2026,
                                        status: 'INQUIRY',
                                        surface: 'CATALOG',
                                        message: `© ${config.copyrightName || 'Bot'}`,
                                        orderTitle: config.botName || 'Bot',
                                        sellerJid: '0@s.whatsapp.net',
                                        totalAmount1000: '0',
                                        totalCurrencyCode: 'IDR',
                                    },
                                },
                                participant: '0@s.whatsapp.net',
                                remoteJid: 'status@broadcast',
                                isForwarded: false,
                                forwardingScore: 0,
                            },
                        },
                    };
                }
                else if (style === 'v4') {
                    const { body: bodyRawV4 } = extractCopyrightFooter(content.text);
                    const rawImg = await loadConfigImage(config.menuImage);
                    let imgBuf = rawImg;
                    try {
                        imgBuf = await sharp(rawImg).resize(300, 300, { fit: 'inside' }).jpeg({ quality: 70 }).toBuffer();
                    }
                    catch { }
                    let badgeThumb = Buffer.alloc(0);
                    try {
                        const rawBadge = await loadConfigImage(config.thumbnail);
                        if (rawBadge?.length) {
                            badgeThumb = await sharp(rawBadge)
                                .resize(300, 300, { fit: 'cover', position: 'center' })
                                .jpeg({ quality: 80 })
                                .toBuffer();
                        }
                    }
                    catch { }
                    const v4QuotedMessage = {
                        orderMessage: {
                            orderId: String(Date.now()),
                            thumbnail: badgeThumb,
                            itemCount: 2026,
                            status: 0,
                            surface: 0,
                            message: `© ${config.copyrightName || config.botName || 'Bot'}`,
                            orderTitle: '',
                            sellerJid: '0@s.whatsapp.net',
                            totalAmount1000: '0',
                            totalCurrencyCode: 'IDR',
                        },
                    };
                    messageContent = {
                        orderMessage: {
                            orderId: String(Date.now()),
                            thumbnail: imgBuf,
                            itemCount: 1,
                            status: 0,
                            surface: 0,
                            message: stripBoxChars(bodyRawV4),
                            orderTitle: config.botName || 'Bot',
                            token: crypto.randomBytes(4).toString('hex'),
                            totalAmount1000: '0',
                            totalCurrencyCode: 'IDR',
                            messageVersion: 1,
                            contextInfo: {
                                participant: '0@s.whatsapp.net',
                                quotedMessage: v4QuotedMessage,
                            },
                        },
                    };
                }
                else if (style === 'v5') {
                    const { body: bodyRawV5, footer: footerLineV5 } = extractCopyrightFooter(content.text);
                    const bodyTextV5 = stripBoxChars(bodyRawV5);
                    const rawImgV5 = await loadConfigImage(config.menuImage);
                    let imgBufV5 = rawImgV5;
                    try {
                        imgBufV5 = await sharp(rawImgV5).resize(300, 300, { fit: 'inside' }).jpeg({ quality: 70 }).toBuffer();
                    }
                    catch { }
                    messageContent = {
                        extendedTextMessage: {
                            text: `https://google.com\n\n${footerLineV5 ? `${bodyTextV5}\n\n\n${footerLineV5}` : bodyTextV5}`,
                            matchedText: 'https://google.com',
                            title: '',
                            description: `${config.ownerName}`,
                            previewType: 'NONE',
                            jpegThumbnail: thumb.toString('base64'),
                            contextInfo: {
                                ...buildForwardContext(config),
                                quotedMessage: {
                                    orderMessage: {
                                        orderId: String(Date.now()),
                                        thumbnail: imgBufV5,
                                        itemCount: 2026,
                                        status: 'INQUIRY',
                                        surface: 'CATALOG',
                                        message: `© ${config.copyrightName || 'Bot'}`,
                                        orderTitle: config.botName || 'Bot',
                                        sellerJid: '13135550002@s.whatsapp.net',
                                        totalAmount1000: '0',
                                        totalCurrencyCode: 'IDR',
                                    },
                                },
                                participant: '13135550002@s.whatsapp.net',
                                remoteJid: 'status@broadcast',
                            },
                        },
                    };
                }
                else {
                    const { body: bodyRawV1, footer: footerLineV1 } = extractCopyrightFooter(content.text);
                    const bodyTextV1 = stripBoxChars(bodyRawV1);
                    messageContent = {
                        extendedTextMessage: {
                            text: `https://google.com\n\n${footerLineV1 ? `${bodyTextV1}\n\n\n${footerLineV1}` : bodyTextV1}`,
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
                }
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
