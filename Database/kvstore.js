'use strict';
import db from './sqlite.js';
const stmtGet = db.prepare('SELECT value FROM kv_store WHERE key = ?');
const stmtSet = db.prepare(`
	INSERT INTO kv_store (key, value, updated_at) VALUES (?, ?, ?)
	ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
`);
const stmtDelete = db.prepare('DELETE FROM kv_store WHERE key = ?');
const stmtAllKeys = db.prepare('SELECT key FROM kv_store');
export function get(key, fallback) {
    const row = stmtGet.get(key);
    if (!row)
        return fallback;
    try {
        return JSON.parse(row.value);
    }
    catch {
        return row.value;
    }
}
export function set(key, value) {
    stmtSet.run(key, JSON.stringify(value), Date.now());
}
export function del(key) {
    stmtDelete.run(key);
}
export function has(key) {
    return !!stmtGet.get(key);
}
export function keys(prefix = '') {
    return stmtAllKeys
        .all()
        .map((r) => r.key)
        .filter((k) => k.startsWith(prefix));
}
export default { get, set, del, has, keys };
