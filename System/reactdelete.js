'use strict';
// Fitur: kalau owner / main owner ngereact pesan yang dikirim BOT sendiri
// pakai emoji ❌, bot bakal hapus pesan itu buat semua orang di chat.
import { checkOwner, checkMainOwner } from '../Core/permissions.js';
import { logError, logInfo } from '../Core/logutil.js';

const DELETE_EMOJI = '❌';

/**
 * Ambil jid orang yang ngasih reaksi.
 * Baileys nge-wrap identitas pereaksi di `reaction.key`
 * (key ini punya arti beda dari `key` di level atas, yang nunjuk ke
 * pesan target yang direact).
 */
function resolveReactorJid(sock, reaction) {
    if (!reaction?.key)
        return null;
    if (reaction.key.fromMe) {
        // Reaksi datang dari akun bot sendiri (mode selfbot: owner = nomor bot).
        return sock?.user?.id || null;
    }
    return reaction.key.participant || reaction.key.remoteJid || null;
}

export function bindReactionDelete(sock) {
    sock.ev.on('messages.reaction', async (reactions) => {
        for (const item of reactions || []) {
            try {
                const { key, reaction } = item || {};
                if (!key || !reaction)
                    continue;
                // Reaksi dilepas (unreact) dikirim dengan text kosong, skip.
                if (reaction.text !== DELETE_EMOJI)
                    continue;
                // Cuma boleh hapus pesan yang memang dikirim bot sendiri.
                if (!key.fromMe)
                    continue;

                const reactorJid = resolveReactorJid(sock, reaction);
                if (!reactorJid)
                    continue;

                const isGroup = key.remoteJid?.endsWith('@g.us');
                const participants = isGroup
                    ? globalThis.__botStore__?.getGroupMetadata(key.remoteJid)?.participants
                    : undefined;

                const authorized = checkMainOwner(reactorJid, participants) || checkOwner(reactorJid, participants);
                if (!authorized)
                    continue;

                await sock.sendMessage(key.remoteJid, { delete: key });
            }
            catch (err) {
                logError('reactdelete: gagal proses reaksi hapus pesan:', err?.stack || err?.message);
            }
        }
    });
    logInfo('Fitur hapus-pesan-via-reaksi ❌ aktif.');
}

export default { bindReactionDelete };
