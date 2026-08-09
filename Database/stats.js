'use strict';
import db from './sqlite.js';
const stmtGet = db.prepare('SELECT value FROM stats WHERE metric = ?');
const stmtUpsert = db.prepare(`
	INSERT INTO stats (metric, value) VALUES (?, ?)
	ON CONFLICT(metric) DO UPDATE SET value = excluded.value
`);
export function get(metric) {
    return stmtGet.get(metric)?.value || 0;
}
export function increment(metric, by = 1) {
    const current = get(metric);
    stmtUpsert.run(metric, current + by);
    return current + by;
}
export function set(metric, value) {
    stmtUpsert.run(metric, value);
}
export function getAll() {
    return db.prepare('SELECT * FROM stats').all();
}
export default { get, increment, set, getAll };
