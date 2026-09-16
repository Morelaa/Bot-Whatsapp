//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import { EventEmitter } from 'events';
class BotEventBus extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(50);
    }
    emitLogged(event, payload) {
        this.emit(event, payload);
        this.emit('*', event, payload);
    }
}
const events = new BotEventBus();
export const EVENTS = {
    READY: 'bot:ready',
    RECONNECTING: 'bot:reconnecting',
    DISCONNECTED: 'bot:disconnected',
    MESSAGE_IN: 'message:in',
    COMMAND_EXECUTED: 'command:executed',
    COMMAND_ERROR: 'command:error',
    PLUGIN_LOADED: 'plugin:loaded',
    PLUGIN_RELOADED: 'plugin:reloaded',
    PLUGIN_ERROR: 'plugin:error',
    GROUP_PARTICIPANTS_UPDATE: 'group:participants:update',
};
export default events;
