'use strict';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENTRY = path.join(__dirname, 'utama.js');
const CRASH_WINDOW_MS = 30_000;
const MAX_FAST_RESTARTS = 5;
let recentRestarts = [];
function log(...args) {
    console.log('[launcher]', ...args);
}
function spawnBot() {
    log(`Menjalankan ${ENTRY} ...`);
    const child = spawn(process.execPath, [ENTRY], {
        stdio: 'inherit',
        env: process.env,
    });
    child.on('exit', (code, signal) => {
        log(`Proses bot berhenti (code=${code}, signal=${signal}).`);
        const now = Date.now();
        recentRestarts = recentRestarts.filter((t) => now - t < CRASH_WINDOW_MS);
        recentRestarts.push(now);
        if (recentRestarts.length > MAX_FAST_RESTARTS) {
            log(`Terlalu banyak restart cepat (${recentRestarts.length}x dalam ${CRASH_WINDOW_MS}ms). Launcher berhenti.`);
            log('Cek log error di atas, perbaiki dulu sebelum jalankan ulang launcher.');
            process.exit(1);
        }
        log('Restart dalam 2 detik...');
        setTimeout(spawnBot, 2000);
    });
    child.on('error', (err) => {
        log('Gagal spawn proses bot:', err?.message);
    });
    return child;
}
let currentChild = spawnBot();
for (const sig of ['SIGINT', 'SIGTERM']) {
    process.on(sig, () => {
        log(`Menerima ${sig}, mematikan bot...`);
        currentChild?.kill(sig);
        process.exit(0);
    });
}
