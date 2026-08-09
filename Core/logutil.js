'use strict';
import chalk from 'chalk';
import config from '../config.js';
function timestamp() {
    return new Date().toLocaleTimeString('id-ID', { hour12: false });
}
function base(tagColor, tag, ...args) {
    console.log(chalk.gray(`[${timestamp()}]`), tagColor(`[${tag}]`), ...args);
}
export const logInfo = (...args) => base(chalk.cyanBright, 'INFO', ...args);
export const logSuccess = (...args) => base(chalk.greenBright, 'SUKSES', ...args);
export const logWarn = (...args) => base(chalk.yellowBright, 'WARN', ...args);
export const logError = (...args) => base(chalk.redBright, 'ERROR', ...args);
export const logDebug = (...args) => {
    if (config.debug)
        base(chalk.magentaBright, 'DEBUG', ...args);
};
export const logPlugin = (...args) => base(chalk.blueBright, 'PLUGIN', ...args);
export const logCommand = (...args) => base(chalk.greenBright, 'CMD', ...args);
export async function safeRun(label, fn, { rethrow = false } = {}) {
    try {
        return await fn();
    }
    catch (err) {
        logError(`${label} gagal:`, err?.stack || err?.message || err);
        if (rethrow)
            throw err;
        return null;
    }
}
export default { logInfo, logSuccess, logWarn, logError, logDebug, logPlugin, logCommand, safeRun };
