import * as kcors from 'kcors';
import * as Koa from 'koa';
import bodyParser from 'koa-bodyparser-ts';
import sessionFactory from 'koa-session-ts';

import { Logger, LoggerInstance, transports } from 'winston';
import { DataController } from './controllers';
import DatabaseManager from './database/databaseManager';
import { CONFIG } from './init';
import logging from './middlewares/logging';
// import sessionFactory, { RedisStore } from './middlewares/session';
import { RedisStore } from './middlewares/redisSessionStore';
import getCourseRouters from './routes/getCourse';
import getForumRouters from './routes/getForum';
import getVideoRouters from './routes/getVideo';
const pkg =  process.env.NODE_ENV === 'development' ? require('../../package.json') : require('./package.json');

declare module 'koa' {
    export interface BaseContext {
        dataController: DataController;
        logger?: LoggerInstance;
    }
}

export default function Server(config: typeof CONFIG) {
    const app: Koa = new Koa();
    // data controller
    app.context.dataController = new DataController(DatabaseManager.Database);
    // loger
    app.context.logger = new Logger({
        level: CONFIG.logLevel,
        transports: [
            new (transports.Console)({
                label: `vismooc-ws@${pkg.version}`,
            }),
        ],
    });
    // middlewares
    app.use(kcors());
    app.use(logging('combined'));
    app.use(bodyParser());

    app.keys = ['secret'];
    app.use(sessionFactory({ store: new RedisStore('vismooc', DatabaseManager.CacheDatabase) }));

    const prefixApi = '/api';
    app.use(getCourseRouters.prefix(prefixApi).routes());
    app.use(getVideoRouters.prefix(prefixApi).routes());
    app.use(getForumRouters.prefix(prefixApi).routes());

    return app.listen(config.port);
}
