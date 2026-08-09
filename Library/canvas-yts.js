'use strict';
import { createCanvas, loadImage } from 'canvas';
function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}
function formatViews(n) {
    if (n >= 1_000_000_000)
        return (n / 1_000_000_000).toFixed(1) + 'B';
    if (n >= 1_000_000)
        return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)
        return (n / 1_000).toFixed(1) + 'K';
    return String(n);
}
export async function renderYtsCard(data) {
    const { title, channel, thumbnailUrl, thumbnailBuffer, duration, views = 0, uploadedAgo = '' } = data;
    const width = 900;
    const thumbHeight = 500;
    const infoHeight = 150;
    const height = thumbHeight + infoHeight;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0f0f0f';
    roundRect(ctx, 0, 0, width, height, 20);
    ctx.fill();
    try {
        const source = thumbnailBuffer || thumbnailUrl;
        if (source) {
            const img = await loadImage(source);
            ctx.save();
            roundRect(ctx, 0, 0, width, thumbHeight, 20);
            ctx.clip();
            const scale = Math.max(width / img.width, thumbHeight / img.height);
            const dw = img.width * scale;
            const dh = img.height * scale;
            ctx.drawImage(img, (width - dw) / 2, (thumbHeight - dh) / 2, dw, dh);
            ctx.restore();
        }
    }
    catch {
        ctx.fillStyle = '#282828';
        ctx.fillRect(0, 0, width, thumbHeight);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    roundRect(ctx, width - 110, thumbHeight - 40, 90, 28, 6);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(duration, width - 65, thumbHeight - 20);
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,0,0,0.85)';
    ctx.arc(width / 2, thumbHeight / 2, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = '#fff';
    ctx.moveTo(width / 2 - 14, thumbHeight / 2 - 22);
    ctx.lineTo(width / 2 - 14, thumbHeight / 2 + 22);
    ctx.lineTo(width / 2 + 22, thumbHeight / 2);
    ctx.closePath();
    ctx.fill();
    let y = thumbHeight + 45;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(title.length > 48 ? title.slice(0, 47) + '…' : title, 30, y);
    y += 40;
    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText(channel, 30, y);
    y += 35;
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#888888';
    const metaParts = [` ${formatViews(views)} views`, uploadedAgo].filter(Boolean);
    ctx.fillText(metaParts.join('  •  '), 30, y);
    return canvas.toBuffer('image/png');
}
export default { renderYtsCard };
