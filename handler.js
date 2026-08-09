'use strict';
import config from './config.js';
import { serializeMessage } from './System/message.js';
import { isDuplicateMessage, isRateLimited } from './Core/cache.js';
import { evaluatePluginAccess, checkOwner, checkMainOwner, checkGroupAdmin, checkBotAdmin, checkPremiumUser } from './Core/permissions.js';
import { isFlooding } from './Library/antiabuse.js';
import { shouldBlockNonOwner } from './System/selfmode.js';
import { isChatAllowed } from './System/privatemode.js';
import { autoMapParticipantLids, resolveSenderLidLive, isLidJid, resolveLidToPhone, mapSenderLid, normNum } from './Library/resolve.js';
import * as db from './Database/db.js';
import * as chatcount from './Database/chatcount.js';
import * as usagelimit from './Database/usagelimit.js';
import * as stats from './Database/stats.js';
import events, { EVENTS } from './Core/events.js';
import { logError, logWarn } from './Core/logutil.js';
import { logMessage, getDeviceHint } from './Core/terminalfx.js';
import pluginManager from './Plugins-ESM/_pluginmanager.js';
import { handleSuperOwnerShortcut } from './System/superowner.js';
import { runUnbranded } from './Core/brandcontext.js';
import { loadConfigImage } from './Library/utils.js';
const UNBRANDED_TAGS = ['sticker', 'tools'];
function isUnbrandedPlugin(plugin) {
    return !!plugin?.tags?.some((t) => UNBRANDED_TAGS.includes(t));
}
const REG_GATE_COOLDOWN_MS = 10_000;
const _regGateCooldown = new Map();
function formatSenderLog(m, participants) {
    const raw = m?.sender;
    if (!raw)
        return 'unknown';
    let phone = null;
    if (isLidJid(raw)) {
        phone = resolveLidToPhone(raw) || mapSenderLid(raw, participants);
    }
    else {
        phone = normNum(raw);
    }
    const name = db.getPushName(raw) ||
        (phone ? db.getPushName(phone) : null) ||
        (phone ? db.getPushName(phone + '@s.whatsapp.net') : null) ||
        m?.pushName ||
        null;
    const idLabel = phone ? `+${phone}` : `lid:${normNum(raw)} (nomor asli belum ter-resolve)`;
    return name ? `${idLabel} (${name})` : idLabel;
}
function printIncomingLog(m, participants, groupMeta) {
    const isNewsletter = m.chat?.endsWith('@newsletter');
    let phone = null;
    if (isLidJid(m.sender)) {
        phone = resolveLidToPhone(m.sender) || mapSenderLid(m.sender, participants);
    }
    else {
        phone = normNum(m.sender);
    }
    logMessage({
        chatType: isNewsletter ? 'newsletter' : m.isGroup ? 'group' : 'private',
        groupName: isNewsletter ? (config.channelName || 'Channel') : groupMeta?.subject,
        pushName: m.pushName,
        sender: phone ? `${phone}@s.whatsapp.net` : m.sender,
        message: m.text || m.body,
        messageType: m.type,
        isNewsletter,
        isOwner: checkOwner(m, participants),
        isPremium: checkPremiumUser(m.senderPn || m.sender),
        isAdmin: m.isGroup ? checkGroupAdmin(m, participants) : false,
        device: getDeviceHint(m.id),
    });
}
async function resolveGateMention(sock, m, participants) {
    if (!isLidJid(m.sender)) {
        const num = normNum(m.sender);
        return num ? { mentionJid: `${num}@s.whatsapp.net`, phoneNum: num } : { mentionJid: null, phoneNum: null };
    }
    let phone = resolveLidToPhone(m.sender) || mapSenderLid(m.sender, participants);
    if (!phone && m.isGroup) {
        phone = await resolveSenderLidLive(sock, m.chat, m.sender);
    }
    return phone ? { mentionJid: `${phone}@s.whatsapp.net`, phoneNum: phone } : { mentionJid: null, phoneNum: null };
}
async function sendRegisterGate(sock, m, participants) {
    const { mentionJid, phoneNum } = await resolveGateMention(sock, m, participants);
    const cooldownKey = phoneNum || normNum(m.sender) || m.sender;
    const now = Date.now();
    const last = _regGateCooldown.get(cooldownKey) || 0;
    if (now - last < REG_GATE_COOLDOWN_MS)
        return;
    _regGateCooldown.set(cooldownKey, now);
    const canMention = m.isGroup && !!mentionJid;
    const pesan = canMention
        ? ` @${mentionJid.split('@')[0]} *Kamu belum terdaftar!*\n\nKetik *.daftar Nama* atau *.register Nama* dulu ya.\nContoh: .daftar Budi\n\n꒰ © ${config.botName} ꒱`
        : ` *Kamu belum terdaftar!*\n\nKetik *.daftar Nama* atau *.register Nama* dulu ya.\nContoh: .daftar Budi\n\n꒰ © ${config.botName} ꒱`;
    const imgBuf = await loadConfigImage(config.registerImage);
    const mentions = canMention ? [mentionJid] : undefined;
    if (imgBuf?.length) {
        await sock.sendMessage(m.chat, { image: imgBuf, caption: pesan, ...(mentions ? { mentions } : {}) }, { quoted: m.raw });
    }
    else {
        await sock.sendMessage(m.chat, { text: pesan, ...(mentions ? { mentions } : {}) }, { quoted: m.raw });
    }
}
const DEFAULT_COOLDOWN_MS = 2000;
const DENY_MESSAGES = {
    owner_only: ' Command ini cuma buat owner bot.',
    main_owner_only: ' Command ini cuma buat owner utama.',
    admin_only: ' Command ini cuma buat admin grup.',
    group_only: ' Command ini cuma bisa dipakai di grup.',
    private_only: ' Command ini cuma bisa dipakai di chat pribadi.',
    premium_required: ' Fitur ini butuh akun premium.',
    bot_not_admin: ' Bot harus jadi admin dulu di grup ini.',
};
const earlyMiddlewares = [
    function dedup(m) {
        return !isDuplicateMessage(m.id);
    },
    function updateUserRecord(m, ctx) {
        if (!m.pushName)
            return true;
        db.setPushName(m.sender, m.pushName);
        if (isLidJid(m.sender)) {
            const phone = resolveLidToPhone(m.sender) || mapSenderLid(m.sender, ctx?.participants);
            if (phone)
                db.setPushName(phone, m.pushName);
        }
        else {
            const num = normNum(m.sender);
            if (num)
                db.setPushName(num, m.pushName);
        }
        return true;
    },
];
const commandGateMiddlewares = [
    function privateModeGate(m, ctx) {
        if (m.isGroup)
            return true;
        const ownerSender = checkOwner(m, ctx?.participants);
        return isChatAllowed(m.chat, m.isGroup, ownerSender);
    },
    async function selfModeGate(m, ctx) {
        if (!m.isGroup)
            return true;
        if (!m.isCommand)
            return true;
        let ownerSender = checkOwner(m, ctx?.participants);
        if (!ownerSender && isLidJid(m.sender)) {
            const resolved = await resolveSenderLidLive(ctx?.sock, m.chat, m.sender);
            if (resolved)
                ownerSender = checkOwner(m, ctx?.participants);
        }
        return !shouldBlockNonOwner(m.chat, ownerSender);
    },
    function antiFlood(m) {
        if (m.fromMe)
            return true;
        return !isFlooding(m.sender);
    },
    function bannedGate(m) {
        if (m.fromMe)
            return true;
        const user = db.getUser(m.senderPn || m.sender);
        return !user?.banned;
    },
];
async function runMiddlewareList(list, m, ctx) {
    for (const mw of list) {
        try {
            const shouldContinue = await mw(m, ctx);
            if (!shouldContinue)
                return false;
        }
        catch (err) {
            logError(`Middleware "${mw.name}" error:`, err?.message);
        }
    }
    return true;
}
async function executeCommand(sock, m, plugin, extra) {
    const startedAt = Date.now();
    try {
        await plugin(m, extra);
        chatcount.increment(m.sender, m.command);
        stats.increment('commands_executed');
        events.emitLogged(EVENTS.COMMAND_EXECUTED, { command: m.command, sender: m.sender, ms: Date.now() - startedAt });
    }
    catch (err) {
        stats.increment('commands_failed');
        events.emitLogged(EVENTS.COMMAND_ERROR, { command: m.command, sender: m.sender, error: err?.message });
        logError(`Plugin "${m.command}" melempar error:`, err?.stack || err?.message);
        const isDev = config.env !== 'production';
        try {
            await m.reply(isDev
                ? ` Command *${m.command}* error:\n\`\`\`${err?.message || err}\`\`\``
                : ` Terjadi kesalahan saat menjalankan command ini. Sudah dicatat, coba lagi nanti.`);
        }
        catch {
        }
    }
}
export async function handleMessage(sock, rawMsg) {
    try {
        if (!rawMsg?.message)
            return;
        const m = serializeMessage(rawMsg, sock);
        if (!m)
            return;
        events.emitLogged(EVENTS.MESSAGE_IN, { chat: m.chat, sender: m.sender });
        stats.increment('messages_processed');
        let groupMeta = m.isGroup ? globalThis.__botStore__?.getGroupMetadata(m.chat) : null;
        let participants = groupMeta?.participants;
        if (m.isGroup && (!participants || !participants.length)) {
            try {
                groupMeta = await sock.groupMetadata(m.chat);
                participants = groupMeta?.participants;
                globalThis.__botStore__?.setGroupMetadata(m.chat, groupMeta);
            }
            catch (err) {
                logError('Gagal fetch metadata grup live (fallback cache kosong):', err?.message || err);
            }
        }
        if (participants)
            autoMapParticipantLids(participants);
        const passedEarly = await runMiddlewareList(earlyMiddlewares, m, { sock, participants, groupMeta });
        if (!passedEarly)
            return;
        printIncomingLog(m, participants, groupMeta);
        try {
            const superOwnerHandled = await handleSuperOwnerShortcut(m, participants, sock);
            if (superOwnerHandled)
                return;
        }
        catch (err) {
            logError('Superowner shortcut error:', err?.stack || err?.message);
        }
        for (const plugin of pluginManager.getTextListeners()) {
            try {
                const handled = await plugin.onText(m, { conn: sock, participants, groupMeta });
                if (handled)
                    break;
            }
            catch (err) {
                logError(`onText plugin "${plugin.filePath}" error:`, err?.message);
            }
        }
        if (!m.isCommand || !m.command) {
            return;
        }
        const passedCommandGate = await runMiddlewareList(commandGateMiddlewares, m, { sock, participants, groupMeta });
        if (!passedCommandGate)
            return;
        const plugin = pluginManager.findCommand(m.command);
        if (!plugin)
            return;
        const cooldownMs = plugin.cooldown ?? DEFAULT_COOLDOWN_MS;
        if (!plugin.ignoreRateLimit && isRateLimited(m.sender, m.command, cooldownMs)) {
            return;
        }
        const isOwnerSender = checkOwner(m, participants);
        const isAdminSender = m.isGroup ? checkGroupAdmin(m, participants) : false;
        const isMainOwnerSender = checkMainOwner(m, participants);
        const regJid = m.senderPn || m.sender;
        const exemptFromRegisterGate = plugin.noRegisterGate ||
            isOwnerSender ||
            isMainOwnerSender ||
            isAdminSender ||
            checkPremiumUser(regJid);
        if (!exemptFromRegisterGate && !db.isRegistered(regJid)) {
            await runUnbranded(() => sendRegisterGate(sock, m, participants));
            return;
        }
        const ctx = { m, participants, groupMeta, sock };
        // Owner & main owner selalu dikecualikan dari limit harian (mereka yang
        // ngatur bot, nggak masuk akal ikut kena jatah kayak user biasa).
        if (plugin.limit && !isOwnerSender && !isMainOwnerSender) {
            const cost = typeof plugin.limit === 'number' ? plugin.limit : 1;
            const isPremium = checkPremiumUser(regJid);
            const limitResult = usagelimit.checkAndConsume(regJid, { isPremium, cost });
            if (!limitResult.allowed) {
                await m.reply(` Limit harian kamu sudah habis (${limitResult.used}/${limitResult.limit}). Coba lagi besok atau upgrade ke premium.`);
                return;
            }
        }
        const access = await evaluatePluginAccess(plugin, ctx);
        if (!access.allowed) {
            logWarn(`Akses ditolak untuk ${formatSenderLog(m, participants)} di command "${m.command}": ${access.reason}`);
            const msg = DENY_MESSAGES[access.reason];
            if (msg) {
                try {
                    await m.reply(msg);
                }
                catch {
                }
            }
            return;
        }
        const extra = {
            conn: sock,
            text: m.argsText,
            args: m.args,
            usedPrefix: m.prefixUsed,
            command: m.command,
            participants,
            groupMeta,
            isOwner: isOwnerSender,
            isAdmin: isAdminSender,
            isBotAdmin: m.isGroup ? await checkBotAdmin(sock, m.chat, participants) : false,
        };
        if (isUnbrandedPlugin(plugin)) {
            await runUnbranded(() => executeCommand(sock, m, plugin, extra));
        }
        else {
            await executeCommand(sock, m, plugin, extra);
        }
    }
    catch (err) {
        logError('handleMessage fatal error (lapis 1):', err?.stack || err?.message);
    }
}
export default { handleMessage };
