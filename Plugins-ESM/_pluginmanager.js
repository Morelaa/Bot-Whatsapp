//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import config from '../config.js';
import events, { EVENTS } from '../Core/events.js';
import { logPlugin, logError, logWarn } from '../Core/logutil.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
class PluginManager {
    constructor() {
        this.plugins = new Map();
        this.watchers = [];
    }
    _validate(handler, filePath) {
        if (typeof handler !== 'function') {
            throw new Error(`Plugin di ${filePath} harus export default FUNCTION (handler), bukan ${typeof handler}`);
        }
        if (!(handler.command instanceof RegExp)) {
            throw new Error(`Plugin di ${filePath} butuh "handler.command" berupa RegExp, contoh: /^menu$/i`);
        }
        return true;
    }
    _findDuplicateCommand(handler, excludeFilePath) {
        const key = handler.command.toString();
        for (const [filePath, existing] of this.plugins.entries()) {
            if (filePath === excludeFilePath) continue;
            if (existing.command.toString() === key) {
                return filePath;
            }
        }
        return null;
    }
    async _loadFile(filePath) {
        try {
            const url = `${pathToFileURL(filePath).href}?v=${Date.now()}`;
            const mod = await import(url);
            const handler = mod.default;
            this._validate(handler, filePath);
            const dupPath = this._findDuplicateCommand(handler, filePath);
            if (dupPath) {
                const msg = `Command ${handler.command} di ${filePath} sudah dipakai oleh ${dupPath} — plugin ini ditolak (skip) biar gak duplikat.`;
                logWarn(msg);
                events.emitLogged(EVENTS.PLUGIN_ERROR, { filePath, error: msg });
                return null;
            }
            handler.filePath = filePath;
            handler.help ??= [];
            handler.tags ??= [];
            this.plugins.set(filePath, handler);
            return handler;
        }
        catch (err) {
            logError(`Gagal load plugin ${filePath}:`, err?.message);
            events.emitLogged(EVENTS.PLUGIN_ERROR, { filePath, error: err?.message });
            return null;
        }
    }
    async loadAll() {
        this.plugins.clear();
        const summary = [];
        for (const dir of config.pluginDirs) {
            const dirPath = path.join(__dirname, dir);
            if (!fs.existsSync(dirPath))
                continue;
            const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.js'));
            let loaded = 0;
            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const handler = await this._loadFile(filePath);
                if (handler)
                    loaded++;
            }
            if (loaded > 0)
                summary.push(`${dir}(${loaded})`);
        }
        events.emitLogged(EVENTS.PLUGIN_LOADED, { total: this.plugins.size });
        logPlugin(`Dimuat: ${summary.join(', ')}`);
        logPlugin(`Total ${this.plugins.size} plugin dimuat.`);
        if (config.pluginHotReload)
            this._setupWatchers();
    }
    _setupWatchers() {
        for (const w of this.watchers)
            w.close?.();
        this.watchers = [];
        for (const dir of config.pluginDirs) {
            const dirPath = path.join(__dirname, dir);
            if (!fs.existsSync(dirPath))
                continue;
            const watcher = fs.watch(dirPath, { persistent: false }, async (eventType, filename) => {
                if (!filename || !filename.endsWith('.js'))
                    return;
                const filePath = path.join(dirPath, filename);
                if (!fs.existsSync(filePath)) {
                    this.plugins.delete(filePath);
                    logPlugin(`Plugin dihapus: ${dir}/${filename}`);
                    return;
                }
                clearTimeout(this._reloadTimers?.[filePath]);
                this._reloadTimers ??= {};
                this._reloadTimers[filePath] = setTimeout(async () => {
                    const handler = await this._loadFile(filePath);
                    if (handler) {
                        events.emitLogged(EVENTS.PLUGIN_RELOADED, { filePath });
                        logPlugin(`Reloaded: ${dir}/${filename}`);
                    }
                }, 150);
            });
            this.watchers.push(watcher);
        }
    }
    findCommand(commandWord) {
        if (!commandWord)
            return null;
        for (const handler of this.plugins.values()) {
            if (handler.command.test(commandWord))
                return handler;
        }
        return null;
    }
    async addPlugin(pluginRelPath, code) {
        const filePath = path.join(__dirname, `${pluginRelPath}.js`);
        const resolved = path.resolve(filePath);
        const pluginsRoot = path.resolve(__dirname);
        if (!resolved.startsWith(pluginsRoot + path.sep)) {
            return { success: false, error: 'Path plugin tidak valid (di luar folder Plugins-ESM).' };
        }
        const dir = path.dirname(filePath);
        fs.mkdirSync(dir, { recursive: true });
        const existed = fs.existsSync(filePath);
        const backup = existed ? fs.readFileSync(filePath, 'utf8') : null;
        fs.writeFileSync(filePath, code, 'utf8');
        try {
            const url = `${pathToFileURL(filePath).href}?v=${Date.now()}`;
            const mod = await import(url);
            const handler = mod.default;
            this._validate(handler, filePath);
            const dupPath = this._findDuplicateCommand(handler, filePath);
            if (dupPath) {
                const dupRel = path.relative(__dirname, dupPath).replace(/\\/g, '/').replace(/\.js$/i, '');
                throw new Error(`Command ${handler.command} sudah dipakai oleh plugin lain: ${dupRel}.js. Kalau maksudnya update/perbaiki plugin itu, simpan dengan nama file yang SAMA (path: "${dupRel}"), bukan nama baru. Kalau memang mau bikin plugin baru yang beda, ganti command-nya biar gak duplikat.`);
            }
            handler.filePath = filePath;
            handler.help ??= [];
            handler.tags ??= [];
            this.plugins.set(filePath, handler);
            events.emitLogged(EVENTS.PLUGIN_LOADED, { filePath });
            logPlugin(`Plugin ditambahkan lewat chat: ${path.relative(__dirname, filePath)} -> ${handler.command}`);
            return { success: true, command: String(handler.command), filePath };
        }
        catch (err) {
            if (backup !== null) {
                fs.writeFileSync(filePath, backup, 'utf8');
                try {
                    await this._loadFile(filePath);
                }
                catch { }
            }
            else {
                try {
                    fs.unlinkSync(filePath);
                }
                catch { }
            }
            logError(`Gagal addPlugin ${pluginRelPath}:`, err?.message);
            return { success: false, error: err?.message || String(err) };
        }
    }
    getAllPlugins() {
        return [...this.plugins.values()];
    }
    getTextListeners() {
        return this.getAllPlugins().filter((p) => typeof p.onText === 'function');
    }
    getByTag(tag) {
        return this.getAllPlugins().filter((p) => p.tags?.includes(tag));
    }
    findByName(name) {
        if (!name)
            return [];
        const clean = name.replace(/\.js$/i, '').trim().toLowerCase();
        if (!clean)
            return [];
        const results = [];
        for (const [filePath, handler] of this.plugins.entries()) {
            const rel = path.relative(__dirname, filePath).replace(/\\/g, '/').replace(/\.js$/i, '');
            const base = path.basename(filePath, '.js');
            if (rel.toLowerCase() === clean || base.toLowerCase() === clean) {
                results.push({ filePath, handler, rel });
            }
        }
        return results;
    }
    deletePlugin(name) {
        const matches = this.findByName(name);
        if (matches.length === 0) {
            return { success: false, error: `Plugin "${name}" tidak ditemukan.` };
        }
        if (matches.length > 1) {
            return {
                success: false,
                error: `Nama "${name}" ambigu, ditemukan di: ${matches.map((m) => m.rel).join(', ')}. Pakai format folder/nama.`,
            };
        }
        const { filePath, rel } = matches[0];
        try {
            fs.unlinkSync(filePath);
            this.plugins.delete(filePath);
            logPlugin(`Plugin dihapus lewat chat: ${rel}.js`);
            return { success: true, filePath, rel };
        }
        catch (err) {
            return { success: false, error: err?.message || String(err) };
        }
    }
    getPluginSource(name) {
        const matches = this.findByName(name);
        if (matches.length === 0) {
            return { success: false, error: `Plugin "${name}" tidak ditemukan.` };
        }
        if (matches.length > 1) {
            return {
                success: false,
                error: `Nama "${name}" ambigu, ditemukan di: ${matches.map((m) => m.rel).join(', ')}. Pakai format folder/nama.`,
            };
        }
        const { filePath, rel } = matches[0];
        try {
            const code = fs.readFileSync(filePath, 'utf8');
            return { success: true, filePath, rel, code };
        }
        catch (err) {
            return { success: false, error: err?.message || String(err) };
        }
    }
}
const pluginManager = new PluginManager();
export default pluginManager;
