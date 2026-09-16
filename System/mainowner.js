//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

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
