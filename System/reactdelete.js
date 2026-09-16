//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import { checkOwner, checkMainOwner } from '../Core/permissions.js';
import { logError, logInfo } from '../Core/logutil.js';
const DELETE_EMOJI = '❌';
function resolveReactorJid(sock, reaction) {
    if (!reaction?.key)
        return null;
    if (reaction.key.fromMe) {
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
                if (reaction.text !== DELETE_EMOJI)
                    continue;
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
