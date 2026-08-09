'use strict';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { spawn } from 'child_process';
import webpmux from 'node-webpmux';
export async function imageToWebp(buffer) {
    return sharp(buffer)
        .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp({ quality: 90 })
        .toBuffer();
}
const TMP_DIR = path.join(os.tmpdir(), 'morela_sticker_tmp');
if (!fs.existsSync(TMP_DIR))
    fs.mkdirSync(TMP_DIR, { recursive: true });
export function videoToWebp(buffer, { fps = 10, duration = 6 } = {}) {
    return new Promise((resolve, reject) => {
        const id = crypto.randomBytes(6).toString('hex');
        const inputPath = path.join(TMP_DIR, `vid_${id}.mp4`);
        const outputPath = path.join(TMP_DIR, `vid_${id}.webp`);
        const cleanup = () => {
            try { fs.unlinkSync(inputPath); } catch { }
            try { fs.unlinkSync(outputPath); } catch { }
        };
        fs.writeFileSync(inputPath, buffer);
        const args = [
            '-i', inputPath,
            '-t', String(duration),
            '-vcodec', 'libwebp',
            '-vf', `fps=${fps},scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:-1:-1:color=0x00000000`,
            '-loop', '0',
            '-preset', 'default',
            '-an',
            '-vsync', '0',
            '-y', outputPath,
        ];
        const ff = spawn('ffmpeg', args);
        let stderr = '';
        ff.stderr?.on('data', (d) => { stderr += d.toString(); });
        const timer = setTimeout(() => {
            ff.kill();
            cleanup();
            reject(new Error('ffmpeg timeout'));
        }, 30000);
        ff.on('close', (code) => {
            clearTimeout(timer);
            if (code === 0) {
                try {
                    const out = fs.readFileSync(outputPath);
                    cleanup();
                    resolve(out);
                }
                catch (e) {
                    cleanup();
                    reject(e);
                }
            }
            else {
                cleanup();
                reject(new Error(`ffmpeg exit ${code}: ${stderr.slice(-300)}`));
            }
        });
        ff.on('error', (e) => { clearTimeout(timer); cleanup(); reject(e); });
    });
}
function slugify(str) {
    return String(str || 'bot')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '')
        || 'bot';
}
export async function addStickerMetadata(webpBuffer, { packName = 'Sticker', authorName = 'Bot' } = {}) {
    const img = new webpmux.Image();
    await img.load(webpBuffer);
    const json = {
        'sticker-pack-id': `com.${slugify(packName)}.${Date.now()}`,
        'sticker-pack-name': packName,
        'sticker-pack-publisher': authorName,
        emojis: [''],
    };
    const exifAttr = Buffer.from([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
    const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf-8');
    const exif = Buffer.concat([exifAttr, jsonBuffer]);
    exif.writeUIntLE(jsonBuffer.length, 14, 4);
    img.exif = exif;
    return img.save(null);
}
export async function makeSticker(buffer, { isVideo = false, packName, authorName } = {}) {
    const raw = isVideo ? await videoToWebp(buffer) : await imageToWebp(buffer);
    return addStickerMetadata(raw, { packName, authorName });
}
export default { imageToWebp, videoToWebp, addStickerMetadata, makeSticker };
