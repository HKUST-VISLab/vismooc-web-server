import * as fs from 'fs';

import DatabaseManager from './database/databaseManager';

export let CONFIG = {
    port: 9999,
    subPath: '',
    mongo: {
        host: 'localhost',
        name: 'testVismoocElearning',
        port: 27017,
    },
    redis: {
        port: 6379,
        host: 'localhost',
    },
    oauth2: {
        authorizationURL: 'https://learn2.hkmooc.hk/oauth2/authorize/',
        tokenURL: 'https://learn2.hkmooc.hk/oauth2/access_token/',
        callbackURL: 'http://localhost:9999/oauth2/',
        clientId: 'zhutian_testing_client',
        clientSecret: '5d004c7056fa6908530b88e0f97d3076210caf7a',
        scope: ['openid', 'profile', 'email', 'course_staff', 'course_instructor', 'permissions'],
    },
};
export async function initAll() {
    const configFilePath = process.argv.slice(0)[2];
    if (configFilePath) {
        console.info('read config file from ' + configFilePath);
        const config = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));
        CONFIG = Object.assign({}, CONFIG, config.webserver);
        CONFIG.mongo = Object.assign({}, CONFIG.mongo, config.mongo);
    }
    await DatabaseManager.init();
    DatabaseManager.CacheDatabase.flushdb();
}
