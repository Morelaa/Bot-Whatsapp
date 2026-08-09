'use strict';
import config from '../config.js';
function normalizeNum(raw) {
    if (!raw)
        return '';
    return String(raw).replace(/[^0-9]/g, '');
}
const MAIN_OWNER_NUM = normalizeNum(config.mainOwner);
export function isMainOwner(num) {
    if (!num)
        return false;
    return normalizeNum(num) === MAIN_OWNER_NUM;
}
export function getMainOwnerNumber() {
    return MAIN_OWNER_NUM;
}
export default { isMainOwner, getMainOwnerNumber };
