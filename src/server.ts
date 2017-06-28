import * as Koa from 'koa';
import bodyParser from 'koa-bodyparser-ts';
import * as staticFile from 'koa-static';
import { DataController } from './controllers';
import DatabaseManager from './database/databaseManager';
// import hackPermission from './middlewares/hackPermission';
import logging from './middlewares/logging';
import session, {RedisStore} from './middlewares/session';
import getCourseRouters from './routes/getCourse';
import getForumRouters from './routes/getForum';
import getVideoRouters from './routes/getVideo';

declare module 'koa' {
    export interface BaseContext {
        dataController: DataController;
    }
}

export default function Server() {
    const app: Koa = new Koa();
    // data controller
    app.context.dataController = new DataController(DatabaseManager.Database);
    // middlewares
    app.use(logging('combined'));
    app.use(bodyParser());
    app.use(staticFile('./public/'));

    app.keys = ['secret'];
    app.use(session({store: new RedisStore('vismooc', DatabaseManager.CacheDatabase) }));

    app.use(getCourseRouters.routes());
    app.use(getVideoRouters.routes());
    app.use(getForumRouters.routes());
    return app;
}
