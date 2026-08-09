'use strict';
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
