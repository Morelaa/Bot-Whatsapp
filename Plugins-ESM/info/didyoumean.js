'use strict';
import config from '../../config.js';
import pluginManager from '../_pluginmanager.js';
import { ButtonV2 } from '../../Library/MessageBuilder.js';
import { isSelfMode } from '../../System/selfmode.js';
import { isRegistered, getPhoneByLid } from '../../Database/db.js';
import { TTLCache } from '../../Core/cache.js';
import { checkOwner, checkMainOwner } from '../../Core/permissions.js';
import { logError } from '../../Core/logutil.js';
import { resolveDisplayName } from '../../Library/resolve.js';
const DYM_IMAGE = config.didyoumeanImage;
const FOOTER = `© ${config.copyrightName || config.botName || 'Bot'}`;
const dedup = new TTLCache({ defaultTTL: 5000 });
function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) =>
        Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[m][n];
}
function findSimilar(input, allCmds, threshold = 2) {
    return allCmds
        .map((cmd) => ({ cmd, dist: levenshtein(input.toLowerCase(), cmd.toLowerCase()) }))
        .filter((x) => x.dist <= threshold && x.dist > 0)
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 3)
        .map((x) => ({
            cmd: x.cmd,
            similarity: Math.round((1 - x.dist / Math.max(x.cmd.length, input.length)) * 100),
        }));
}
function extractCommandWords(handler) {
    const src = handler.command?.source || '';
    const inner = src.replace(/^\^\(?/, '').replace(/\)?\$$/, '');
    return inner
        .split('|')
        .map((w) => w.replace(/\\/g, ''))
        .filter((w) => /^[a-z0-9_]+$/i.test(w));
}
function getAllCommandWords() {
    const words = [];
    for (const handler of pluginManager.getAllPlugins()) {
        words.push(...extractCommandWords(handler));
    }
    return [...new Set(words)];
}
const handler = async (m, { text, usedPrefix }) => {
    const keyword = (text || '').trim().toLowerCase();
    if (!keyword) {
        return m.reply(`╭┈┈⬡「 *ᴋᴇᴛɪᴋ ᴋᴀᴛᴀ ᴋᴜɴᴄɪ ᴄᴏᴍᴍᴀɴᴅ ʏᴀɴɢ ᴍᴀᴜ ᴅɪᴄᴀʀɪ.* 」\n┃\n┃ ✧ ᴄᴏɴᴛᴏʜ: *${usedPrefix}ᴄᴀʀɪᴘᴇʀɪɴᴛᴀʜ ꜱᴛɪᴋᴇʀ*\n╰┈┈┈┈┈┈┈┈⬡`);
    }
    const similars = findSimilar(keyword, getAllCommandWords(), 4);
    if (!similars.length) {
        return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴛɪᴅᴀᴋ ᴀᴅᴀ ᴄᴏᴍᴍᴀɴᴅ ʏᴀɴɢ ᴍɪʀɪᴘ ᴅᴇɴɢᴀɴ *${keyword}*.\n╰┈┈┈┈┈┈┈┈⬡`);
    }
    const list = similars.map((s) => ` ◦ ${usedPrefix}${s.cmd} (${s.similarity}%)`).join('\n');
    return m.reply(`╭┈┈⬡「 *ʀᴇᴋᴏᴍᴇɴᴅᴀꜱɪ ᴄᴏᴍᴍᴀɴᴅ:* 」\n┃ ✧ ${list}\n╰┈┈┈┈┈┈┈┈⬡`);
};
handler.onText = async (m, { conn, participants }) => {
    try {
        if (m.fromMe) return false;
        if (m.chat === 'status@broadcast') return false;
        if (!m.prefixUsed) return false;
        const isOwnerSender = checkMainOwner(m, participants) || checkOwner(m, participants);
        if (m.isGroup && isSelfMode(m.chat) && !isOwnerSender) return false;
        if (m.sender && !isOwnerSender && !isRegistered(m.senderPn || m.sender)) return false;
        const cmd = m.command;
        if (!cmd) return false;
        if (pluginManager.findCommand(cmd)) return false;
        const dedupKey = `${m.chat}:${cmd}`;
        if (dedup.has(dedupKey)) return false;
        dedup.set(dedupKey, true);
        const senderJid = m.sender;
        const isLid = senderJid.endsWith('@lid');
        const rawNum = senderJid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
        const phoneNum = isLid ? (getPhoneByLid(rawNum) || rawNum) : rawNum;
        const mentionJid = isLid ? senderJid : `${phoneNum}@s.whatsapp.net`;
        const displayName = await resolveDisplayName(conn, m, senderJid, {
            participants,
            fallback: phoneNum,
        });
        const similars = findSimilar(cmd, getAllCommandWords(), 3);
        const prefix = m.prefixUsed || '.';
        const bodyText = similars.length
            ? `Halo *${displayName}* , mungkin fitur ini yang sedang kamu cari?`
            : `Halo *${displayName}*\nCommand *${prefix}${cmd}* tidak tersedia.\nKetik *${prefix}menu* untuk semua command.`;
        let footerText = '';
        for (const s of similars) {
            footerText += `[ ◦ COMMAND    : ${prefix}${s.cmd}\n  ◦ SIMILARITY : ${s.similarity}% ]\n\n`;
        }
        footerText += FOOTER;
        const btn = new ButtonV2(conn)
            .setTitle('DIDYOUMEAN')
            .setSubtitle('')
            .setBody(bodyText)
            .setFooter(footerText)
            .setContextInfo({ mentionedJid: [mentionJid] });
        if (DYM_IMAGE) btn.setThumbnail(DYM_IMAGE);
        if (similars.length) {
            for (const s of similars) btn.addButton(`${prefix}${s.cmd}`, `${prefix}${s.cmd}`);
        } else {
            btn.addButton(' Menu', `${prefix}menu`);
        }
        const msg = await btn.build(m.chat, { userJid: conn.user?.id });
        await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
        return true;
    } catch (err) {
        logError('didyoumean onText error:', err?.stack || err?.message || err);
        return false;
    }
};
handler.help = ['cariperintah <kata>'];
handler.tags = ['info'];
handler.command = /^(cariperintah|searchcmd)$/i;
handler.limit = true;
export default handler;
