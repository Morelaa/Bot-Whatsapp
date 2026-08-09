'use strict';
import { default as makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, DisconnectReason, } from '@itsliaaa/baileys';
import { Boom } from '@hapi/boom';
import NodeCache from 'node-cache';
import readline from 'readline';
import fs from 'fs';
import config from './config.js';
import store from './Core/store.js';
import extendSocket from './Core/sockext.js';
import pluginManager from './Plugins-ESM/_pluginmanager.js';
import { handleMessage } from './handler.js';
import logger from './System/logger.js';
import { logInfo, logSuccess, logWarn, logError } from './Core/logutil.js';
import { playBootSequence, logConnection } from './Core/terminalfx.js';
import events, { EVENTS } from './Core/events.js';
import { checkpointAndClose } from './Database/sqlite.js';
import { setLidMapping } from './Database/db.js';
import { bindReactionDelete } from './System/reactdelete.js';
let reconnectAttempts = 0;
function askQuestion(query) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => rl.question(query, (answer) => { rl.close(); resolve(answer.trim()); }));
}
function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
async function primeMainOwnerLid(sock) {
    // Baileys can tell us the LID that corresponds to a phone number via
    // onWhatsApp(). We do this once at startup for the main owner so the
    // LID<->phone mapping already exists in the DB *before* any message comes
    // in — this is what makes DM-only owner commands (no group participants to
    // cross-reference) work reliably instead of depending on chance.
    const mainOwnerNum = String(config.mainOwner || '').replace(/[^0-9]/g, '');
    if (!mainOwnerNum || typeof sock.onWhatsApp !== 'function')
        return;
    const results = await sock.onWhatsApp(mainOwnerNum);
    const info = Array.isArray(results) ? results[0] : results;
    if (!info?.exists)
        return;
    const lidRaw = info.lid || info.jid?.endsWith?.('@lid') ? (info.lid || info.jid) : null;
    if (lidRaw) {
        const lidNum = String(lidRaw).split('@')[0].replace(/[^0-9]/g, '');
        if (lidNum) {
            setLidMapping(lidNum, mainOwnerNum);
            logInfo(`LID main owner ter-cache: ${lidNum} <-> ${mainOwnerNum}`);
        }
    }
}
async function startBot() {
    fs.mkdirSync(config.sessionDir, { recursive: true });
    const { state, saveCreds } = await useMultiFileAuthState(config.sessionDir);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    logInfo(`Menggunakan Baileys versi ${version.join('.')} (${isLatest ? 'terbaru' : 'bukan terbaru'})`);
    const msgRetryCounterCache = new NodeCache({ stdTTL: 60, useClones: false });
    let sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: false,
        browser: ['Ubuntu', 'Chrome', '114.0.5735.198'],
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,
        markOnlineOnConnect: true,
        connectTimeoutMs: 60_000,
        defaultQueryTimeoutMs: 60_000,
        keepAliveIntervalMs: 25_000,
        msgRetryCounterCache,
        cachedGroupMetadata: async (jid) => store.getGroupMetadata(jid) ?? undefined,
        getMessage: async (key) => (key.remoteJid ? store.getMessage(key.remoteJid, key.id) ?? undefined : undefined),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
    });
    sock = extendSocket(sock);
    store.bind(sock);
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            reconnectAttempts = 0;
            logSuccess(`${config.botName} berhasil terhubung sebagai ${sock.user?.id}`);
            logConnection('connected', `${config.botName} · ${sock.user?.id || '-'}`);
            events.emitLogged(EVENTS.READY, { user: sock.user });
            primeMainOwnerLid(sock).catch((err) => logWarn('Gagal priming LID main owner:', err?.message));
            store.reconcileGroups(sock)
                .then((count) => logInfo(`Reconcile grup selesai: ${count} grup aktif tersinkron ke database.`))
                .catch((err) => logError('Reconcile grup gagal:', err?.message || err));
        }
        if (connection === 'close') {
            const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
            const loggedOut = statusCode === DisconnectReason.loggedOut;
            if (loggedOut) {
                logError('Session logged out. Hapus folder session dan pairing ulang.');
                return;
            }
            reconnectAttempts++;
            if (reconnectAttempts > config.maxReconnectAttempts) {
                logError(`Gagal reconnect setelah ${config.maxReconnectAttempts}x percobaan. Bot berhenti.`);
                process.exit(1);
            }
            const delay = config.reconnectDelayMs * reconnectAttempts;
            logWarn(`Koneksi terputus (status ${statusCode}). Reconnect dalam ${delay}ms... (percobaan ${reconnectAttempts})`);
            logConnection('connecting', `Reconnect percobaan ${reconnectAttempts} (status ${statusCode})`);
            events.emitLogged(EVENTS.RECONNECTING, { attempt: reconnectAttempts, statusCode });
            setTimeout(startBot, delay);
        }
    });
    sock.ev.on('creds.update', saveCreds);
    bindReactionDelete(sock);
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify')
            return;
        for (const raw of messages) {
            handleMessage(sock, raw).catch((err) => logError('Unhandled error di handleMessage:', err?.message));
        }
    });
    if (!sock.authState?.creds?.registered) {
        await sleep(3000);
        let phoneNumber = config.pairingNumber;
        if (!phoneNumber) {
            phoneNumber = await askQuestion('Masukkan nomor WhatsApp bot (format: 628xxxxxxxxxx): ');
        }
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
        try {
            const code = config.pairingCustomCode
                ? await sock.requestPairingCode(phoneNumber, config.pairingCustomCode)
                : await sock.requestPairingCode(phoneNumber);
            logSuccess(`Kode pairing kamu: ${code?.match(/.{1,4}/g)?.join('-') || code}`);
            logInfo('Buka WhatsApp -> Perangkat Tertaut -> Tautkan dengan nomor telepon, lalu masukkan kode di atas.');
        }
        catch (err) {
            logError('Gagal request pairing code:', err?.message);
        }
    }
    return sock;
}
async function bootstrap() {
    await playBootSequence({ name: config.botName, version: config.botVersion, mode: config.env });
    logInfo(`Menyalakan ${config.botName} v${config.version}...`);
    await pluginManager.loadAll();
    await startBot();
    process.on('uncaughtException', (err) => logError('uncaughtException:', err?.stack || err?.message));
    process.on('unhandledRejection', (reason) => logError('unhandledRejection:', reason));
    let shuttingDown = false;
    for (const sig of ['SIGINT', 'SIGTERM']) {
        process.on(sig, () => {
            if (shuttingDown)
                return;
            shuttingDown = true;
            logInfo(`Menerima ${sig}, checkpoint database sebelum keluar...`);
            checkpointAndClose();
            process.exit(0);
        });
    }
}
bootstrap();
