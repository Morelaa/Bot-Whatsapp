'use strict';
import { createCanvas, loadImage, registerFont } from 'canvas';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
try {
    registerFont(path.join(__dirname, '..', 'media', 'fonts', 'impact.ttf'), { family: 'Impact' });
}
catch {
}
function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let current = '';
    for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && current) {
            lines.push(current);
            current = word;
        }
        else {
            current = test;
        }
    }
    if (current)
        lines.push(current);
    return lines;
}
function drawCaption(ctx, text, canvasWidth, y, fontSize, align = 'top') {
    if (!text)
        return;
    ctx.font = `bold ${fontSize}px Impact, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = fontSize / 12;
    ctx.textBaseline = align === 'top' ? 'top' : 'bottom';
    const maxWidth = canvasWidth * 0.9;
    const lines = wrapText(ctx, text.toUpperCase(), maxWidth);
    const lineHeight = fontSize * 1.1;
    lines.forEach((line, i) => {
        const lineY = align === 'top' ? y + i * lineHeight : y - (lines.length - 1 - i) * lineHeight;
        ctx.strokeText(line, canvasWidth / 2, lineY);
        ctx.fillText(line, canvasWidth / 2, lineY);
    });
}
export async function createMeme(imageBuffer, { topText = '', bottomText = '', fontSize } = {}) {
    const img = await loadImage(imageBuffer);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const size = fontSize || Math.round(img.width / 10);
    drawCaption(ctx, topText, img.width, size * 0.3, size, 'top');
    drawCaption(ctx, bottomText, img.width, img.height - size * 0.3, size, 'bottom');
    return canvas.toBuffer('image/png');
}
export default { createMeme };
