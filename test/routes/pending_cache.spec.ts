import test from 'ava';
import * as Koa from 'koa';
import * as Router from 'koa-router';
import * as request from 'supertest';
import DatabaseManager from '../../src/database/databaseManager';
import cacheRouter from '../../src/routes/pending_cache';
/*
interface RouteTestContext {
    app: Koa;
}
*/

const mockUserData = {
    name: 'ming',
    age: 18,
};

const mockInfoData = {
    length: 20,
    content: 'aaaaaaaaaabbbbbbbbbb',
};

const errMiddleware = async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        // will only respond with JSON
        ctx.status = err.statusCode || err.status || 500;
        ctx.response.status = ctx.status;
        ctx.body = {
            message: err.message,
        };
    }
};

const mockRouter: Router = new Router()
    .get('/getUser', async (ctx, next) => {
        ctx.body = mockUserData;
        await next();
    })
    .get('/getInfo', async (ctx, next) => {
        ctx.body = mockInfoData;
        await next();
    });

test.beforeEach('New a koa server', (t) => {
    // do nothing
});

test.serial('Cache Module#Availability', async (t) => {
    const app: Koa = new Koa();
    app.use(errMiddleware);
    app.use(cacheRouter.routes());
    app.use(mockRouter.routes());

    const req = request(app.listen());
    let res = await req.get('/getUser');
    t.notDeepEqual(res.body, mockUserData, 'You will get the wrong result before initializing the cacheDatabase');

    await DatabaseManager.initCacheDatabase();
    res = await req.get('/getUser');
    t.deepEqual(res.body, mockUserData, 'You will get the result after initializing the cacheDatabase');
});

test.serial('Cache Module#Correctness', async (t) => {
    const appCached: Koa = new Koa();
    appCached.use(errMiddleware);
    appCached.use(cacheRouter.routes());
    appCached.use(mockRouter.routes());

    const appNoCache: Koa = new Koa();
    appNoCache.use(errMiddleware);
    appNoCache.use(mockRouter.routes());

    const req = request(appCached.listen());
    const reqNoCache = request(appNoCache.listen());
    await DatabaseManager.initCacheDatabase();
    let res = await req.get('/getUser');
    let resNoCache = await reqNoCache.get('/getUser');
    t.deepEqual(res.body, resNoCache.body, 'You will get the same result using both two server');

    res = await req.get('/getInfo');
    resNoCache = await reqNoCache.get('/getInfo');
    t.deepEqual(res.body, resNoCache.body, 'You will get the same result using both two server');

    res = await req.get('/getASDFGHJK');
    resNoCache = await reqNoCache.get('/getASDFGHJK');
    t.deepEqual(res.body, resNoCache.body, 'You will get the same result using both two server');
});

test.serial('Cache Module#Hit Cache', async (t) => {
    const appCached: Koa = new Koa();
    appCached.use(errMiddleware);
    appCached.use(cacheRouter.routes());
    appCached.use(mockRouter.routes());

    const appOnlyCache: Koa = new Koa();
    appOnlyCache.use(errMiddleware);
    appOnlyCache.use(cacheRouter.routes());

    const req = request(appCached.listen());
    const reqOnlyCache = request(appOnlyCache.listen());
    await DatabaseManager.initCacheDatabase();
    let res = await req.get('/getUser');
    let resOnlyCache = await reqOnlyCache.get('/getUser');
    t.deepEqual(res.body, resOnlyCache.body, 'You will get the same result using both two server');

    res = await req.get('/getInfo');
    resOnlyCache = await reqOnlyCache.get('/getInfo');
    t.deepEqual(res.body, resOnlyCache.body, 'You will get the same result using both two server');

    res = await req.get('/getASDFGHJK');
    resOnlyCache = await reqOnlyCache.get('/getASDFGHJK');
    t.deepEqual(res.body, resOnlyCache.body, 'You will get the same result using both two server');
});
