//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import os from 'os';
import { formatBytes, formatUptime } from './utils.js';
export function getMemoryUsage() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    return {
        total: formatBytes(total),
        free: formatBytes(free),
        used: formatBytes(used),
        percentUsed: ((used / total) * 100).toFixed(1),
    };
}
export function getProcessMemory() {
    const mem = process.memoryUsage();
    return {
        rss: formatBytes(mem.rss),
        heapUsed: formatBytes(mem.heapUsed),
        heapTotal: formatBytes(mem.heapTotal),
    };
}
export function getCpuInfo() {
    const cpus = os.cpus();
    return {
        model: cpus[0]?.model || 'unknown',
        cores: cpus.length,
        loadAvg: os.loadavg().map((n) => n.toFixed(2)),
    };
}
export function getSystemUptime() {
    return formatUptime(os.uptime() * 1000);
}
export function getProcessUptime() {
    return formatUptime(process.uptime() * 1000);
}
export function getPlatformInfo() {
    return {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        hostname: os.hostname(),
    };
}
export function getFullSystemInfo() {
    return {
        memory: getMemoryUsage(),
        process: getProcessMemory(),
        cpu: getCpuInfo(),
        systemUptime: getSystemUptime(),
        processUptime: getProcessUptime(),
        ...getPlatformInfo(),
    };
}
export default {
    getMemoryUsage,
    getProcessMemory,
    getCpuInfo,
    getSystemUptime,
    getProcessUptime,
    getPlatformInfo,
    getFullSystemInfo,
};
