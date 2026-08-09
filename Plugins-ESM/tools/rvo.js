'use strict';
import { checkPremiumUser } from '../../Core/permissions.js';
function unwrapViewOnce(message) {
    return (
        message?.viewOnceMessageV2?.message ||
        message?.viewOnceMessageV2Extension?.message ||
        message?.viewOnceMessage?.message ||
        message?.ephemeralMessage?.message ||
        message
    );
}
const handler = async (m, { conn, isOwner, isAdmin, args }) => {
    const cmd = m.command.toLowerCase();
    if ((cmd === 'makasih' || cmd === 'mekasih') && args[0]?.toLowerCase() !== 'sayang') {
        return;
    }
    if (!m.quoted || !m.quoted.message) return;
    const unwrapped = unwrapViewOnce(m.quoted.message);
    const media = unwrapped?.imageMessage || unwrapped?.videoMessage || unwrapped?.audioMessage || unwrapped?.documentMessage;
    if (!media) return;
    const isPremium = checkPremiumUser(m.senderPn || m.sender);
    const bisaAkses = isOwner || isPremium || isAdmin;
    if (!bisaAkses) return;
    try {
        const target = {
            key: m.quoted.key,
            message: unwrapped,
        };
        const buffer = await conn.downloadMedia(target);
        if (!buffer || !buffer.length) return;
        const mime = media.mimetype || '';
        let type = 'document';
        if (mime.startsWith('image/')) type = 'image';
        else if (mime.startsWith('video/')) type = 'video';
        else if (mime.startsWith('audio/')) type = 'audio';
        const senderInfo = m.quoted.sender || 'unknown';
        const senderNumber = senderInfo.split('@')[0];
        const caption = `📩 *View-once berhasil dibuka!*\n` +
                        (media.caption ? `📝 Caption asli: ${media.caption}\n` : '') +
                        `👤 Dari: ${senderNumber}\n` +
                        `🕐 ${new Date().toLocaleString()}`;
        const botJid = conn.user.id || conn.user.jid;
        const botNumber = botJid ? botJid.split(':')[0] : conn.user?.number || '0';
        const botChatId = botNumber + '@s.whatsapp.net';
        await conn.sendMessage(botChatId, {
            [type]: buffer,
            mimetype: mime,
            caption: caption,
        });
    } catch (e) {
        console.error('[RVO]', e);
    }
};
handler.command = /^(makasih|mekasih|makasihsayang|mekasihsayang)$/i;
handler.tags = ['tools'];
handler.help = ['makasih sayang (reply view-once)'];
handler.limit = true;
export default handler;
