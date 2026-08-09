'use strict';
import chalk from 'chalk';
import gradient from 'gradient-string';
import figlet from 'figlet';
import { DateTime } from 'luxon';
const g        = gradient(['#22d3ee', '#38bdf8', '#818cf8', '#a855f7']);
const borderFx = gradient(['#22d3ee', '#3b82f6', '#818cf8', '#a855f7']);
const mintFx   = gradient(['#10b981', '#2dd4bf', '#38bdf8']);
const warmFx   = gradient(['#f59e0b', '#f97316', '#ef4444']);
const k = {
  p:  chalk.hex('#A855F7'),
  s:  chalk.hex('#22D3EE'),
  a:  chalk.hex('#F59E0B'),
  t:  chalk.white,
  d:  chalk.hex('#94A3B8'),
  m:  chalk.hex('#64748B'),
  ok: chalk.hex('#34D399'),
  no: chalk.hex('#FB7185'),
  wn: chalk.hex('#FBBF24'),
  in: chalk.hex('#60A5FA'),
  db: chalk.hex('#94A3B8'),
  bd: chalk.hex('#475569'),
  tg: chalk.hex('#C084FC'),
  cy: chalk.hex('#22D3EE'),
  pk: chalk.hex('#F472B6'),
  or: chalk.hex('#FB923C'),
  lm: chalk.hex('#A3E635'),
};
const SYM = {
  ok:   k.ok(''),
  no:   k.no(''),
  wn:   k.wn('▲'),
  info: k.in('◈'),
  dot:  k.d('•'),
  arr:  k.p('»'),
  bar:  k.d('│'),
  cmd:  k.cy(''),
};
function formatTime(fmt = 'HH:mm:ss') {
  return DateTime.now().setZone('Asia/Jakarta').toFormat(fmt);
}
function ts() { return k.d(formatTime('HH:mm:ss')); }
function dt() { return k.d(formatTime('dd/MM/yyyy')); }
function pad(label, n = 13) {
  return String(label).toLowerCase().padEnd(n);
}
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
const SPINNER_FRAMES = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
const ANSI = {
  clearLine:  '\u001B[2K',
  cursorHome: '\r',
  hideCursor: '\u001B[?25l',
  showCursor: '\u001B[?25h',
};
function supportsInlineAnimation() {
  if (process.env.OURIN_FORCE_ANIMATION === 'true') return true;
  if (process.env.OURIN_NO_ANIMATION  === 'true')   return false;
  if (process.env.CI)                                return false;
  if (!process.stdout.isTTY || !process.stdin?.isTTY) return false;
  if (process.env.TERM === 'dumb')                   return false;
  return (
    typeof process.stdout.clearLine  === 'function' &&
    typeof process.stdout.cursorTo   === 'function'
  );
}
function clearCurrentLine() {
  if (!supportsInlineAnimation()) return;
  process.stdout.cursorTo(0);
  process.stdout.clearLine(0);
}
function setCursorHidden(hidden) {
  if (!supportsInlineAnimation()) return;
  process.stdout.write(hidden ? ANSI.hideCursor : ANSI.showCursor);
}
function pill(text, tone = 'info') {
  const tones = {
    info:    ['#0f172a', '#67e8f9'],
    success: ['#052e16', '#6ee7b7'],
    warn:    ['#3f2305', '#fcd34d'],
    error:   ['#3b0a15', '#fda4af'],
    system:  ['#111827', '#cbd5e1'],
    debug:   ['#1e293b', '#93c5fd'],
    primary: ['#2e1065', '#d8b4fe'],
    accent:  ['#312e81', '#c7d2fe'],
  };
  const [bg, fg] = tones[tone] || tones.info;
  return chalk.bgHex(bg).hex(fg).bold(` ${String(text).toLowerCase()} `);
}
function renderDetail(kind, detail = '') {
  const text = String(detail);
  if (!text)                  return '';
  if (kind === 'warn')        return k.wn(text);
  if (kind === 'error')       return k.no(text);
  if (kind === 'system')      return k.d(text);
  if (kind === 'debug')       return k.db(text);
  return chalk.whiteBright(text);
}
function writeLog(kind, label, detail = '') {
  const map = {
    info:    { icon: SYM.info, tone: 'info'    },
    success: { icon: SYM.ok,   tone: 'success' },
    warn:    { icon: SYM.wn,   tone: 'warn'    },
    error:   { icon: SYM.no,   tone: 'error'   },
    system:  { icon: SYM.dot,  tone: 'system'  },
    debug:   { icon: k.cy('◌'), tone: 'debug'  },
  };
  const meta       = map[kind] || map.info;
  const detailText = detail ? ` ${renderDetail(kind, detail)}` : '';
  console.log(`  ${meta.icon} ${pill(label, meta.tone)}${detailText}`);
}
export const logger = {
  info:    (label, detail = '') => writeLog('info',    label, detail),
  success: (label, detail = '') => writeLog('success', label, detail),
  warn:    (label, detail = '') => writeLog('warn',    label, detail),
  error:   (label, detail = '') => writeLog('error',   label, detail),
  system:  (label, detail = '') => writeLog('system',  label, detail),
  debug:   (label, detail = '') => writeLog('debug',   label, detail),
  tag:     (label, msg, detail = '') =>
    console.log(`  ${SYM.info} ${pill(label, 'accent')} ${chalk.whiteBright(msg)}${detail ? ` ${k.d(detail)}` : ''}`),
};
export function createSpinner(label = 'system', text = 'loading', options = {}) {
  let frame   = 0;
  let timer   = null;
  let active  = false;
  let inline  = false;
  let currentText = String(text);
  const interval  = options.interval || 80;
  const tone      = options.tone     || 'info';
  const render = () => {
    if (!inline) return;
    const glyph = g(SPINNER_FRAMES[frame % SPINNER_FRAMES.length]);
    clearCurrentLine();
    process.stdout.write(`  ${glyph} ${pill(label, tone)} ${chalk.whiteBright(currentText)} ${k.d('·')} ${borderFx('live')}`);
    frame += 1;
  };
  return {
    start() {
      if (active) return;
      inline = supportsInlineAnimation();
      if (!inline) { logger.info(label, currentText); return; }
      active = true;
      setCursorHidden(true);
      render();
      timer = setInterval(render, interval);
    },
    update(nextText) {
      currentText = String(nextText);
      if (active && inline) render();
    },
    stop() {
      if (timer) clearInterval(timer);
      timer = null;
      if (inline) { clearCurrentLine(); setCursorHidden(false); }
      active = false;
      inline = false;
    },
    succeed(detail = currentText) { this.stop(); logger.success(label, detail); },
    warn(detail = currentText)    { this.stop(); logger.warn(label, detail);    },
    fail(detail = currentText)    { this.stop(); logger.error(label, detail);   },
    isActive() { return active; },
  };
}
export async function spinText(label, text, options = {}) {
  const spinner = createSpinner(label, text, options);
  spinner.start();
  await sleep(options.duration || 700);
  spinner.stop();
}
export async function typeLine(text, options = {}) {
  const indent   = options.indent || '  ';
  const delay    = options.delay  ?? 12;
  const colorize = options.colorize || ((v) => v);
  const full     = String(text);
  if (!supportsInlineAnimation() || delay <= 0) { console.log(indent + colorize(full)); return; }
  setCursorHidden(true);
  let current = '';
  for (const ch of full) {
    current += ch;
    clearCurrentLine();
    process.stdout.write(indent + colorize(current));
    await sleep(delay);
  }
  process.stdout.write('\n');
  setCursorHidden(false);
}
export async function runLoader(text = 'memuat sistem', options = {}) {
  const label    = options.label  || 'boot';
  const duration = options.duration || 900;
  const steps    = Math.max(10, options.steps || 18);
  const width    = Math.max(16, options.width || 24);
  if (!supportsInlineAnimation()) { logger.info(label, `${text} · 100%`); return; }
  setCursorHidden(true);
  for (let step = 0; step <= steps; step++) {
    const ratio  = step / steps;
    const filled = Math.round(width * ratio);
    const empty  = Math.max(0, width - filled);
    const bar    = `${mintFx('█'.repeat(filled))}${chalk.hex('#1e293b')('█'.repeat(empty))}`;
    clearCurrentLine();
    process.stdout.write(
      `  ${k.cy('')} ${pill(label, 'accent')} ${chalk.whiteBright(text)} ${bar} ${chalk.hex('#a3e635').bold(String(Math.round(ratio * 100)).padStart(3) + '%')}`
    );
    if (step < steps) await sleep(Math.max(20, Math.floor(duration / steps)));
  }
  process.stdout.write('\n');
  setCursorHidden(false);
}
export async function playBootSequence(info = {}) {
  const { name = 'MORELA', version = '2.0.0', mode = 'public' } = info;
  console.clear();
  console.log('');
  await spinText('render', 'mengkalibrasi gradient terminal', { duration: 520, tone: 'accent' });
  await runLoader('menyiapkan startup renderer', { label: 'boot', duration: 720, steps: 20, width: 28 });
  printBanner();
  await typeLine(`${name}        v${version} · ${mode}`, {
    indent: '  ', delay: 10, colorize: (v) => mintFx(v),
  });
  await typeLine('neon startup aktif · aurora gradient · typing stream', {
    indent: '  ', delay: 3, colorize: (v) => k.d(v),
  });
  console.log('');
}
const TYPE_MAP = {
  imageMessage:               ['Gambar',          '#34D399'],
  videoMessage:               ['Video',           '#60A5FA'],
  audioMessage:               ['Audio',           '#C084FC'],
  stickerMessage:             ['Stiker',          '#FBBF24'],
  documentMessage:            ['Dokumen',         '#F87171'],
  contactMessage:             ['Kontak',          '#A855F7'],
  locationMessage:            ['Lokasi',          '#10B981'],
  liveLocationMessage:        ['Lokasi Saat Ini', '#10B981'],
  viewOnceMessageV2:          ['1x Lihat',        '#F59E0B'],
  viewOnceMessage:            ['1x Lihat',        '#F59E0B'],
  extendedTextMessage:        ['Pesan Extended',  '#9CA3AF'],
  conversation:               ['Pesan',           '#9CA3AF'],
  interactiveResponseMessage: ['Menekan Tombol',  '#22D3EE'],
  interactiveMessage:         ['Interaktif',      '#22D3EE'],
  pollCreationMessage:        ['Pesan Poll',      '#FB923C'],
  pollUpdateMessage:          ['Vote Poll',       '#FB923C'],
  reactionMessage:            ['Reaksi',          '#F472B6'],
  buttonsMessage:             ['Tombol',          '#38BDF8'],
  listMessage:                ['List',            '#38BDF8'],
  templateMessage:            ['Template',        '#818CF8'],
  orderMessage:               ['Pesanan',         '#F59E0B'],
  groupInviteMessage:         ['Undangan Grup',   '#A855F7'],
  productMessage:             ['Produk',          '#34D399'],
};
function getTypeTag(msgType, isNewsletter) {
  if (isNewsletter) return chalk.hex('#F59E0B')('CH');
  const entry = TYPE_MAP[msgType];
  if (entry)         return chalk.hex(entry[1])(entry[0]);
  return k.d('Pesan Biasa');
}
function getRoleTag(info) {
  if (info.isOwner)   return chalk.hex('#F87171').bold('OWNER');
  if (info.isPartner) return chalk.hex('#FB923C').bold('PARTNER');
  if (info.isPremium) return chalk.hex('#FBBF24').bold('PREMIUM');
  if (info.isAdmin)   return chalk.hex('#60A5FA').bold('ADMIN');
  return k.d('MEMBER');
}
function getDeviceTag(device) {
  if (!device) return k.d('???');
  const d = device.toLowerCase();
  if (d.includes('android') || d.includes('smba')) return k.lm('Android');
  if (d.includes('iphone')  || d.includes('ios'))  return k.t('iPhone');
  if (d.includes('web')     || d.includes('multi')) return k.cy('Web');
  if (d.includes('desktop') || d.includes('windows')) return k.in('Desktop');
  return k.d(device);
}
export function getDeviceHint(msgId) {
  if (!msgId) return null;
  if (msgId.length > 22)          return 'Android';
  if (msgId.startsWith('3EB0'))   return 'iPhone';
  if (msgId.startsWith('BAE5'))   return 'Web';
  return null;
}
export function logMessage(info) {
  const {
    chatType, groupName, pushName, sender, message,
    messageType, isNewsletter,
    isOwner, isPremium, isPartner, isAdmin, device,
  } = info;
  if (!message || message.trim() === '' || !sender) return;
  const isGroup = chatType === 'group';
  const isNL    = chatType === 'newsletter';
  const num     = sender.replace('@s.whatsapp.net', '').replace('@lid', '');
  let msg = message.replace(/\n/g, ' ').substring(0, 70) + (message.length > 70 ? '...' : '');
  const time = formatTime('HH:mm:ss');
  const date = formatTime('dd/MM/yyyy');
  const typeTag = getTypeTag(messageType || '', isNewsletter || isNL || false);
  const roleTag = getRoleTag({ isOwner, isPremium, isPartner, isAdmin });
  const devTag  = getDeviceTag(device || null);
  const chatTag = isNL
    ? chalk.bold.white('Ini pesan dari saluran ')  + chalk.hex('#F59E0B').bold(groupName || 'Channel')
    : isGroup
      ? chalk.bold.white('Ini pesan dari grup ')   + chalk.hex('#9000ff').bold(groupName || 'Group')
      : chalk.bold.white('Ini pesan dari private chat ') + chalk.hex('#ff0000').bold(pushName || 'User');
  const br = borderFx;
  console.log('');
  console.log(`  ${br('╭─〔')} ${chatTag} ${br('〕───⬣')}`);
  console.log(`  ${k.bd('│')} ${k.t('')} Nama: ${chalk.whiteBright(pushName || 'User')}`);
  console.log(`  ${k.bd('│')} ${k.t('')} Nomor: +${chalk.hex('#67e8f9')(num)}`);
  console.log(`  ${k.bd('│')} ${k.t('')} Tanggal/Waktu: ${k.d(date)} ${chalk.whiteBright(time)}`);
  console.log(`  ${k.bd('│')} ${k.t('')} Device: ${devTag}`);
  console.log(`  ${k.bd('│')} ${k.t('')} Tipe Pesan: ${k.d('[')}${typeTag}${k.d(']')}`);
  console.log(`  ${k.bd('│')} ${k.t('')} Role: ${roleTag}`);
  console.log(`  ${k.bd('│')} ${k.t('')} ${chalk.whiteBright(msg)}`);
  console.log(`  ${br('╰───────⬣')}`);
}
export function logPlugin(name, category) {
  console.log(`  ${k.bd('├─')} ${chalk.whiteBright(name)} ${pill(category, 'primary')}`);
}
export function logConnection(status, info = '') {
  const w     = 52;
  const label = status === 'connected'
    ? chalk.hex('#34D399').bold('● Connected')
    : status === 'connecting'
      ? warmFx('◐ Connecting')
      : chalk.hex('#FB7185').bold('○ Disconnected');
  const line   = borderFx('═'.repeat(w));
  const detail = info ? chalk.whiteBright(info) : k.d('-');
  console.log('');
  console.log(line);
  console.log(`  ${label} ${k.d('—')} ${detail}`);
  console.log(line);
}
export function logErrorBox(title, message) {
  console.log('');
  console.log(`  ${pill('error', 'error')} ${chalk.hex('#fda4af').bold(title)}`);
  console.log(`  ${k.bd('│')} ${chalk.gray(message)}`);
  console.log('');
}
export function printBanner(mini = false) {
  if (mini) { console.log(''); return; }
  console.log('');
  const ascii = figlet.textSync('MORELA', {
    font: 'Standard',
    horizontalLayout: 'fitted',
  });
  console.log(g(ascii));
  console.log(`  ${borderFx('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}`);
  console.log('');
}
export function printStartup(info = {}) {
  const { name = 'morela', version = '2.0.0', mode = 'public' } = info;
  console.log(`  ${pill(name, 'primary')} ${k.d('v' + version)} ${k.d('·')} ${mintFx(String(mode))}`);
  console.log('');
}
export function createBanner(lines) {
  const maxLen = Math.max(...lines.map(l => l.length));
  const padded = lines.map(l => l.padEnd(maxLen));
  let res = borderFx(`╭${'─'.repeat(maxLen + 2)}╮`) + '\n';
  for (const line of padded)
    res += k.bd('│') + ' ' + chalk.whiteBright(line) + ' ' + k.bd('│') + '\n';
  res += borderFx(`╰${'─'.repeat(maxLen + 2)}╯`);
  return res;
}
export function divider() {
  console.log(borderFx('─'.repeat(54)));
}
export function getTimestamp() {
  return k.d(formatTime('HH:mm:ss'));
}
export const theme = {
  ...k,
  primary: k.p, secondary: k.s, accent: k.a, text: k.t,
  dim: k.d, muted: k.m, success: k.ok, error: k.no,
  warning: k.wn, info: k.in, debug: k.db, border: k.bd,
  tag: k.tg, pill, rainbow: g, borderFx, mintFx, warmFx,
};
export default {
  logger, createSpinner, spinText, typeLine, runLoader, playBootSequence,
  getDeviceHint, logMessage, logPlugin, logConnection, logErrorBox,
  printBanner, printStartup, createBanner, divider, getTimestamp, theme,
};
