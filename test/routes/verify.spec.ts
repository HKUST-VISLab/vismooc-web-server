import test from 'ava';
import * as Koa from 'koa';
import * as request from 'supertest';
import { Logger, transports } from 'winston';
import verifyRouter from '../../src/routes/verify';

interface TestContext {
    app: Koa;
}

test.beforeEach('New a koa server', async (t) => {
    const app: Koa = new Koa();
    app.use(errMiddleware);
    app.use(verifyRouter.routes());
    app.use(async (ctx, next) => {
        if (!ctx.body) {
            ctx.body = 'no need to verify';
        }
        await next();
    });
    // loger
    app.context.logger = new Logger({
        level: 'debug',
        transports: [
            new (transports.Console)(),
        ],
    });
    t.context = {
        app,
    };
});

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

test('VerifyRouter#verify without permissions', async (t) => {
    const { app } = t.context as TestContext;
    const req = request(app.listen());
    const NoPermissionMessage = 'No Permission_1';
    const NoPermissionMessage2 = 'No Permission_2';
    (app.context as any).session = {
        passport: null,
    };
    let res = await req.get('/testVerify');
    t.is(res.text, NoPermissionMessage, 'should return the no permission message');

    (app.context as any).session = {
        passport: {
            user: null,
        },
    };
    res = await req.get('/testVerify');
    t.is(res.text, NoPermissionMessage, 'should return the no permission message');

    (app.context as any).session = {
        passport: {
            user: {
                permissions: null,
            },
        },
    };
    res = await req.get('/testVerify');
    t.is(res.text, NoPermissionMessage, 'should return the no permission message');

    (app.context as any).session = {
        passport: {
            user: {
                permissions: {'HKPOLYU+IL1001+2016_Q4_R0': 'test'},
            },
        },
    };
    res = await req.get('/testVerify').query({
        courseId: 'HKPOLYU+IL1001+2016_Q4_R5',
    });
    t.is(res.text, NoPermissionMessage2, 'have no permission on this course');

    res = await req.get('/testVerify').query({
        courseId: 'HKPOLYU IL1001 2016 Q4 R7',
    });
    t.is(res.text, NoPermissionMessage2, 'have no permission on this course');

    res = await req.get('/testVerify').query({
    });
    t.is(res.text, 'no need to verify', 'have no permission on this course');
});

test('VerifyRouter#verify with permissions', async (t) => {
    const { app } = t.context as TestContext;
    const req = request(app.listen());
    (app.context as any).session = {
        passport: {
            user: {
                permissions: {'HKPOLYU+IL1001+2016_Q4_R0': 'test'},
            },
        },
    };
    const res = await req.get('/testVerify').query({
        courseId: 'HKPOLYU+IL1001+2016_Q4_R0',
    });
    t.is(res.text, 'no need to verify', 'should return the permission message');
});
