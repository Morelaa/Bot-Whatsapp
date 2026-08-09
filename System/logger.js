'use strict';
import pino from 'pino';
import config from '../config.js';
const level = config.debug ? 'debug' : config.baileysLogLevel;
const logger = pino({ level }).child({ scope: 'baileys' });
export default logger;
