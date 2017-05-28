import test from 'ava';
import * as Koa from 'koa';
import augmentContext from '../../../src/middlewares/passport/augmentContex';
import { MockReq, MockRes } from '../../testUtils';

interface TestContext {
    app: Koa;
    ctx: Koa.Context;
}

function MockSession(ctx) {
    ctx.session = {
        passport: {
            user: null,
        },
    };
}

function MockPassport(ctx) {

    ctx.passport = {
        UserProperty: 'user',
        serializeUser: () => ({}),
    };

}

test.beforeEach('init context', (t) => {
    const app: Koa = new Koa();
    augmentContext(app.context);
    const ctx = app.createContext(new MockReq(), new MockRes());
    t.context = {
        app,
        ctx,
    };
});

test('augmentContext#login', async (t) => {
    const { ctx } = t.context as TestContext;
    const userId = 'userId';
    const user = { userId };
    await t.throws(ctx.login(user), 'passport.initialize() middleware not in use',
        'should throw error if no passport');
    MockPassport(ctx);
    ctx.passport.serializeUser = () => Promise.reject(new Error('serializeUser error'));
    await t.throws(ctx.login(user), 'serializeUser error', 'should throw error if serializeUser throw error');
    t.is(ctx.state[ctx.passport.UserProperty], null, 'should set the userProperty of ctx.state to null');
    ctx.passport.serializeUser = (u) => Promise.resolve(u);
    await t.throws(ctx.login(user), 'Should use session middleware before passport middleware',
        'should throw error if no session');
    MockSession(ctx);
    await ctx.login(user);
    t.deepEqual(ctx.session.passport.user, user, 'should assign the serializeUser to passport in session');
    t.deepEqual(ctx.state[ctx.passport.UserProperty], user, 'should assign the user to ctx.state');
});

test('augmentContext#logout', async (t) => {
    const { ctx } = t.context as TestContext;
    t.falsy(ctx.logout(), 'should do nothing if no passport or no session middleware');
    MockPassport(ctx);
    t.falsy(ctx.logout(), 'should do nothing if no session middleware');
    MockSession(ctx);
    ctx.state[ctx.passport.UserProperty] = { something: 'something' };
    ctx.logout();
    t.is(ctx.state[ctx.passport.UserProperty], null, 'the userProperty of ctx.state should be null after logout');
    ctx.session.passport.user = { something: 'something' };
    ctx.logout();
    t.is(ctx.passport.User, undefined, 'the user property of ctx.passport should be null after logout');
});

test('augmentContext#isAuthenticated', (t) => {
    const { ctx } = t.context as TestContext;
    t.false(ctx.isAuthenticated(), 'it should be false if no passport middleware');
    MockPassport(ctx);
    MockSession(ctx);
    t.false(ctx.isAuthenticated(), 'it should be false if UserProperty in ctx.state is falsy');

    ctx.login({ user: 'a user' });
    t.true(ctx.isAuthenticated(), 'it should be true if the user has logined');
});

test('augmentContext#isUnauthenticated', (t) => {
    const { ctx } = t.context as TestContext;
    t.true(ctx.isUnauthenticated(), 'it should be true if no passport middleware');
    MockPassport(ctx);
    MockSession(ctx);
    t.true(ctx.isUnauthenticated(), 'it should be true if UserProperty in ctx.state is falsy');

    ctx.login({ user: 'a user' });
    t.false(ctx.isUnauthenticated(), 'it should be false if the user has logined');
});

test('augmentContext#augmentTwice', (t) => {
    const { app } = t.context as TestContext;
    t.is(augmentContext(app.context), undefined, 'should ignore the second augmentation');
});
