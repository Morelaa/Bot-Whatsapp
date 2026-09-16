//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import axios from 'axios';
import sharp from 'sharp';
import { spawn } from 'child_process';
import yts from 'yt-search';
import * as baileys from '@itsliaaa/baileys';
import { AIRich } from '../../Library/MessageBuilder.js';
import { getYoutubeResources, pickAudio } from '../../Library/vidssave.js';
import config from '../../config.js';
const EXT_BY_FORMAT = { M4A: 'm4a', OPUS: 'opus', WEBM: 'weba' };
const MIME_BY_FORMAT = { M4A: 'audio/mp4', OPUS: 'audio/ogg', WEBM: 'audio/webm' };
function remuxAudio(buffer, inExt, outExt) {
    return new Promise((resolve, reject) => {
        const id = crypto.randomBytes(6).toString('hex');
        const inPath = path.join(os.tmpdir(), `play_${id}_in.${inExt}`);
        const outPath = path.join(os.tmpdir(), `play_${id}_out.${outExt}`);
        const cleanup = () => {
            try { fs.unlinkSync(inPath); } catch { }
            try { fs.unlinkSync(outPath); } catch { }
        };
        fs.writeFileSync(inPath, buffer);
        const ff = spawn('ffmpeg', ['-i', inPath, '-vn', '-acodec', 'copy', '-y', outPath]);
        let stderr = '';
        ff.stderr?.on('data', (d) => { stderr += d.toString(); });
        const timer = setTimeout(() => { ff.kill(); cleanup(); reject(new Error('ffmpeg timeout saat remux audio')); }, 60000);
        ff.on('close', (code) => {
            clearTimeout(timer);
            if (code === 0) {
                try { const out = fs.readFileSync(outPath); cleanup(); resolve(out); }
                catch (e) { cleanup(); reject(e); }
            } else { cleanup(); reject(new Error(`ffmpeg remux gagal (exit ${code}): ${stderr.slice(-300)}`)); }
        });
        ff.on('error', (e) => { clearTimeout(timer); cleanup(); reject(e); });
    });
}
const EMBED_BITRATE = '16k';
function transcodeForEmbed(buffer, inExt) {
    return new Promise((resolve, reject) => {
        const id = crypto.randomBytes(6).toString('hex');
        const inPath = path.join(os.tmpdir(), `playembed_${id}_in.${inExt}`);
        const outPath = path.join(os.tmpdir(), `playembed_${id}_out.ogg`);
        const cleanup = () => {
            try { fs.unlinkSync(inPath); } catch { }
            try { fs.unlinkSync(outPath); } catch { }
        };
        fs.writeFileSync(inPath, buffer);
        const ff = spawn('ffmpeg', ['-i', inPath, '-vn', '-c:a', 'libopus', '-b:a', EMBED_BITRATE, '-ac', '1', '-ar', '16000', '-application', 'audio', '-y', outPath]);
        let stderr = '';
        ff.stderr?.on('data', (d) => { stderr += d.toString(); });
        const timer = setTimeout(() => { ff.kill(); cleanup(); reject(new Error('ffmpeg timeout saat transcode embed')); }, 90000);
        ff.on('close', (code) => {
            clearTimeout(timer);
            if (code === 0) {
                try { const out = fs.readFileSync(outPath); cleanup(); resolve(out); }
                catch (e) { cleanup(); reject(e); }
            } else { cleanup(); reject(new Error(`ffmpeg transcode embed gagal (exit ${code}): ${stderr.slice(-300)}`)); }
        });
        ff.on('error', (e) => { clearTimeout(timer); cleanup(); reject(e); });
    });
}
function cleanTitleForLyrics(title) {
    const KW = 'official|video|audio|lyrics?|lirik|mv|hd|4k|visualizer|live|session|sessions|acoustic|cover|perform(?:ance|ed)?|studio|version|ver\\.?|remaster(?:ed)?|explicit';
    return String(title || '')
        .replace(new RegExp(`\\((?:[^)]*?(${KW})[^)]*?)\\)`, 'gi'), '')
        .replace(new RegExp(`\\[(?:[^\\]]*?(${KW})[^\\]]*?)\\]`, 'gi'), '')
        .replace(/[-|]\s*(official|lyrics?|video|audio)\s*.*/gi, '')
        .trim();
}
function cleanArtistForLyrics(name) {
    return String(name || '')
        .replace(/\s*-\s*topic$/i, '')
        .replace(/\bvevo\b/gi, '')
        .replace(/\bofficial\b/gi, '')
        .replace(/\bmusic\b/gi, '')
        .replace(/\bchannel\b/gi, '')
        .replace(/\bentertainment\b/gi, '')
        .replace(/\brecords?\b/gi, '')
        .replace(/\btv\b/gi, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
}
function parseLRC(lrcText) {
    const out = [];
    const lineRe = /\[(\d+):(\d+(?:\.\d+)?)\]/g;
    for (const line of String(lrcText || '').split('\n')) {
        const text = line.replace(lineRe, '').trim();
        lineRe.lastIndex = 0;
        let m;
        while ((m = lineRe.exec(line))) {
            const time = parseInt(m[1], 10) * 60 + parseFloat(m[2]);
            if (text) out.push({ time, text });
        }
    }
    return out.sort((a, b) => a.time - b.time);
}
async function fetchSyncedLyrics(title, artist, durationSec, rawQuery) {
    const trackName = cleanTitleForLyrics(title);
    const artistName = cleanArtistForLyrics(artist);
    const headers = { 'User-Agent': `${config.botName || 'bot'}/1.0 (+lyrics-fetch)` };
    try {
        const res = await axios.get('https://lrclib.net/api/get', {
            params: { track_name: trackName, artist_name: artistName, duration: durationSec },
            timeout: 10000,
            headers,
        });
        if (res.data?.syncedLyrics) return parseLRC(res.data.syncedLyrics);
    } catch (e) {  }
    const attempts = [
        ...(rawQuery ? [{ q: String(rawQuery).trim() }] : []),
        { track_name: trackName, artist_name: artistName },
        { track_name: trackName },
        { q: `${trackName} ${artistName}`.trim() },
    ];
    for (const params of attempts) {
        try {
            const res = await axios.get('https://lrclib.net/api/search', { params, timeout: 10000, headers });
            const results = Array.isArray(res.data) ? res.data : [];
            const withSynced = results.filter((r) => r.syncedLyrics);
            if (withSynced.length) {
                withSynced.sort((a, b) => Math.abs((a.duration || 0) - durationSec) - Math.abs((b.duration || 0) - durationSec));
                return parseLRC(withSynced[0].syncedLyrics);
            }
        } catch (e) {  }
    }
    return [];
}
function fmtTime(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}
async function thumbToDataUri(url) {
    try {
        const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
        const RENDER = 200;
        const TARGET = 150;
        const offset = Math.round((RENDER - TARGET) / 2);
        const buf = await sharp(Buffer.from(res.data))
            .resize(RENDER, RENDER, { fit: 'cover', position: 'center' })
            .extract({ left: offset, top: offset, width: TARGET, height: TARGET })
            .jpeg({ quality: 75 })
            .toBuffer();
        return `data:image/jpeg;base64,${buf.toString('base64')}`;
    } catch (e) {
        console.error('[PLAY THUMB ERROR]', e);
        return '';
    }
}
function esc(str) {
    return String(str || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function buildPlayerCard({ title, channel, thumbnail, durationSec, sizeMB, audioDataUri, lyrics }) {
    const safeTitle = esc(title.length > 42 ? title.slice(0, 40) + '..' : title);
    const safeChannel = esc(channel);
    const botName = esc(config.botName?.toUpperCase() || 'BOT');
    const hasLyrics = Array.isArray(lyrics) && lyrics.length > 0;
    const lyricsJson = JSON.stringify(hasLyrics ? lyrics : []);
    const nonce = crypto.randomBytes(8).toString('hex');
    return `<!-- nonce:${nonce} -->
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none}
html,body{margin:0;padding:0;width:100%;overflow:hidden;background:transparent;font-family:Arial,Helvetica,sans-serif;color:#f5f5f7}
.musicWrap{width:100%;padding:7px;border:1px solid rgba(255,255,255,.16);border-radius:22px;background:#050505;box-shadow:0 10px 28px rgba(0,0,0,.65),inset 0 1px 0 rgba(255,255,255,.07);max-width:400px;margin:auto}
.musicFrame{position:relative;overflow:hidden;padding:16px;border:1px solid rgba(255,255,255,.16);border-radius:18px;background:linear-gradient(145deg,#111113 0%,#080809 45%,#050505 100%);box-shadow:0 0 25px rgba(255,255,255,.025),inset 0 1px 0 rgba(255,255,255,.07)}
.musicGlow{position:absolute;width:170px;height:170px;right:-75px;top:-85px;border-radius:50%;background:rgba(255,255,255,.045);filter:blur(50px);pointer-events:none}
.musicHeader{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.musicBrand{display:flex;align-items:center;gap:9px;color:#fff;font:bold 15px Arial,sans-serif;letter-spacing:1px;text-shadow:0 2px 5px rgba(0,0,0,.7)}
.musicBrandIcon{height:30px;padding:0 12px;display:flex;align-items:center;justify-content:center;border-radius:999px;background:#fff;color:#000;font:bold 12px Arial,sans-serif;letter-spacing:.5px;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.9)}
.musicLive{padding:5px 9px;border:1px solid rgba(255,255,255,.22);border-radius:9px;background:#0d0d0f;color:#ddd;font:bold 8px monospace;letter-spacing:1.2px}
.musicMain{position:relative;z-index:2;display:flex;align-items:center;gap:15px;padding:14px;border:1px solid rgba(255,255,255,.09);border-radius:16px;background:linear-gradient(145deg,#151517,#0d0d0f);box-shadow:0 5px 14px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.045)}
.musicCover{position:relative;flex:none;width:78px;height:78px;display:flex;align-items:center;justify-content:center;border-radius:18px;background:#070708;border:2px solid #eee;box-shadow:0 0 17px rgba(255,255,255,.10),inset 0 0 20px rgba(255,255,255,.035);overflow:hidden}
.cv{position:relative;width:61px;height:61px;border-radius:50%;background:repeating-radial-gradient(circle at center,#080808 0px,#101010 2px,#070707 4px,#141414 6px);border:1px solid #444;box-shadow:0 0 13px rgba(255,255,255,.10),inset 0 0 8px rgba(255,255,255,.08)}
.cvi{position:absolute;inset:0;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:18px}
.cvi img{width:100%;height:100%;object-fit:cover;display:block}
.cv::after{content:'';position:absolute;left:50%;top:50%;width:19px;height:19px;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,#fff 0 12%,#777 13% 28%,#202020 29% 65%,#aaa 66% 72%,#111 73% 100%);border:1px solid #ddd;box-shadow:0 0 8px rgba(255,255,255,.25);pointer-events:none}
.cv.spin{animation:musicVinylRotate 2.4s linear infinite}
@keyframes musicVinylRotate{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
.t{color:#fff;font:bold 16px Arial,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.s{margin-top:5px;color:#777;font:10px monospace;letter-spacing:.3px}
.ly{position:relative;z-index:2;text-align:center;padding:12px 10px;margin-top:14px;background:#0d0d0f;border:1px solid rgba(255,255,255,.09);border-radius:14px;min-height:20px;font:bold 12.5px Arial,sans-serif;line-height:1.5;color:#ddd}
.sy{position:relative;z-index:2;display:flex;justify-content:center;align-items:center;gap:10px;margin-top:10px}
.sy button{background:#111113;border:1px solid rgba(255,255,255,.18);color:#ddd;border-radius:9px;padding:5px 11px;font:bold 9px monospace;letter-spacing:.5px;cursor:pointer}
.sy button:active{transform:scale(.94);background:#050505}
.sy span{font:bold 9px monospace;color:#777;letter-spacing:.4px;min-width:64px;text-align:center}
.kw{color:#555;transition:color .05s linear}
.kw.done{color:#fff;text-shadow:0 0 8px rgba(255,255,255,.35)}
.kw.cur{color:#fff;text-shadow:0 0 14px rgba(255,255,255,.85)}
.musicProgressArea{position:relative;z-index:2;margin-top:16px}
.pr{position:relative;width:100%;height:7px;border-radius:8px;background:#222225;border:1px solid rgba(255,255,255,.09);cursor:pointer}
.pb{position:absolute;left:0;top:0;width:0%;height:7px;border-radius:8px;background:#eee;box-shadow:0 0 8px rgba(255,255,255,.25)}
.pd{position:absolute;left:0%;top:50%;width:14px;height:14px;transform:translate(-50%,-50%);border-radius:50%;background:#fff;border:2px solid #888;box-shadow:0 0 8px rgba(255,255,255,.25)}
.tm{display:flex;align-items:center;justify-content:space-between;margin-top:8px;color:#777;font:9px monospace}
.musicControls{position:relative;z-index:2;display:flex;align-items:center;gap:13px;margin-top:15px}
.pb2{flex:1;height:50px;display:flex;align-items:center;justify-content:center;border:1px solid #fff;border-radius:16px;background:#fff;color:#000;font:bold 11px Arial,sans-serif;letter-spacing:1.5px;cursor:pointer;box-shadow:0 5px 12px rgba(0,0,0,.45),0 0 12px rgba(255,255,255,.08)}
.pb2:active{transform:scale(.94);background:#d8d8d8}
.km{width:86px;height:50px;border:1px solid rgba(255,255,255,.16);border-radius:16px;background:#111113;color:#aaa;font:bold 9px monospace;letter-spacing:.8px;cursor:pointer}
.km:active{transform:scale(.94)}
.km.on{background:#fff;color:#000;border-color:#fff}
.st{position:relative;z-index:2;margin-top:13px;text-align:center;color:#ddd;font:bold 9px monospace;letter-spacing:1.8px}
.musicLine{position:relative;z-index:2;height:1px;margin-top:12px;background:linear-gradient(90deg,transparent,#555,transparent);opacity:.6}
.musicFooter{position:relative;z-index:2;display:flex;align-items:center;justify-content:center;margin-top:10px;color:#505055;font:8px monospace;letter-spacing:.5px}
</style>
<body>
<div class="musicWrap">
<div class="musicFrame">
<div class="musicGlow"></div>
<div class="musicHeader">
<div class="musicBrand"><div class="musicBrandIcon">${botName} MUSIC</div></div>
<div class="musicLive">${audioDataUri ? 'MP3' : 'FILE'}</div>
</div>
<div class="musicMain">
<div class="musicCover"><div class="cv" id="cv"><div class="cvi">${thumbnail ? `<img src="${thumbnail}">` : '🎵'}</div></div></div>
<div style="min-width:0;flex:1">
<div class="t">${safeTitle}</div>
<div class="s">${safeChannel} • ${audioDataUri ? 'FULL' : esc(sizeMB + ' MB')}</div>
</div>
</div>
${hasLyrics ? `<div class="ly" id="ly"></div><div class="sy" id="sy"><button id="sm">−0.5s</button><span id="sv">Sync 0.0s</span><button id="sp">+0.5s</button></div>` : ''}
<div class="musicProgressArea">
<div class="pr" id="pr"><div class="pb" id="pb"></div><div class="pd" id="pd"></div></div>
<div class="tm"><span id="ct">0:00</span><span id="dt">${fmtTime(durationSec)}</span></div>
</div>
<div class="musicControls">
<button class="pb2" id="pb2">${audioDataUri ? 'PLAY' : 'CEK AUDIO DI BAWAH'}</button>
${hasLyrics ? `<button class="km on" id="km">KARAOKE</button>` : ''}
</div>
<div class="st" id="st">${audioDataUri ? 'READY TO PLAY' : 'FILE ASLI DI BAWAH 👇'}</div>
<div class="musicLine"></div>
</div>
</div>
${audioDataUri ? `<audio id="a" preload="auto" src="${audioDataUri}"></audio>` : ''}
<script>
const _nonce='${nonce}'; // pastikan setiap eksekusi script dianggap fresh, bukan reuse
const lyrics=${lyricsJson};
const a=document.getElementById('a'),pb2=document.getElementById('pb2'),pb=document.getElementById('pb'),pd=document.getElementById('pd'),pr=document.getElementById('pr'),ct=document.getElementById('ct'),dt=document.getElementById('dt'),cv=document.getElementById('cv'),st=document.getElementById('st'),ly=document.getElementById('ly'),km=document.getElementById('km'),sm=document.getElementById('sm'),sp=document.getElementById('sp'),sv=document.getElementById('sv');
function fmt(s){if(!Number.isFinite(s))return'0:00';const m=Math.floor(s/60),sec=Math.floor(s%60);return m+':'+String(sec).padStart(2,'0')}
const hasLyrics=lyrics.length>0;
let karaokeMode=true; // default: kartu baru selalu mulai dalam mode karaoke (warna per-kata)
let curLine=-1;
// Offset manual buat kompensasi lirik yang telat/kecepetan dibanding audio
// (sering kejadian kalau audio yang diputar itu versi live/cover/acoustic,
// sedangkan timestamp lirik dari LRCLIB ngikutin versi studio).
// +0.5s = majuin lirik (kalau lirik kerasa telat), -0.5s = mundurin (kalau kecepetan).
let offset=0;
function syncedTime(){return a?a.currentTime+offset:offset}
if(sm&&sp&&sv){
function refreshSyncUI(){
sv.textContent='Sync '+(offset>=0?'+':'')+offset.toFixed(1)+'s';
curLine=-1;
if(hasLyrics&&a){const idx=findLine(syncedTime());if(idx>=0){curLine=idx;renderLine(idx,syncedTime());}}
}
sm.onclick=function(){offset-=0.5;refreshSyncUI();};
sp.onclick=function(){offset+=0.5;refreshSyncUI();};
}
function findLine(t){let idx=-1;for(let i=0;i<lyrics.length;i++){if(t>=lyrics[i].time)idx=i;else break}return idx}
function renderLine(idx,t){
const cur=lyrics[idx];
const nxt=lyrics[idx+1];
const lineDur=nxt?nxt.time-cur.time:(Number.isFinite(a.duration)?a.duration-cur.time:5);
if(karaokeMode){
const words=cur.text.split(' ');
const wordDur=lineDur/words.length;
const elapsed=t-cur.time;
const doneCount=Math.min(words.length-1,Math.floor(elapsed/wordDur));
ly.innerHTML=words.map((w,i)=>{let cls='';if(i<doneCount)cls='done';else if(i===doneCount)cls='cur';return '<span class="kw '+cls+'">'+w+'</span>'}).join(' ');
}else{
ly.textContent=cur.text;ly.style.color='#fff';
}
}
if(km){
km.onclick=function(){
karaokeMode=!karaokeMode;
if(karaokeMode){km.textContent='KARAOKE';km.classList.add('on');curLine=-1;if(a&&!a.paused)renderLine(findLine(syncedTime()),syncedTime());}
else{km.textContent='BIASA';km.classList.remove('on');if(a&&!a.paused){const idx=findLine(syncedTime());if(idx>=0)ly.textContent=lyrics[idx].text;}}
};
}
if(a){
a.volume=1;
let rafId=null;
function tick(){
if(!a.paused&&!a.ended){
const realT=a.currentTime;
const t=realT+offset;
if(hasLyrics){
const idx=findLine(t);
if(idx>=0){
if(idx!==curLine){curLine=idx;renderLine(idx,t);}
else if(karaokeMode){
const cur=lyrics[idx];const nxt=lyrics[idx+1];
const lineDur=nxt?nxt.time-cur.time:(Number.isFinite(a.duration)?a.duration-cur.time:5);
const words=cur.text.split(' ');const wordDur=lineDur/words.length;
const elapsed=t-cur.time;const doneCount=Math.min(words.length-1,Math.floor(elapsed/wordDur));
const spans=ly.querySelectorAll('.kw');
spans.forEach((sp,i)=>{sp.className='kw';if(i<doneCount)sp.classList.add('done');else if(i===doneCount)sp.classList.add('cur')});
}
}
}
const p=(realT/a.duration)*100;
pb.style.width=p+'%';pd.style.left=p+'%';ct.textContent=fmt(realT);
}
rafId=requestAnimationFrame(tick);
}
pb2.onclick=function(){
if(a.paused){
a.play().then(()=>{
pb2.textContent='PAUSE';st.textContent='PLAYING';cv.classList.add('spin');
// Paksa mode karaoke aktif + render ulang baris yang sedang berjalan
// SAAT ITU JUGA (bukan nunggu loop tick() jalan/nunggu baris berikutnya).
// Ini jaga-jaga kalau ada state JS lama yang nyangkut dari render
// sebelumnya, biar warna kata pasti muncul begitu PLAY ditekan.
if(hasLyrics){
karaokeMode=true;
if(km){km.textContent='KARAOKE';km.classList.add('on');}
curLine=-1;
const idx0=findLine(syncedTime());
if(idx0>=0){curLine=idx0;renderLine(idx0,syncedTime());}
}
cancelAnimationFrame(rafId);tick();
})
.catch(()=>{st.textContent='GAGAL PUTAR';});
}else{
a.pause();pb2.textContent='PLAY';st.textContent='PAUSED';cv.classList.remove('spin');
}
};
pr.onclick=function(e){
if(!Number.isFinite(a.duration)||a.duration<=0)return;
const r=pr.getBoundingClientRect();
const x=Math.max(0,Math.min(e.clientX-r.left,r.width));
a.currentTime=(x/r.width)*a.duration;
curLine=-1;
if(hasLyrics){const idx=findLine(syncedTime());if(idx>=0){curLine=idx;renderLine(idx,syncedTime());}}
const p=(a.currentTime/a.duration)*100;
pb.style.width=p+'%';pd.style.left=p+'%';ct.textContent=fmt(a.currentTime);
};
a.onloadedmetadata=function(){dt.textContent=fmt(a.duration)};
a.onended=function(){
pb2.textContent='PLAY';st.textContent='DONE';cv.classList.remove('spin');
pb.style.width='0%';pd.style.left='0%';ct.textContent='0:00';
if(ly)ly.textContent='';curLine=-1;
cancelAnimationFrame(rafId);
};
}
</script></body>`;
}
const handler = async (m, { conn, text }) => {
    if (!text) {
        await m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ᴄᴏɴᴛᴏʜ: .play souqy demam rindu\n╰┈┈┈┈┈┈┈┈⬡`);
        return;
    }
    let audioOut;
    try {
        await conn.sendMessage(m.chat, { react: { text: '🔎', key: m.key } });
        const res = await yts(text);
        const video = res.all.find((v) => v.type === 'video');
        if (!video) { await m.reply('Tidak ditemukan hasil untuk: ' + text); return; }
        await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
        const { title, thumbnail, resources } = await getYoutubeResources(video.url);
        const chosen = pickAudio(resources);
        if (!chosen) throw new Error('Tidak ada resource audio yang tersedia dari sumber.');
        const formatKey = String(chosen.format || '').toUpperCase();
        if (formatKey === 'WEBM') throw new Error('Format WEBM/Opus dari sumber ini sering gagal diputar di WhatsApp. Coba judul lain.');
        const ext = EXT_BY_FORMAT[formatKey];
        const mimetype = MIME_BY_FORMAT[formatKey];
        if (!ext || !mimetype) throw new Error(`Format audio tidak dikenali: "${chosen.format}"`);
        const tempDir = path.join(process.cwd(), 'media', 'temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
        audioOut = path.join(tempDir, `${Date.now()}.${ext}`);
        const audioRes = await axios.get(chosen.download_url, {
            responseType: 'arraybuffer',
            timeout: 120000,
            headers: {
                Referer: 'https://id.vidssave.com/',
                Origin: 'https://id.vidssave.com',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });
        const contentType = String(audioRes.headers?.['content-type'] || '');
        const dataBuf = Buffer.from(audioRes.data);
        if (contentType.includes('text/html') || contentType.includes('application/json') || dataBuf.length < 10000) {
            throw new Error(`Link download sepertinya bukan file audio (content-type: ${contentType || 'unknown'}, size: ${dataBuf.length} bytes). Coba judul lain.`);
        }
        const fixedBuf = await remuxAudio(dataBuf, ext, ext);
        fs.writeFileSync(audioOut, fixedBuf);
        const sizeMB = (fs.statSync(audioOut).size / 1024 / 1024).toFixed(2);
        const parts = String(video.timestamp || '0:00').split(':').map(Number).reverse();
        const durationSec = (parts[0] || 0) + (parts[1] || 0) * 60 + (parts[2] || 0) * 3600;
        const channelName = video.author?.name || 'Unknown';
        const thumbSource = video.thumbnail || thumbnail;
        const thumbDataUri = await thumbToDataUri(thumbSource);
        const MAX_EMBED_BYTES = 1.5 * 1024 * 1024; 
        let audioDataUri = '';
        try {
            const embedBuf = await transcodeForEmbed(dataBuf, ext);
            if (embedBuf.length < MAX_EMBED_BYTES) {
                audioDataUri = `data:audio/ogg;base64,${embedBuf.toString('base64')}`;
            } else {
                console.error('[PLAY EMBED SKIPPED] terlalu besar:', embedBuf.length);
            }
        } catch (e) {
            console.error('[PLAY EMBED ERROR]', e);
        }
        const lyrics = await fetchSyncedLyrics(title, channelName, durationSec, text).catch(() => []);
        const htmlPayload = buildPlayerCard({
            title,
            channel: channelName,
            thumbnail: thumbDataUri,
            durationSec,
            sizeMB,
            audioDataUri,
            lyrics,
        });
        const section = AIRich.newLayout('Single', {
            __typename: 'GenAIaeacdsnwHtmlPrimitive',
            payload: htmlPayload,
        });
        const submessage = [{ messageType: 2, messageText: `🎵 ${title} - Now Playing` }];
        const rich = new AIRich(conn);
        rich._addContent(section, submessage);
        await rich.send(m.chat, { quoted: m });
        const audioBuf = fs.readFileSync(audioOut);
        const media = await baileys.prepareWAMessageMedia({ audio: audioBuf, mimetype, ptt: false }, { upload: conn.waUploadToServer });
        await conn.relayMessage(
            m.chat,
            { audioMessage: { ...media.audioMessage, fileName: `${title}.${ext}` } },
            { messageId: conn.generateMessageTag() }
        );
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
    } catch (err) {
        console.error('[PLAY ERROR]', err);
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => { });
        await m.reply('Gagal memutar lagu: ' + err.message);
    } finally {
        try { if (audioOut && fs.existsSync(audioOut)) fs.unlinkSync(audioOut); } catch { }
    }
};
handler.help = ['play <judul lagu>'];
handler.tags = ['downloader'];
handler.command = /^(play|putar)$/i;
handler.limit = true;
export default handler;