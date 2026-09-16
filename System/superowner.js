//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import util from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';
import * as cheerio from 'cheerio';
import config from '../config.js';
import sharp from 'sharp';
import { checkMainOwner } from '../Core/permissions.js';
import { logError } from '../Core/logutil.js';
import { Button, ButtonV2, Carousel, AIRich, Toolkit } from '../Library/MessageBuilder.js';
import { downloadMessageMedia } from '../Library/handle.js';
const execPromise = promisify(exec);
const RESTART_CMD_RE = /\b(pm2\s+(restart|stop|reload|kill)|systemctl\s+restart|kill\s+-9\s+\$\$|reboot)\b/i;
const INVISIBLE_CHARS_RE = /[\u200e\u200f\u200b\u200d\u2028\u2029\ufeff\u00a0]/g;
const MAX_OUTPUT = 3500;          
const SHELL_TIMEOUT = 120000;     
const SHELL_MAX_BUFFER = 25 * 1024 * 1024; 
const FETCH_TIMEOUT = 30000;
function cleanCode(raw) {
  return raw.replace(INVISIBLE_CHARS_RE, ' ').trim();
}
function truncate(str) {
  return str.length > MAX_OUTPUT ? str.slice(0, MAX_OUTPUT) + '\n\n…(terpotong, lihat file terlampir jika ada)' : str;
}
async function plainReply(m, conn, text) {
  try {
    await conn.relayMessage(
      m.chat,
      { extendedTextMessage: { text, contextInfo: { quotedMessage: m.raw?.message, stanzaId: m.raw?.key?.id, participant: m.raw?.key?.participant || m.raw?.key?.remoteJid } } },
      { messageId: conn.generateMessageTag ? conn.generateMessageTag() : undefined },
    );
  } catch {
    await m.reply(text);
  }
}
async function replySmart(m, conn, text, { label = 'output', ext = 'txt' } = {}) {
  const str = typeof text === 'string' ? text : util.inspect(text, { depth: 4 });
  if (str.length <= MAX_OUTPUT) {
    await plainReply(m, conn, str);
    return;
  }
  try {
    const fileName = `${label}-${Date.now()}.${ext}`;
    await conn.sendMessage(
      m.chat,
      {
        document: Buffer.from(str, 'utf8'),
        fileName,
        mimetype: 'text/plain',
        caption: `📄 Output terlalu panjang (${str.length} karakter), dikirim sebagai file.`,
      },
      { quoted: m.raw || undefined },
    );
  } catch (e) {
    await plainReply(m, conn, truncate(str));
  }
}
function detectKind(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 4) return 'document';
  const hex = buf.subarray(0, 12).toString('hex');
  if (hex.startsWith('89504e47')) return 'image';        
  if (hex.startsWith('ffd8ff')) return 'image';           
  if (hex.startsWith('47494638')) return 'image';         
  if (hex.includes('66747970')) return 'video';           
  if (hex.startsWith('1a45dfa3')) return 'video';         
  if (hex.startsWith('494433') || hex.startsWith('fffb')) return 'audio'; 
  return 'document';
}
async function sendBuffer(m, conn, buf, hintName = 'file') {
  const kind = detectKind(buf);
  const sizeMB = (buf.length / 1024 / 1024).toFixed(2);
  const opts = { quoted: m.raw || undefined };
  if (kind === 'image') {
    await conn.sendMessage(m.chat, { image: buf, caption: `🖼️ ${sizeMB} MB` }, opts);
  } else if (kind === 'video') {
    await conn.sendMessage(m.chat, { video: buf, caption: `🎬 ${sizeMB} MB` }, opts);
  } else if (kind === 'audio') {
    await conn.sendMessage(m.chat, { audio: buf, mimetype: 'audio/mpeg', ptt: false }, opts);
  } else {
    await conn.sendMessage(
      m.chat,
      { document: buf, fileName: `${hintName}-${Date.now()}.bin`, mimetype: 'application/octet-stream', caption: `📦 ${sizeMB} MB` },
      opts,
    );
  }
}
async function fetchUrl(url, opts = {}) {
  const res = await axios.request({
    url,
    method: opts.method || 'GET',
    headers: opts.headers,
    data: opts.data,
    params: opts.params,
    timeout: opts.timeout || FETCH_TIMEOUT,
    responseType: opts.responseType || 'text',
    maxRedirects: opts.maxRedirects ?? 10,
    validateStatus: () => true,
  });
  return {
    status: res.status,
    ok: res.status >= 200 && res.status < 300,
    headers: res.headers,
    data: res.data,
  };
}
async function downloadBuffer(url, opts = {}) {
  const res = await axios.get(url, {
    responseType: 'arraybuffer',
    headers: opts.headers,
    timeout: opts.timeout || 60000,
    maxContentLength: opts.maxContentLength || 100 * 1024 * 1024,
  });
  return Buffer.from(res.data);
}
async function runEval(code, ctx, mode = 'auto') {
  const { m, sock, conn } = ctx;
  void m; void sock; void conn; void axios; void cheerio; void fs; void path; void sharp;
  void os; void crypto; void config; void fetchUrl; void downloadBuffer; void sendBuffer;
  if (mode === 'statement') {
    return await eval(`(async () => { ${code} })()`);
  }
  if (mode === 'expression') {
    return await eval(`(async () => { return ${code} })()`);
  }
  try {
    return await eval(`(async () => { return ${code} })()`);
  } catch (e1) {
    if (e1 instanceof SyntaxError) {
      return await eval(`(async () => { ${code} })()`);
    }
    throw e1;
  }
}
function formatEvalResult(evaled) {
  if (evaled === undefined) return ' Done (no return value)';
  if (typeof evaled === 'string') return evaled;
  if (Buffer.isBuffer(evaled)) return { __buffer: evaled };
  try {
    if (evaled !== null && typeof evaled === 'object') {
      const json = JSON.stringify(evaled, null, 2);
      if (json !== undefined) return json;
    }
  } catch {}
  return util.inspect(evaled, { depth: 4, colors: false });
}
async function getQuotedCode(m, conn) {
  const quotedType = m?.quoted?.type;
  if (quotedType === 'documentMessage') {
    try {
      const buf = await downloadMessageMedia(m, conn);
      if (buf?.length) return cleanCode(buf.toString('utf8'));
    } catch { }
  }
  return cleanCode(m?.quoted?.text || '');
}
export async function handleSuperOwnerShortcut(m, participants, sock) {
  const body = (typeof m?.text === 'string' ? m.text : m?.body || '').trim();
  if (!body) return false;
  const isRunViaReply = /^run$/i.test(body) || body === '>';
  if (isRunViaReply) {
    if (!checkMainOwner(m, participants)) return false;
    const conn = sock;
    const quotedCode = await getQuotedCode(m, conn);
    if (!quotedCode) {
      await plainReply(m, conn, ' Reply ke pesan atau file .js yang isinya kode dulu, baru ketik `run` atau `>`.');
      return true;
    }
    const ctx = { m, sock, conn };
    const t0 = Date.now();
    try {
      const evaled = await runEval(quotedCode, ctx, 'auto');
      const ms = Date.now() - t0;
      const formatted = formatEvalResult(evaled);
      if (formatted && formatted.__buffer) {
        await sendBuffer(m, conn, formatted.__buffer, 'eval');
      } else {
        await replySmart(m, conn, `${formatted}\n\n_⏱ ${ms}ms_`, { label: 'eval', ext: 'txt' });
      }
    } catch (err) {
      logError(`[EVAL run-via-reply] ${err?.message || err}`);
      await plainReply(m, conn, ` Error:\n\`\`\`\n${truncate(err?.stack || err?.message || String(err))}\n\`\`\``);
    }
    return true;
  }
  if (!body.startsWith('>') && !body.startsWith('$') && !body.startsWith('=>')) return false;
  if (!checkMainOwner(m, participants)) return false;
  const conn = sock;
  const ctx = { m, sock, conn };
  if (body.startsWith('=>')) {
    const code = cleanCode(body.slice(2));
    if (!code) return false;
    const t0 = Date.now();
    try {
      const result = await runEval(code, ctx, 'statement');
      const ms = Date.now() - t0;
      if (result !== undefined && Buffer.isBuffer(result)) {
        await sendBuffer(m, conn, result, 'eval');
      } else {
        const out = result === undefined ? ' Done (no return value)' : util.format(result);
        await replySmart(m, conn, `${out}\n\n_⏱ ${ms}ms_`, { label: 'eval' });
      }
    } catch (err) {
      logError(`[EVAL =>] ${err?.message || err}`);
      await plainReply(m, conn, ` Error:\n${err?.message || err}`);
    }
    return true;
  }
  if (body.startsWith('>')) {
    const code = cleanCode(body.slice(1));
    if (!code) return false;
    const t0 = Date.now();
    try {
      const evaled = await runEval(code, ctx, 'auto');
      const ms = Date.now() - t0;
      const formatted = formatEvalResult(evaled);
      if (formatted && formatted.__buffer) {
        await sendBuffer(m, conn, formatted.__buffer, 'eval');
      } else {
        await replySmart(m, conn, `${formatted}\n\n_⏱ ${ms}ms_`, { label: 'eval', ext: 'txt' });
      }
    } catch (err) {
      logError(`[EVAL >] ${err?.message || err}`);
      await plainReply(m, conn, ` Error:\n\`\`\`\n${truncate(err?.stack || err?.message || String(err))}\n\`\`\``);
    }
    return true;
  }
  if (body.startsWith('$')) {
    const shellCmd = body.slice(1).trim();
    if (!shellCmd) return false;
    const isRestartCmd = RESTART_CMD_RE.test(shellCmd);
    if (isRestartCmd) {
      try {
        await plainReply(m, conn, ` Menjalankan: \`${shellCmd}\`\n\n_Bot akan restart dalam beberapa detik..._`);
      } catch {}
      await new Promise((r) => setTimeout(r, 2500));
      logError(`[SHELL] $ ${shellCmd} (restart command)`);
      execPromise(shellCmd).catch(() => {});
      return true;
    }
    const t0 = Date.now();
    try {
      const { stdout, stderr } = await execPromise(shellCmd, {
        timeout: SHELL_TIMEOUT,
        maxBuffer: SHELL_MAX_BUFFER,
      });
      const ms = Date.now() - t0;
      const out = stdout?.trim();
      const err = stderr?.trim();
      if (out && err) {
        await replySmart(
          m, conn,
          `*stdout:*\n\`\`\`\n${out}\n\`\`\`\n\n*stderr:*\n\`\`\`\n${err}\n\`\`\`\n\n_⏱ ${ms}ms_`,
          { label: 'shell' },
        );
      } else if (out) {
        await replySmart(m, conn, `*stdout:*\n\`\`\`\n${out}\n\`\`\`\n\n_⏱ ${ms}ms_`, { label: 'shell' });
      } else if (err) {
        await replySmart(m, conn, `*stderr:*\n\`\`\`\n${err}\n\`\`\`\n\n_⏱ ${ms}ms_`, { label: 'shell' });
      } else {
        await plainReply(m, conn, ` Command executed (no output) — _⏱ ${ms}ms_`);
      }
    } catch (error) {
      const isTimeout = error?.killed && error?.signal === 'SIGTERM';
      const msg = isTimeout
        ? `Command timeout setelah ${SHELL_TIMEOUT / 1000}s (dibatalkan otomatis).`
        : error?.message || String(error);
      logError(`[SHELL] $ ${shellCmd} -> ${msg}`);
      await replySmart(m, conn, `*Error:*\n\`\`\`\n${msg}\n\`\`\``, { label: 'shell-error' });
    }
    return true;
  }
  return false;
}
export default { handleSuperOwnerShortcut };
