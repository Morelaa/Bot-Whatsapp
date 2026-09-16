//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import db from './sqlite.js';
import { logInfo } from '../Core/logutil.js';
const stmtGet = db.prepare('SELECT value, expires_at FROM kv_store WHERE key = ?');
const stmtSet = db.prepare(`
	INSERT INTO kv_store (key, value, updated_at, expires_at) VALUES (?, ?, ?, ?)
	ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, expires_at = excluded.expires_at
`);
const stmtDelete = db.prepare('DELETE FROM kv_store WHERE key = ?');
const stmtAllKeys = db.prepare('SELECT key FROM kv_store');
const stmtPruneExpired = db.prepare('DELETE FROM kv_store WHERE expires_at IS NOT NULL AND expires_at < ?');
export function get(key, fallback) {
    const row = stmtGet.get(key);
    if (!row) return fallback;
    if (row.expires_at != null && row.expires_at < Date.now()) {
        stmtDelete.run(key);
        return fallback;
    }
    try {
        return JSON.parse(row.value);
    }
    catch {
        return row.value;
    }
}
export function set(key, value, ttlMs = null) {
    const expiresAt = ttlMs != null ? Date.now() + ttlMs : null;
    stmtSet.run(key, JSON.stringify(value), Date.now(), expiresAt);
}
export function del(key) {
    stmtDelete.run(key);
}
export function has(key) {
    const row = stmtGet.get(key);
    if (!row) return false;
    if (row.expires_at != null && row.expires_at < Date.now()) {
        stmtDelete.run(key);
        return false;
    }
    return true;
}
export function keys(prefix = '') {
    return stmtAllKeys
        .all()
        .map((r) => r.key)
        .filter((k) => k.startsWith(prefix));
}
export function pruneExpired() {
    const info = stmtPruneExpired.run(Date.now());
    return info.changes;
}
const stmtDeleteByPrefix = db.prepare('DELETE FROM kv_store WHERE key LIKE ? ESCAPE \'\\\'');
export function delByPrefix(prefix) {
    const escaped = prefix.replace(/[\\%_]/g, (c) => `\\${c}`);
    const info = stmtDeleteByPrefix.run(`${escaped}%`);
    return info.changes;
}
const SWEEP_INTERVAL_MS = 30 * 60 * 1000; 
let _sweepTimer = null;
export function startKvStoreSweeper() {
    if (_sweepTimer) return;
    const run = () => {
        try {
            const removed = pruneExpired();
            if (removed > 0) logInfo(`[KVSTORE] Sweeper: ${removed} entry kadaluarsa dibersihkan.`);
        }
        catch (_) {  }
    };
    run();
    _sweepTimer = setInterval(run, SWEEP_INTERVAL_MS);
    _sweepTimer.unref?.();
}
startKvStoreSweeper();
export default { get, set, del, has, keys, pruneExpired, delByPrefix, startKvStoreSweeper };
