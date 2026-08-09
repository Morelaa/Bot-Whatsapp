'use strict';
import { fileTypeFromBuffer } from 'file-type';
const MEDIA_TYPES = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'];
export function findMediaMessage(m) {
    if (MEDIA_TYPES.includes(m.type)) {
        return { message: m.message[m.type], type: m.type, source: 'direct' };
    }
    if (m.quoted && MEDIA_TYPES.includes(m.quoted.type)) {
        return { message: m.quoted.message[m.quoted.type], type: m.quoted.type, source: 'quoted' };
    }
    return null;
}
export function hasMedia(m) {
    return !!findMediaMessage(m);
}
export async function downloadMessageMedia(m, sock) {
    const found = findMediaMessage(m);
    if (!found)
        return null;
    const target = found.source === 'direct'
        ? m.raw
        : { key: m.quoted.key, message: m.quoted.message };
    return sock.downloadMedia(target);
}
export async function detectMimetype(buffer) {
    if (!buffer?.length)
        return null;
    const type = await fileTypeFromBuffer(buffer);
    return type?.mime || null;
}
export function isImageMessage(m) {
    return findMediaMessage(m)?.type === 'imageMessage';
}
export function isVideoMessage(m) {
    return findMediaMessage(m)?.type === 'videoMessage';
}
export default { findMediaMessage, hasMedia, downloadMessageMedia, detectMimetype, isImageMessage, isVideoMessage };
