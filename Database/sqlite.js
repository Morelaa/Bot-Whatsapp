'use strict';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import config from '../config.js';
import { logInfo, logError } from '../Core/logutil.js';
fs.mkdirSync(config.dataDir, { recursive: true });
const db = new Database(config.dbFile);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
const MIGRATIONS = [
    `CREATE TABLE IF NOT EXISTS kv_store (
		key TEXT PRIMARY KEY,
		value TEXT NOT NULL,
		updated_at INTEGER NOT NULL
	)`,
    `CREATE TABLE IF NOT EXISTS users (
		jid TEXT PRIMARY KEY,
		lid TEXT,
		push_name TEXT,
		phone TEXT,
		registered_at INTEGER,
		name TEXT,
		age INTEGER,
		premium INTEGER DEFAULT 0,
		banned INTEGER DEFAULT 0,
		created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
	)`,
    `CREATE TABLE IF NOT EXISTS lid_map (
		lid TEXT PRIMARY KEY,
		phone TEXT NOT NULL
	)`,
    `CREATE TABLE IF NOT EXISTS groups (
		jid TEXT PRIMARY KEY,
		name TEXT,
		settings TEXT DEFAULT '{}',
		created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
	)`,
    `CREATE TABLE IF NOT EXISTS group_members (
		group_jid TEXT NOT NULL,
		member_jid TEXT NOT NULL,
		name TEXT,
		role TEXT NOT NULL DEFAULT 'member',
		status TEXT NOT NULL DEFAULT 'active',
		joined_at INTEGER,
		left_at INTEGER,
		updated_at INTEGER NOT NULL,
		PRIMARY KEY (group_jid, member_jid)
	)`,
    `CREATE TABLE IF NOT EXISTS chat_count (
		jid TEXT NOT NULL,
		command TEXT NOT NULL,
		count INTEGER NOT NULL DEFAULT 0,
		last_used INTEGER,
		PRIMARY KEY (jid, command)
	)`,
    `CREATE TABLE IF NOT EXISTS usage_limit (
		jid TEXT NOT NULL,
		date TEXT NOT NULL,
		used INTEGER NOT NULL DEFAULT 0,
		PRIMARY KEY (jid, date)
	)`,
    `CREATE TABLE IF NOT EXISTS stats (
		metric TEXT PRIMARY KEY,
		value INTEGER NOT NULL DEFAULT 0
	)`,
];
function ensureColumn(table, column, definition) {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all();
    const exists = cols.some((c) => c.name === column);
    if (!exists) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
}
export function migrate() {
    const run = db.transaction(() => {
        for (const sql of MIGRATIONS)
            db.exec(sql);
    });
    try {
        run();
        ensureColumn('users', 'sn_code', 'TEXT');
        logInfo('Database migration selesai.');
    }
    catch (err) {
        logError('Migration gagal:', err.message);
        throw err;
    }
}
migrate();
try {
    const check = db.pragma('integrity_check');
    const ok = Array.isArray(check) && check.length === 1 && check[0]?.integrity_check === 'ok';
    if (!ok) {
        logError('PRAGMA integrity_check menemukan masalah pada database:', JSON.stringify(check));
        logError('lid_map dan data lain bisa jadi tidak lengkap/hilang. Pertimbangkan restore dari backup jika tersedia.');
    }
}
catch (err) {
    logError('Gagal menjalankan integrity_check:', err?.message);
}
export function checkpointAndClose() {
    try {
        // Flush WAL (data/morela.db-wal) into the main db file so a killed process
        // (e.g. "Stop" di Pterodactyl, biasanya SIGKILL/SIGTERM tanpa graceful exit)
        // doesn't leave uncommitted WAL data behind (this is the main source of the
        // "database kadang corrupt" symptom).
        db.pragma('wal_checkpoint(TRUNCATE)');
        db.close();
        logInfo('Database checkpoint & close berhasil sebelum shutdown.');
    }
    catch (err) {
        logError('Gagal checkpoint/close database saat shutdown:', err?.message);
    }
}
export default db;
