import crypto from 'crypto';
import https from 'https';
import JSZip from 'jszip';
import sharp from 'sharp';
function sha256(buffer) {
    return crypto.createHash('sha256').update(buffer).digest();
}
function toB64Url(buffer) {
    return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
function isAnimatedWebP(buffer) {
    if (buffer.length < 12)
        return false;
    if (buffer.toString('ascii', 0, 4) !== 'RIFF')
        return false;
    if (buffer.toString('ascii', 8, 12) !== 'WEBP')
        return false;
    let offset = 12;
    while (offset < buffer.length - 8) {
        const chunk = buffer.toString('ascii', offset, offset + 4);
        const size = buffer.readUInt32LE(offset + 4);
        if (chunk === 'VP8X' && (buffer[offset + 8] & 0x02))
            return true;
        if (chunk === 'ANIM' || chunk === 'ANMF')
            return true;
        offset += 8 + size + (size % 2);
    }
    return false;
}
async function makeTrayWebp(buffer) {
    return await sharp(buffer, { animated: false })
        .resize(252, 252, { fit: 'cover' })
        .webp()
        .toBuffer();
}
async function makeThumbnailJpeg(buffer) {
    return await sharp(buffer)
        .resize(252, 252, { fit: 'cover' })
        .jpeg()
        .toBuffer();
}
async function uploadToServer(conn, buffer, { hkdf, mediaPath, mediaKey = crypto.randomBytes(32) }) {
    const expanded = Buffer.from(crypto.hkdfSync('sha256', mediaKey, Buffer.alloc(32), Buffer.from(hkdf), 112));
    const iv = expanded.subarray(0, 16);
    const cipherKey = expanded.subarray(16, 48);
    const macKey = expanded.subarray(48, 80);
    const cipher = crypto.createCipheriv('aes-256-cbc', cipherKey, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const mac = crypto.createHmac('sha256', macKey).update(iv).update(encrypted).digest().subarray(0, 10);
    const encBuffer = Buffer.concat([encrypted, mac]);
    const fileSha256 = sha256(buffer);
    const fileEncSha256 = sha256(encBuffer);
    const iq = await conn.query({
        tag: 'iq',
        attrs: { id: conn.generateMessageTag?.() ?? Date.now().toString(), to: 's.whatsapp.net', type: 'set', xmlns: 'w:m' },
        content: [{ tag: 'media_conn', attrs: {} }]
    });
    const mediaConn = iq.content?.find((v) => v.tag === 'media_conn');
    if (!mediaConn)
        throw new Error('media_conn tidak ditemukan');
    const auth = mediaConn.attrs?.auth;
    if (!auth)
        throw new Error('auth media_conn tidak ditemukan');
    const hosts = (mediaConn.content || []).filter((v) => v.tag === 'host').map((v) => v.attrs?.hostname).filter(Boolean);
    if (!hosts.length)
        throw new Error('host upload tidak ditemukan');
    const token = encodeURIComponent(fileEncSha256.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, ''));
    let lastError;
    for (const host of hosts) {
        try {
            const json = await new Promise((resolve, reject) => {
                const url = new URL(`https://${host}${mediaPath}/${token}?auth=${encodeURIComponent(auth)}&token=${token}`);
                const req = https.request({
                    hostname: url.hostname, port: 443,
                    path: url.pathname + url.search, method: 'POST',
                    headers: { Origin: 'https://web.whatsapp.com', Referer: 'https://web.whatsapp.com/', 'Content-Type': 'application/octet-stream', 'Content-Length': encBuffer.length }
                }, (res) => {
                    let body = '';
                    res.on('data', (c) => body += c);
                    res.on('end', () => {
                        if ((res.statusCode ?? 0) < 200 || (res.statusCode ?? 0) >= 300)
                            return reject(new Error(`Upload gagal ${res.statusCode}: ${body}`));
                        try {
                            resolve(JSON.parse(body));
                        }
                        catch {
                            reject(new Error(`Response bukan JSON: ${body}`));
                        }
                    });
                });
                req.on('error', reject);
                req.write(encBuffer);
                req.end();
            });
            const directPath = json.direct_path ?? json.directPath ?? json.url ?? json.path;
            if (!directPath)
                throw new Error('directPath tidak ditemukan');
            return { mediaKey, fileLength: buffer.length, fileSha256, fileEncSha256, directPath, ...json };
        }
        catch (e) {
            lastError = e;
        }
    }
    throw lastError ?? new Error('Semua host upload gagal');
}
export async function sendStickerPack(conn, jid, stickers, opts = {}) {
    const zip = new JSZip();
    const stickersMetadata = [];
    for (const item of stickers) {
        const ext = item.ext || 'webp';
        const mimetype = item.mimetype || 'image/webp';
        const fileName = `${toB64Url(sha256(item.buffer))}.${ext}`;
        zip.file(fileName, item.buffer);
        stickersMetadata.push({
            fileName,
            isAnimated: item.isAnimated ?? isAnimatedWebP(item.buffer),
            emojis: item.emojis ?? [''],
            accessibilityLabel: '',
            isLottie: item.isLottie ?? false,
            mimetype
        });
    }
    const trayIconFileName = 'tray_icon.webp';
    const traySource = stickers.find(v => !v.isLottie)?.buffer;
    const trayBuffer = traySource ? await makeTrayWebp(traySource) : Buffer.alloc(0);
    zip.file(trayIconFileName, trayBuffer);
    const archive = await zip.generateAsync({ type: 'nodebuffer', compression: 'STORE' });
    const packUpload = await uploadToServer(conn, archive, { hkdf: 'WhatsApp Sticker Pack Keys', mediaPath: '/mms/sticker-pack' });
    const thumbnailBuffer = await makeThumbnailJpeg(trayBuffer);
    const thumbUpload = await uploadToServer(conn, thumbnailBuffer, { hkdf: 'WhatsApp Sticker Pack Thumbnail Keys', mediaPath: '/mms/thumbnail-sticker-pack', mediaKey: packUpload.mediaKey });
    await conn.relayMessage(jid, {
        messageContextInfo: { messageSecret: crypto.randomBytes(32) },
        stickerPackMessage: {
            stickerPackId: 'Pack_' + crypto.randomBytes(8).toString('hex'),
            name: opts.name || 'Sticker Pack',
            publisher: opts.publisher || 'Bot',
            packDescription: opts.description || 'Sticker pack',
            stickers: stickersMetadata,
            fileLength: packUpload.fileLength,
            fileSha256: packUpload.fileSha256,
            fileEncSha256: packUpload.fileEncSha256,
            mediaKey: packUpload.mediaKey,
            directPath: packUpload.directPath,
            mediaKeyTimestamp: Math.floor(Date.now() / 1000),
            stickerPackSize: packUpload.fileLength,
            stickerPackOrigin: 2,
            trayIconFileName,
            thumbnailDirectPath: thumbUpload.directPath,
            thumbnailSha256: thumbUpload.fileSha256,
            thumbnailEncSha256: thumbUpload.fileEncSha256,
            thumbnailHeight: 252,
            thumbnailWidth: 252,
            imageDataHash: thumbUpload.fileSha256.toString('base64')
        }
    }, { quoted: opts.quoted });
}
