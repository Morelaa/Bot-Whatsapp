//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import store from '../Core/store.js';
const ALBUM_ASSOCIATION_TYPE = 1;
function getSenderId(key) {
    if (!key) return null;
    if (key.fromMe) return 'me';
    return key.participant || key.remoteJid || null;
}
export function unwrapAssociatedChild(msg) {
    const contextInfo = msg.message?.messageContextInfo;
    const inner = msg.message?.associatedChildMessage?.message;
    if (!inner) return msg;
    return {
        ...msg,
        message: {
            ...inner,
            messageContextInfo: contextInfo,
        },
    };
}
export function findAlbumChildren(chatId, parentId) {
    const bucket = store.messages?.[chatId];
    if (!bucket || !parentId) return [];
    const parentMsg = bucket.get(parentId);
    if (!parentMsg) return [];
    const parentSender = getSenderId(parentMsg.key);
    const children = [];
    for (const msg of bucket.values()) {
        if (msg.key?.id === parentId) continue;
        const assoc = msg.message?.messageContextInfo?.messageAssociation;
        if (!assoc?.parentMessageKey) continue;
        if (assoc.parentMessageKey.id !== parentId) continue;
        if (assoc.parentMessageKey.remoteJid && assoc.parentMessageKey.remoteJid !== chatId) continue;
        if (assoc.associationType !== ALBUM_ASSOCIATION_TYPE) continue;
        if (getSenderId(msg.key) !== parentSender) continue;
        children.push(msg);
    }
    return children;
}
export default { findAlbumChildren, unwrapAssociatedChild };
