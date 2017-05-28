import test from 'ava';
import * as Koa from 'koa';
import * as request from 'supertest';
import session, { CONNECT, DISCONNECT, MemoryStore } from '../../../src/middlewares/session';
import { uidSync } from '../../../src/utils';

interface SessionTestContext {
    app: Koa;
}

test.beforeEach('New a koa server', (t) => {
    const app: Koa = new Koa();
    app.keys = ['keys', 'keykeys'];
    app.proxy = true; // to support `X-Forwarded-*` header
    app.use(async (ctx, next) => {
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
    });

    t.context = { app };
});

test('Session Module#use', async (t) => {
    const { app } = t.context as SessionTestContext;
    // config koa app
    app.use(async (ctx, next) => {
        if (ctx.request.query.force_session_id) {
            ctx.sessionId = ctx.request.query.force_session_id;
        }
        await next();
    });
    app.use(session({
        key: 'koss:test_sid',
        reconnectTimeout: 1000,
        cookieOptions: {
            maxAge: 86400,
            path: '/session',
            signed: true,
        },
        beforeSave(ctx, session) {
            (session as any).path = ctx.path;
        },
        valid(ctx, session) {
            return ctx.query.valid !== 'false';
        },
        genSid(ctx: Koa.Context, len: number) {
            return uidSync(len) + (ctx.request.query.test_sid_append || '');
        },
    }));
    app.use(session({
        cookieOptions: {
            path: '/session',
            signed: true,
        },
    }));
    app.use(async (ctx, next) => {
        switch (ctx.request.path) {
            case '/session/get': {
                const tempSession = ctx.session as any;
                tempSession.count = tempSession.count || 0;
                ctx.body = { data: ++tempSession.count };
                break;
            }
            case '/session/rewrite': {
                ctx.session = { cookie: { signed: false } };
                ctx.body = ctx.session;
                break;
            }
            case '/session/httponly': {
                const httpOnly = ctx.session.cookie.httpOnly;
                ctx.session.cookie.httpOnly = !httpOnly;
                ctx.body = { data: `httpOnly: ${!httpOnly}` };
                break;
            }
            case '/session/nothing': {
                ctx.body = { data: (ctx.session as any).count };
                break;
            }
            case '/wrongpath': {
                ctx.body = { data: !ctx.session ? 'no session' : 'has session' };
                break;
            }
            case '/session/id': {
                ctx.body = ctx.sessionId;
                break;
            }
            case '/session/remove': {
                ctx.session = null;
                ctx.body = { data: 0 };
                break;
            }
            case '/session/regenerate': {
                await ctx.regenerateSession();
                // ctx.session.data = "foo";
                ctx.body = ctx.sessionId;
                break;
            }
            case '/session/regenerateWithData': {
                (ctx.session as any).foo = 'bar';
                await ctx.regenerateSession();
                ctx.body = { foo: (ctx.session as any).foo, hasSession: ctx.session !== undefined };
                break;
            }
            case '/session/get_error': {
                (ctx.session as any).count = (ctx.session as any).count || 0;
                (ctx.session as any).count++;
                throw new Error('oops');
            }
            default: {
                ctx.body = { data: ctx.session !== undefined ? 'has session' : 'no session' };
            }
        }
        await next();
    });

    const req = request(app.listen());
    const mockCookie = 'koa.sid=s:dsfdss.PjOnUyhFG5bkeHsZ1UbEY7bDerxBINnZsD5MUguEph8; path=/; httponly';

    let res = await req.get('/session/get').set('Content-Type', 'text/*');
    t.is(res.body.data, 1, 'it should GET /session/get ok');
    let cookie: string = res.header['set-cookie'].join('; ');

    res = await req.get('/session/get').set('cookie', cookie);
    t.is(res.body.data, 2, 'should GET /session/get second ok');

    res = await req.get('/session/httponly').set('cookie', cookie);
    t.is(res.body.data, 'httpOnly: false', 'should GET /session/httponly ok, 1st false');
    cookie = res.header['set-cookie'].join('; ');
    t.is(cookie.indexOf('httponly'), -1, 'it should has no httponly');
    t.truthy(cookie.indexOf('expires=') > 0, 'the index of expires should above 0');

    res = await req.get('/session/get').set('cookie', cookie);
    t.is(res.body.data, 3, 'it shoud GET /session/get third ok');

    res = await req.get('/session/httponly').set('cookie', cookie);
    t.deepEqual(res.body.data, 'httpOnly: true', 'should GET /session/httonly ok, 2ed true');
    cookie = res.header['set-cookie'].join('; ');
    t.truthy(cookie.indexOf('httponly') > 0, 'the index of httponly should above 0');
    t.truthy(cookie.indexOf('expires=') > 0, 'the index of expires= should above 0');

    res = await req.get('/session/get');
    t.is(res.body.data, 1, 'should another user GET /session/get ok');

    res = await req.get('/session/nothing').set('cookie', cookie);
    t.is(res.body.data, 3, 'it should GET /session/nothing ok');

    res = await req.get('/session/get').set('cookie', mockCookie);
    t.is(res.body.data, 1, 'it should wrong cookie GET /session/get ok');

    res = await req.get('/session/get').set('cookie', mockCookie);
    t.is(res.body.data, 1, 'it should wrong cookie GET /session/get twice ok');

    res = await req.get('/wrongpath').set('cookie', cookie);
    t.is(res.body.data, 'no session', 'it should GET /wrongpath response no session');

    res = await req.get('/session/remove').set('cookie', cookie);
    t.is(res.body.data, 0, 'should GET /session/remove ok');
    res = await req.get('/session/get').set('cookie', cookie);
    t.is(res.body.data, 1, 'should GET /session/remove ok 2');

    res = await req.get('/');
    t.is(res.body.data, 'no session', 'should GET / error by session ok');

    res = await req.get('/session');
    t.is(res.body.data, 'has session', 'should GET /session ok');

    res = await req.get('/session/rewrite');
    t.deepEqual(res.body, { cookie: { signed: false }, path: '/session/rewrite' },
        'should rewrite session before get ok');

    res = await req.get('/session/get');
    t.is(res.body.data, 1, 'should regenerate a new session when session invalid 1');
    res = await req.get('/session/nothing?valid=false');
    t.deepEqual(res.body.data, undefined, 'should regenerate a new session when session invalid 2');
    res = await req.get('/session/get');
    t.is(res.body.data, 1, 'should regenerate a new session when session invalid 3');

    res = await req.get('/session/id?test_sid_append=test');
    t.truthy(res.text.match(/test$/), 'should GET /session/id ok');
    res = await req.get('/session/get');
    cookie = res.header['set-cookie'].join('; ');
    const val = cookie.split(';')[0].split('=')[1];
    res = await req.get('/session/id?force_session_id=' + val);
    t.truthy(res.text.match(new RegExp(val)), 'should force a session id ok');

    res = await req.get('/session/get');
    cookie = res.header['set-cookie'].join('; ');
    const firstId = res.text;
    res = await req.get('/session/regenerate').set('cookie', cookie);
    t.notDeepEqual(res.text, firstId, 'should regenerate existing sessions');

    res = await req.get('/session/regenerateWithData');
    t.deepEqual(res.body, { hasSession: true }, 'should regenerate a new session');

    res = await req.get('/session/get_error');
    t.is(res.status, 500, 'should get error');
    cookie = res.header['set-cookie'].join('; ');
    t.truthy(cookie);
    res = await req.get('/session/get').set('cookie', cookie);
    t.is(res.body.data, 2, 'should always refreshSession');
});

test('Session Module#override', async (t) => {
    const { app } = t.context as SessionTestContext;
    app.use(session({
        key: 'koss:test_sid',
        reconnectTimeout: 1000,
        cookieOptions: {
            maxAge: 86400,
            path: '/session',
            signed: true,
        },
        rolling: false,
    }));
    app.use(async (ctx, next) => {
        switch (ctx.request.path) {
            case '/session/read/force':
                ctx.sessionSave = true;
            case '/session/read': {
                (ctx.session as any).count = (ctx.session as any).count || 0;
                ctx.body = { data: (ctx.session as any).count };
                break;
            }
            case '/session/update/prevent':
                ctx.sessionSave = false;
            case '/session/update': {
                (ctx.session as any).count = (ctx.session as any).count || 0;
                (ctx.session as any).count++;
                ctx.body = { data: (ctx.session as any).count };
                break;
            }
            case '/session/remove/prevent': {
                ctx.sessionSave = false;
                ctx.session = null;
                ctx.body = { data: 0 };
                break;
            }
            case '/session/remove/force': {
                ctx.sessionSave = true;
                ctx.session = null;
                ctx.body = { data: 0 };
                break;
            }
        }
        ctx.body.save = ctx.sessionSave;
        await next();
    });

    const req = request(app.listen());
    let res = await req.get('/session/update');
    t.is(res.body.data, 1, 'should get /session/update ok');
    const cookie: string = res.header['set-cookie'].join('; ');

    res = await req.get('/session/update').set('cookie', cookie);
    t.is(res.body.data, 2, 'should get the session success');
    t.is(res.body.save, null, 'should get the sessionSave as null');
    res = await req.get('/session/read').set('cookie', cookie);
    t.is(res.body.data, 2, 'should save modified session');
    t.is(res.body.save, null, 'should save modified session');
    t.falsy(res.header['set-cookie'], 'should save modified session');

    res = await req.get('/session/update/prevent').set('cookie', cookie);
    t.is(res.body.data, 3, 'should prevent saving modified session');
    t.false(res.body.save, 'should prevent saving modified session');
    res = await req.get('/session/read').set('cookie', cookie);
    t.is(res.body.data, 2, '/read should prevent saving modified session');
    t.is(res.body.save, null, '/read should prevent saving modified session');
    t.falsy(res.header['set-cookie'], 'should prevent saving modified session');

    res = await req.get('/session/read/force').set('cookie', cookie);
    t.is(res.body.data, 2, 'should force saving unmodified session');
    t.true(res.body.save, 'should force saving unmodified session');
    res = await req.get('/session/read').set('cookie', cookie);
    t.is(res.body.data, 2, 'should force saving unmodified session');
    t.is(res.body.save, null, 'should force saving unmodified session');
    t.falsy(res.header['set-cookie'], 'should prevent saving modified session');

    res = await req.get('/session/remove/prevent').set('cookie', cookie);
    t.is(res.body.data, 0, 'should prevent deleting session');
    t.false(res.body.save, 'should prevent deleting session');
    res = await req.get('/session/read').set('cookie', cookie);
    t.is(res.body.data, 2, 'should not have fresh session');
    t.is(res.body.save, null, 'should not have fresh session');
    t.falsy(res.header['set-cookie'], 'should prevent deleting session');

    res = await req.get('/session/remove/force').set('cookie', cookie);
    t.is(res.body.data, 0, 'should delete session on force-save');
    t.true(res.body.save, 'should delete session on force-save');
    res = await req.get('/session/read').set('cookie', cookie);
    t.is(res.body.data, 0, 'should have fresh session');
    t.is(res.body.save, null, 'should have fresh session');
    t.truthy(res.header['set-cookie'], 'should have fresh session');
});

test('Session Module#rolling', async (t) => {
    const { app } = t.context as SessionTestContext;
    app.use(session({
        key: 'koss:test_sid',
        reconnectTimeout: 1000,
        cookieOptions: {
            maxAge: 86400,
            path: '/session',
            signed: true,
        },
        rolling: true,
    }));
    app.use(async (ctx, next) => {
        switch (ctx.request.path) {
            case '/session/get': {
                (ctx.session as any).count = (ctx.session as any).count || 0;
                (ctx.session as any).count++;
                ctx.body = { data: (ctx.session as any).count };
                break;
            }
            case '/session/remove': {
                ctx.session = null;
                ctx.body = { data: 0 };
                break;
            }
            default: {
                ctx.body = 'do nothing';
            }
        }
        await next();
    });

    const req = request(app.listen());
    let res = await req.get('/session/get');
    t.is(res.body.data, 1, 'init');
    const cookie = res.header['set-cookie'].join('; ');

    res = await req.get('/session/get').set('cookie', cookie);
    t.is(res.body.data, 2, 'should get the session ok');

    res = await req.get('/session/remove').set('cookie', cookie);
    t.is(res.body.data, 0, 'should remove session success 0');
    res = await req.get('/session/get').set('cookie', cookie);
    t.is(res.body.data, 1, 'should remove session success 1');

    res = await req.get('/session/nothing').set('cookie', cookie);
    t.truthy(res.header['set-cookie'], 'when not modify session and session exists get set-cookie');

    res = await req.get('/session/nothing');
    t.falsy(res.header['set-cookie'], 'session does not exists dont\'t get set-cookie');
});

test('Session Module#defer', async (t) => {
    const { app } = t.context as SessionTestContext;
    app.use(session({
        key: 'koss:test_defer_sid',
        reconnectTimeout: 1000,
        cookieOptions: {
            maxAge: 779700,
            path: '/session',
            signed: false,
        },
        defer: true,
    }));
    app.use(session({
        key: 'koss:test_sid',
        cookieOptions: {
            maxAge: 86400,
            path: '/session',
            signed: true,
        },
        defer: true,
    }));

    app.use(async (ctx, next) => {
        switch (ctx.request.path) {
            case '/session/rewrite': {
                ctx.session = { cookie: { signed: false } };
                ctx.body = await ctx.session;
                break;
            }
            case '/session/get': {
                const tempSession = await ctx.session as any;
                tempSession.count = tempSession.count || 0;
                ctx.body = { data: ++tempSession.count };
                break;
            }
            case '/session/nothing': {
                ctx.body = { data: (await ctx.session as any).count };
                break;
            }
            case '/session/remove': {
                ctx.session = null;
                ctx.body = { data: 0 };
                break;
            }
            case '/session/httponly': {
                const session = await ctx.session;
                const httpOnly = session.cookie.httpOnly;
                session.cookie.httpOnly = !httpOnly;
                ctx.body = { data: `httpOnly: ${!httpOnly}` };
                break;
            }
            case '/session/changepath': {
                ctx.request.path = '/wrongpath';
                ctx.body = await ctx.session;
                break;
            }
            case '/session/regenerate': {
                await ctx.regenerateSession();
                // ctx.session.data = "foo";
                ctx.body = ctx.sessionId;
                break;
            }
            case '/session/regenerateWithData': {
                const session = await ctx.session;
                (session as any).foo = 'bar';
                await ctx.regenerateSession();
                ctx.body = { foo: (session as any).foo, hasSession: session !== undefined };
                break;
            }
            case '/session/notuse': {
                ctx.body = { data: 'no session' };
                break;
            }
            case '/wrongpath':
            default: {
                ctx.body = { data: await ctx.session ? 'has session' : 'no session' };
            }
        }
        await next();
    });

    const req = request(app.listen(7797));
    const mockCookie = 'koa.sid=s:dsfdss.PjOnUyhFG5bkeHsZ1UbEY7bDerxBINnZsD5MUguEph8; path=/; httponly';
    let res = await req.get('/session/get');
    let cookie = res.header['set-cookie'].join('; ');
    t.is(res.body.data, 1, 'should get session ok 1');

    res = await req.get('/session/get').set('cookie', cookie);
    t.is(res.body.data, 2, 'should get session ok 2');

    res = await req.get('/session/httponly').set('cookie', cookie);
    t.deepEqual(res.body.data, 'httpOnly: false', 'should GET /session/httponly false');
    cookie = res.header['set-cookie'].join('; ');
    t.is(cookie.indexOf('httponly'), -1, 'the httponly in cookie should be -1');
    t.truthy(cookie.indexOf('expires=') > 0, 'the expires in cookie should not be -1');
    res = await req.get('/session/get').set('cookie', cookie);
    t.is(res.body.data, 3, 'should get the session ok 3');

    res = await req.get('/session/httponly').set('cookie', cookie);
    t.deepEqual(res.body.data, 'httpOnly: true', 'should GET /session/httponly twice ok');
    cookie = res.header['set-cookie'].join('; ');
    t.truthy(cookie.indexOf('httponly') > 0, 'the httponly in cookie should not be -1');
    t.truthy(cookie.indexOf('expires=') > 0, 'the expires in cookie should not be -1');

    res = await req.get('/session/get');
    t.deepEqual(res.body.data, 1, 'should another user GET /session/get ok');

    res = await req.get('/session/nothing').set('cookie', cookie);
    t.deepEqual(res.body.data, 3, 'should GET /session/nothing ok');

    res = await req.get('/session/notuse').set('cookie', cookie);
    t.deepEqual(res.body.data, 'no session', 'should GET /session/notuse response no session');

    res = await req.get('/wrongpath').set('cookie', cookie);
    t.deepEqual(res.body.data, 'no session', 'should GET /wrongpath response no session');

    res = await req.get('/session/get').set('cookie', mockCookie);
    t.deepEqual(res.body.data, 1, 'should wrong cookie GET /session/get ok');

    res = await req.get('/session/get').set('cookie', mockCookie);
    t.deepEqual(res.body.data, 1, 'should wrong cookie GET /session/get twice ok');

    res = await req.get('/session/remove').set('cookie', cookie);
    t.deepEqual(res.body.data, 0, 'should GET /session/remove ok');
    res = await req.get('/session/get').set('cookie', cookie);
    t.deepEqual(res.body.data, 1, 'should GET /session/remove ok 1');

    res = await req.get('/');
    t.deepEqual(res.body.data, 'no session', 'should GET / error by session ok');

    res = await req.get('/session');
    t.deepEqual(res.body.data, 'has session', 'should GET /session ok');

    res = await req.get('/session/remove');
    t.deepEqual(res.body.data, 0, 'should GET /session/remove before get ok');

    res = await req.get('/session/rewrite');
    t.deepEqual(res.body, { cookie: { signed: false } }, 'should rewrite session before get ok');

    const agent = request.agent(app.listen());
    res = await agent.get('/session/get');
    const firstId = res.body.data;
    res = await agent.get('/session/regenerate');
    t.notDeepEqual(res.body.data, firstId, 'should regenerate existing sessions');

    res = await req.get('/session/regenerateWithData');
    t.deepEqual(res.body, { foo: 'bar', hasSession: true }, 'should regenerate new sessions');

    res = await req.get('/session/changepath').set('cookie', cookie);
    t.deepEqual(res.body, {}, 'should get undefined of session');
});

test('Session Module#store', async (t) => {
    const { app } = t.context as SessionTestContext;
    const store = new MemoryStore();
    // config koa app
    app.use(session({
        key: 'koss:test_sid',
        reconnectTimeout: 100,
        cookieOptions: {
            maxAge: 86400,
            path: '/session',
            signed: true,
        },
        store,
    }));
    app.use(async (ctx, next) => {
        switch (ctx.request.path) {
            case '/session/get': {
                const tempSession = ctx.session as any;
                tempSession.count = tempSession.count || 0;
                ctx.body = { data: ++tempSession.count };
                break;
            }
            case '/session/get_error': {
                (ctx.session as any).count = (ctx.session as any).count || 0;
                (ctx.session as any).count++;
                throw new Error('oops');
            }
            case '/session/notuse': {
                ctx.body = { data: 'notuse' };
                break;
            }
            case '/session/regenerate': {
                await ctx.regenerateSession();
                // ctx.session.data = "foo";
                ctx.body = ctx.sessionId;
                break;
            }
            default: {
                ctx.body = { data: ctx.session !== undefined ? 'has session' : 'no session' };
            }
        }
        await next();
    });

    const req = request(app.listen());
    store.emit(DISCONNECT);
    let res = await req.get('/session/get');
    t.is(res.status, 500, 'should get session error when disconnect');
    t.deepEqual(res.body.message, 'timeout:session store is unavailable',
        'should get session error when disconnect, message');
    store.emit(CONNECT);

    t.truthy(store.listenerCount(DISCONNECT) > 0, 'should listen disconnect event');
    t.truthy(store.listenerCount(CONNECT) > 0, 'should listen connect event');

    store.emit(DISCONNECT);
    setTimeout(() => store.emit(CONNECT), 10);
    res = await req.get('/session/get');
    t.is(res.status, 200, 'should get session ok when reconnect');
    t.is(res.body.data, 1, 'should get session ok when reconnect 1');
    store.emit(CONNECT);

    store.emit(DISCONNECT);
    store.emit(DISCONNECT);
    res = await req.get('/session/get');
    t.is(res.status, 500, 'should ignore disconnect event');
    t.deepEqual(res.body.message, 'timeout:session store is unavailable', 'should be still unavailable');
    store.emit(CONNECT);

    store.emit(DISCONNECT);
    res = await req.get('/session/get');
    t.is(res.status, 500, 'should error when status is unavailable');
    res = await req.get('/session/get');
    t.deepEqual(res.body.message, 'session store is unavailable', 'should be unavailable');
    store.emit(CONNECT);

    const tempStoreGet = store.get;
    store.get = () => {
        throw new Error('get error');
    };
    res = await req.get('/session/get');
    t.is(res.body.data, 1, 'should get session ok when store.get error but session does not exist');
    let cookie = res.header['set-cookie'].join('; ');
    t.truthy(cookie.indexOf('httponly') > 0, 'the httponly in cookie should not be -1');
    t.truthy(cookie.indexOf('expires=') > 0, 'the expires in cookie should not be -1');
    res = await req.get('/session/get').set('cookie', cookie);
    t.is(res.status, 500, 'should get session error when store.get error and session exists');

    res = await req.get('/session/notuse').set('cookie', cookie);
    t.is(res.status, 500, 'should get /session/notuse error when store.get error');

    store.get = tempStoreGet;
    res = await req.get('/session/get').set('cookie', cookie);
    t.is(res.status, 200, 'should get session ok 2');
    t.is(res.body.data, 2, 'should get session ok 2');
    const tempStoreSet = store.set;
    store.set = () => {
        throw new Error('set error');
    };
    res = await req.get('/session/get').set('cookie', cookie);
    t.is(res.status, 500, 'should handler session error when store.set error');
    t.deepEqual(res.body.message, 'set error', 'should handler session error when store.set error');

    res = await req.get('/session/get_error');
    t.is(res.status, 500, 'should handler session error when store.set error and logic error');
    t.deepEqual(res.body.message, 'oops', 'should handler session error when store.set error and logic error');
    store.set = tempStoreSet;

    res = await req.get('/session/get');
    cookie = res.header['set-cookie'].join('; ');
    const firstId = res.text;
    res = await req.get('/session/regenerate').set('cookie', cookie);
    t.notDeepEqual(res.text, firstId, 'should regenerate existing sessions');
    t.falsy(await store.get(firstId), 'the first session should be destroied');
});

test('Session Module#store with defer', async (t) => {
    const { app } = t.context as SessionTestContext;
    const store = new MemoryStore();
    app.use(session({
        key: 'koss:test_sid',
        reconnectTimeout: 100,
        cookieOptions: {
            maxAge: 86400,
            path: '/session',
            signed: true,
        },
        store,
        defer: true,
    }));
    app.use(async (ctx, next) => {
        switch (ctx.request.path) {
            case '/session/get': {
                const tempSession = await ctx.session as any;
                tempSession.count = tempSession.count || 0;
                ctx.body = { data: ++tempSession.count };
                break;
            }
            case '/session/notuse': {
                ctx.body = { data: 'no session' };
                break;
            }
            default: {
                ctx.body = { data: await ctx.session ? 'has session' : 'no session' };
            }
        }
        await next();
    });

    const req = request(app.listen());

    store.emit(DISCONNECT);
    let res = await req.get('/session/get');
    t.is(res.status, 500, 'should get session error when disconnect');
    t.deepEqual(res.body.message, 'timeout:session store is unavailable',
        'should get session error when disconnect, message');
    store.emit(CONNECT);

    const tempStoreGet = store.get;
    store.get = () => {
        throw new Error('get error');
    };
    res = await req.get('/session/get');
    t.is(res.body.data, 1, 'should get session ok when store.get error but session does not exist');
    const cookie = res.header['set-cookie'].join('; ');
    t.truthy(cookie.indexOf('httponly') > 0, 'the httponly in cookie should not be -1');
    t.truthy(cookie.indexOf('expires=') > 0, 'the expires in cookie should not be -1');
    res = await req.get('/session/get').set('cookie', cookie);
    t.is(res.status, 500, 'should get session error when store.get error and session exists');

    res = await req.get('/session/notuse').set('cookie', cookie);
    t.is(res.status, 200, 'should get /session/notuse ok when store.get error');

    store.get = tempStoreGet;
    res = await req.get('/session/get').set('cookie', cookie);
    t.is(res.status, 200, 'should get session ok 2');
    t.is(res.body.data, 2, 'should get session ok 2');
    store.set = () => {
        throw new Error('set error');
    };
    res = await req.get('/session/get').set('cookie', cookie);
    t.is(res.status, 500, 'should handler session error when store.set error');
    t.deepEqual(res.body.message, 'set error', 'should handler session error when store.set error');

});

test('Session Module#Default Options', async (t) => {
    const { app } = t.context as SessionTestContext;
    app.use(session());
    app.use(async (ctx, next) => {
        switch (ctx.request.path) {
            case '/session/get': {
                const tempSession = ctx.session as any;
                tempSession.count = tempSession.count || 0;
                ctx.body = { data: ++tempSession.count };
                break;
            }
            case '/session/null': {
                ctx.session = null;
                break;
            }
            default: {
                ctx.body = { data: ctx.session !== undefined ? 'has session' : 'no session' };
            }
        }
        await next();
    });

    const req = request(app.listen());
    let res = await req.get('/session/get');
    t.is(res.body.data, 1, 'it should GET /session/get ok');
    const cookie: string = res.header['set-cookie'].join('; ');

    res = await req.get('/session/get').set('cookie', cookie);
    t.is(res.body.data, 2, 'it should GET /session/get ok 2ed');

    // const tempWarn = console.warn;
    // let warnCount = 0;
    // console.warn = () => ++warnCount;
    res = await req.get('/session/null');
    // t.is(res.status, 500, "get undefined will triggle a logic error");
    // t.is(warnCount, 1, "Triggle console.warn onece");
    // console.warn = tempWarn;
});
