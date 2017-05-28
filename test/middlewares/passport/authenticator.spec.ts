import test from 'ava';
import * as http from 'http';
import * as Koa from 'koa';
import { Passport } from '../../../src/middlewares/passport';
import {
    AuthenticationError,
} from '../../../src/middlewares/passport/authenticationerror';
import {
    AuthenticateOption,
} from '../../../src/middlewares/passport/authenticator';
import { ActionType } from '../../../src/middlewares/passport/strategies';
import {
//    BaseAction,
    BaseStrategy,
    FailAction,
    PassAction,
    RedirectAction,
    SuccessAction,
} from '../../../src/middlewares/passport/strategies/base';
import { MockReq, MockRes } from '../../testUtils';

interface TestContext {
    app: Koa;
    ctx: Koa.Context;
}

class MockStrategy extends BaseStrategy {
    constructor(public returnType: ActionType = ActionType.PASS, protected actionParams: any = {}) {
        super();
        this.name = 'Mock';
    }

    public async authenticate(ctx: Koa.Context, options) {
        switch (this.returnType) {
            case ActionType.FAIL: {
                return new FailAction(this.actionParams.challenge, this.actionParams.status);
            }
            case ActionType.REDIRECT: {
                return new RedirectAction(this.actionParams.url, this.actionParams.status);
            }
            case ActionType.SUCCESS: {
                return new SuccessAction(this.actionParams.user, this.actionParams.info);
            }
            case ActionType.PASS:
            default: {
                return new PassAction();
            }

        }
    }
}

test.beforeEach('init app and ctx', (t) => {
    const app: Koa = new Koa();
    const ctx = app.createContext(new MockReq(), new MockRes());
    t.context = {
        app,
        ctx,
    };
});

test('Passport#constructor', async (t) => {
    const { app, ctx } = t.context as TestContext;
    const passport = new Passport(app.context);
    (ctx as any).session = {};
    ctx.passport = passport;
    let nextCount = 0;
    const next = () => {
        ++nextCount;
        return Promise.resolve({});
    };

    t.deepEqual(passport.UserProperty, 'user', 'default UserProperty should be \'user\'');
    t.deepEqual(passport.UserProperty, 'user', 'default UserProperty should be \'user\'');
    const middleware = passport.authenticate('session');
    await middleware(ctx, next);
    t.is(nextCount, 1, 'should invoke next middleware once');
});

test('Passport#use', async (t) => {
    const { app, ctx } = t.context as TestContext;
    const passport = new Passport(app.context);
    const strategy = new MockStrategy();
    let nextCount = 0;
    const next = () => {
        ++nextCount;
        return Promise.resolve({});
    };
    const strategyName = 'Mock';
    let middleware = passport.authenticate(strategyName);
    await t.throws(middleware(ctx, next), `Unknown authentication strategy "${strategyName}"`,
        'should throw an error if the strategy has not been registered');
    passport.use(strategy);
    await middleware(ctx, next);
    t.is(nextCount, 1, 'should invoke next middleware once');

    const strategy2 = new MockStrategy();
    const strategyName2 = 'Mock2';
    t.throws(() => passport.use(undefined, strategy2), 'Authentication strategies must have a name',
        'should throw a error that if strategies have no name');
    passport.use(strategyName2, strategy2);
    middleware = passport.authenticate([strategyName, strategyName2]);
    await middleware(ctx, next);
    t.is(nextCount, 2, 'should invoke next middleware once again');

    const user = {};
    passport.User = user;
    t.is(passport.User, user, 'should be the same object');
});

test('Passport#unuse', async (t) => {
    const { app, ctx } = t.context as TestContext;
    const passport = new Passport(app.context);
    const strategy = new MockStrategy();
    let nextCount = 0;
    const next = () => {
        ++nextCount;
        return Promise.resolve({});
    };
    const strategyName = 'Mock';
    passport.use(strategy);
    const middleware = passport.authenticate(strategyName);
    await middleware(ctx, next);
    t.is(nextCount, 1, 'should invoke next middleware once');

    t.is(passport.unuse(strategyName), passport, 'should return the passport');
    await t.throws(middleware(ctx, next), `Unknown authentication strategy "${strategyName}"`,
        'should throw a error if the strategy has not been registered');
});

test('Passport#initialize', async (t) => {
    const { app, ctx } = t.context as TestContext;
    const passport = new Passport(app.context);
    let nextCount = 0;
    const next = () => {
        ++nextCount;
        return Promise.resolve({});
    };
    const middleware = passport.initialize();
    await t.throws(middleware(ctx, next), 'Session middleware is needed with passport middleware!',
        'should throw a error if no session middleware');
    (ctx as any).session = {};
    await middleware(ctx, next);
    t.is(nextCount, 1, 'should call next middleware once');
    const pp = { user: 'foo' };
    const message = 'test';
    (ctx as any).session = { passport: pp, message };
    await middleware(ctx, next);
    t.is(nextCount, 2, 'should call next middleware once again');
});

test('Passport#authorize', async (t) => {
    const { app } = t.context as TestContext;
    const passport = new Passport(app.context);
    const tempAuthenticate = passport.authenticate;
    const strategyName = 'session';
    const options = {
        assignProperty: 'no account',
    };
    passport.authenticate = (s, o, callback?) => {
        t.deepEqual(s, strategyName, 'the strategyName should pass to authenticate');
        t.deepEqual(o, {assignProperty: 'account'}, 'should set assignProperty as account');
        return async (c, n) => {
            return true;
        };
    };
    passport.authorize(strategyName, options);
    passport.authorize(strategyName);
    // middleware()
    passport.authenticate = tempAuthenticate;
});

test('Passport#authenticate', async (t) => {
    const { app, ctx } = t.context as TestContext;
    const passport = new Passport(app.context);
    (ctx as any).session = {};
    ctx.passport = passport;
    let nextCount = 0;
    const next = () => {
        ++nextCount;
        return Promise.resolve({});
    };
    // const callback = (err: Error, user, info, status) => {

    // };
    // const middleware = passport.authenticate("", )

    t.deepEqual(passport.UserProperty, 'user', 'default UserProperty should be \'user\'');
    const middleware = passport.authenticate('session');
    await middleware(ctx, next);
    t.is(nextCount, 1, 'should invoke next middleware once');
});

test('Passport#authenticate, which all failed with specified status code, then redirect', async (t) => {
    const { app, ctx } = t.context as TestContext;
    const passport = new Passport(app.context);
    const strategy1Name = 'Mock1';
    const strategy1 = new MockStrategy(
        ActionType.FAIL,
        { challenge: { messages: 'strategy1 failed', type: 'failed' },
        status: 400 });
    const strategy2Name = 'Mock2';
    const strategy2 = new MockStrategy(
        ActionType.FAIL,
        { challenge: { messages: 'strategy2 failed', type: 'failed' },
        status: 401 });
    let nextCount = 0;
    const next = () => {
        ++nextCount;
        return Promise.resolve({});
    };

    passport.use(strategy1Name, strategy1);
    passport.use(strategy2Name, strategy2);
    const middleware = passport.authenticate([strategy1Name, strategy2Name]);
    (ctx as any).session = {message: {}};
    await middleware(ctx, next);
    t.is(nextCount, 0, 'counter should stay untouched');
    t.truthy(ctx.res.finished, ' response should complete since invoke `res.end()`');
    t.is(ctx.response.status, 400, ' response status code should match with the first failed one');
    t.deepEqual(ctx.response.message, http.STATUS_CODES[400],
        ' response status message should match with first failed one');

    const middleware1 = passport.authenticate(
        [strategy1Name, strategy2Name],
        {failureRedirect: 'redirect.org', failureMessage: true},
    );
    (ctx as any).session = {message: {}};
    await middleware1(ctx, next);
    t.truthy(ctx.session.message.failed instanceof Array, 'should be an array');
    t.is(ctx.session.message.failed.length, 1, 'should only contain one element');
    t.deepEqual(ctx.session.message.failed[0], 'strategy1 failed', 'should be the first failed message');
    t.is(ctx.response.status, 302, ' response status code should be 302');
    t.truthy(ctx.response.body.indexOf('redirect.org') !== -1, 'should include url');

    (ctx as any).session = {message: {failed: ['already exist failure']}};
    await middleware1(ctx, next);
    t.truthy(ctx.session.message.failed instanceof Array, 'should be an array');
    t.is(ctx.session.message.failed.length, 2, 'should only contain one element');
    t.deepEqual(ctx.session.message.failed[1], 'strategy1 failed', 'should be the first failed message');
    t.deepEqual(ctx.session.message.failed[0], 'already exist failure', 'should be the existing failed message');
    t.is(ctx.response.status, 302, ' response status code should be 302');
    t.truthy(ctx.response.body.indexOf('redirect.org') !== -1, 'should include url');
});

test('Passport#authenticate, which all failed with specified status code with callback', async (t) => {
    const { app, ctx } = t.context as TestContext;
    const passport = new Passport(app.context);
    let nextCount = 0;
    const next = () => {
        ++nextCount;
        return Promise.resolve({});
    };
    const strategy1Name = 'Mock1';
    const strategy1 = new MockStrategy(ActionType.FAIL, {challenge: 'strategy1 failed', status: 400});
    passport.use(strategy1Name, strategy1);
    let middleware = passport.authenticate(
        strategy1Name,
        (err, user, info, status) => {
            t.is(err, null, 'err should be null');
            t.false(user, 'user should be false');
            t.is(info, 'strategy1 failed', 'challenge 1 should be the same');
            t.is(status, 400, 'status 1 should be the same');
        }, undefined);
    await middleware(ctx, next);
    const strategy2Name = 'Mock2';
    const strategy2 = new MockStrategy(ActionType.FAIL, {challenge: 'strategy2 failed', status: 401});
    passport.use(strategy2Name, strategy2);
    middleware = passport.authenticate(
        [strategy1Name, strategy2Name],
        (err, user, info, status) => {
            t.is(err, null, 'err should be null');
            t.false(user, 'user should be false');
            t.is(info.length, 2, 'should be 2 fail challenge');
            t.is(info[0], 'strategy1 failed', 'challenge 1 should be the same');
            t.is(info[1], 'strategy2 failed', 'challenge 2 should be the same');
            t.is(status.length, 2, 'should be 2 fail statuses');
            t.is(status[0], 400, 'status 1 should be the same');
            t.is(status[1], 401, 'status 2 should be the same');
        });
    await middleware(ctx, next);
    t.is(nextCount, 0, 'counter should stay untouched');
});

test('Passport#authenticate, which all failed with default status code', async (t) => {
    const { app, ctx } = t.context as TestContext;
    const passport = new Passport(app.context);
    const strategy1Name = 'Mock1';
    const strategy1 = new MockStrategy(ActionType.FAIL, {challenge: 'strategy1 failed', status: undefined});
    const strategy2Name = 'Mock2';
    const strategy2 = new MockStrategy(ActionType.FAIL, {challenge: 1, status: undefined});
    const rchallange: string[] = ['strategy1 failed'];
    let nextCount = 0;
    const next = () => {
        ++nextCount;
        return Promise.resolve({});
    };

    passport.use(strategy1Name, strategy1);
    passport.use(strategy2Name, strategy2);
    let middleware = passport.authenticate([strategy1Name, strategy2Name]);
    await middleware(ctx, next);
    t.is(nextCount, 0, 'counter should stay untouched');
    t.truthy(ctx.res.finished, ' response should complete since invoke `res.end()`');
    t.is(ctx.response.status, 401, ' response status code should match with the first failed one');
    t.deepEqual(ctx.response.message, http.STATUS_CODES[401],
        ' response status message should match with first failed one');
    t.deepEqual(ctx.res.getHeader('WWW-Authenticate') as any, rchallange, 'should only contains valid challenge');
    middleware = passport.authenticate([strategy1Name, strategy2Name], {failWithError: true});
    const err: AuthenticationError = await t.throws(middleware(ctx, next), AuthenticationError);
    t.deepEqual(err.message, http.STATUS_CODES[401], 'err message should be http status message');
    t.is(err.status, 401, 'err status should be http status code');
});

test('Passport#authenticate, which redirect with certain url', async (t) => {
    const { app, ctx } = t.context as TestContext;
    const passport = new Passport(app.context);
    const strategy1Name = 'Mock1';
    const strategy1 = new MockStrategy(ActionType.REDIRECT, {url: 'test.com', status: 301});
    let nextCount = 0;
    const next = () => {
        ++nextCount;
        return Promise.resolve({});
    };

    passport.use(strategy1Name, strategy1);
    const middleware = passport.authenticate(strategy1Name);
    await middleware(ctx, next);
    t.is(nextCount, 0, 'counter should stay untouched');
    t.is(ctx.response.status, 301, ' response status code should be 302');
    t.truthy(ctx.response.body.indexOf('test.com') !== -1, 'should include url');
});

test('Passport#authenticate, success', async (t) => {
    const { app, ctx } = t.context as TestContext;
    const passport = new Passport(app.context);
    const user = 'foo';
    const info = { type: 'email', message: 'foo@example.com' };
    const strategyName = 'Mock1';
    const strategy = new MockStrategy(ActionType.SUCCESS, {user, info});
    let nextCount = 0;
    const next = () => {
        ++nextCount;
        return Promise.resolve({});
    };

    passport.use(strategyName, strategy);
    const middleware1 = passport.authenticate(strategyName, (err, u, i) => {
        t.deepEqual(u, user, 'user should be same');
        t.deepEqual(i, info, 'info should be same');
    });
    await middleware1(ctx, next);
    t.is(nextCount, 0, 'counter should stay untouched');
    const successMessage = true;
    const assignProperty = 'loginUser';
    const middleware2 = passport.authenticate(strategyName, { successMessage, assignProperty });

    (ctx as any).session = { message: {} };
    await middleware2(ctx, next);
    t.truthy(ctx.session.message[info.type] instanceof Array, 'should be an array');
    t.is(ctx.session.message[info.type].length, 1, 'should only contain one element');
    t.deepEqual(ctx.session.message[info.type][0], info.message, 'should be the same message');

    t.deepEqual(ctx.state[assignProperty], user, 'should be user');
    t.is(nextCount, 1, 'function next should be invoke once');

    (ctx as any).session = { message: {email: ['alreadExist@text.com']} };
    await middleware2(ctx, next);
    t.truthy(ctx.session.message[info.type] instanceof Array, 'should be an array');
    t.is(ctx.session.message[info.type].length, 2, 'should only contain one element');
    t.deepEqual(ctx.session.message[info.type][1], info.message, 'should be the same message');
    t.deepEqual(ctx.session.message[info.type][0], 'alreadExist@text.com', 'should be the existing message');

    t.deepEqual(ctx.state[assignProperty], user, 'should be user');
    t.is(nextCount, 2, 'function next should be invoke once again');
});

test('Passport#authenticate, success, then execute next()', async (t) => {
    const { app, ctx } = t.context as TestContext;
    const passport = new Passport(app.context);
    const user = { id: 1, username: 'jared' };
    const info = { type: 'email', message: 'jared@example.com' };
    const strategyName = 'Mock1';
    const strategy = new MockStrategy(ActionType.SUCCESS, {user, info});
    let nextCount = 0;
    const next = () => {
        ++nextCount;
        return Promise.resolve({});
    };
    const middleware = passport.initialize();
    (ctx as any).session = {};
    await middleware(ctx, next);
    t.is(nextCount, 1, 'should call next middleware once');
    passport.use(strategyName, strategy);
    passport.serializeUser(async (u, c) => {
        return u.id;
    });
    const middleware1 = passport.authenticate(strategyName);
    await middleware1(ctx, next);
    t.is(nextCount, 2, 'should call next middleware once again');
    t.deepEqual(ctx.state[passport.UserProperty], user, 'should be the same user');
    t.deepEqual(ctx.session.passport.user, user.id, 'should be user.id');

    const next2 = () => {
        throw Error('error in next2');
    };
    await t.throws(middleware1(ctx, next2), 'error in next2', 'should throw error');
});

test('Passport#authenticate, success with login, then redirect', async (t) => {
    const { app, ctx } = t.context as TestContext;
    const passport = new Passport(app.context);
    const user = { id: 1, username: 'jared' };
    const info = { type: 'email', message: 'jared@example.com' };
    const strategyName = 'Mock1';
    const strategy = new MockStrategy(ActionType.SUCCESS, {user, info});
    let nextCount = 0;
    const next = () => {
        ++nextCount;
        return Promise.resolve({});
    };
    const middleware = passport.initialize();
    (ctx as any).session = {};
    await middleware(ctx, next);
    t.is(nextCount, 1, 'should call next middleware once');
    passport.use(strategyName, strategy);
    passport.serializeUser(async (u, c) => u.id);
    passport.transformAuthInfo(async (i, c) => i.message);
    const middleware1 = passport.authenticate(
        strategyName,
        {authInfo: true, successReturnToOrRedirect: 'redirect.com'} as AuthenticateOption,
    );
    await middleware1(ctx, next);
    t.is(nextCount, 1, 'should not call next middleware again');
    t.deepEqual(ctx.state[passport.UserProperty], user, 'should be the same user');
    t.deepEqual(ctx.session.passport.user, user.id, 'should be user.id');
    t.deepEqual(ctx.state.authInfo, 'jared@example.com', 'should be info.message');
    t.is(ctx.response.status, 302, ' response status code should be 302');
    t.truthy(ctx.response.body.indexOf('redirect.com') !== -1, 'should include url');

    (ctx as any).session = {};
    (ctx as any).state = {};
    await middleware(ctx, next);
    t.is(nextCount, 2, 'should invoke next again since initialize function');
    Object.assign((ctx as any).session, {returnTo : 'anotherRedirect.com'});
    await middleware1(ctx, next);
    t.is(nextCount, 2, 'should not call next middleware again');
    t.deepEqual(ctx.state[passport.UserProperty], user, 'should be the same user');
    t.deepEqual(ctx.session.passport.user, user.id, 'should be user.id');
    t.is(ctx.response.status, 302, ' response status code should be 302');
    t.truthy(ctx.response.body.indexOf('anotherRedirect.com') !== -1, 'should be the second redirect url');

    (ctx as any).session = {};
    (ctx as any).state = {};
    await middleware(ctx, next);
    t.is(nextCount, 3, 'should invoke next again since initialize function');
    const middleware2 = passport.authenticate(
        strategyName,
        {authInfo: false, successRedirect: 'thirdRedirect.com'} as AuthenticateOption,
    );
    await middleware2(ctx, next);
    t.is(nextCount, 3, 'should not call next middleware again');
    t.deepEqual(ctx.state[passport.UserProperty], user, 'should be the same user');
    t.deepEqual(ctx.session.passport.user, user.id, 'should be user.id');
    t.deepEqual(ctx.state.authInfo, undefined, 'should be undefined');
    t.is(ctx.response.status, 302, ' response status code should be 302');
    t.truthy(ctx.response.body.indexOf('thirdRedirect.com') !== -1, 'should be the second redirect url');
});

test('Passport#serializeUser', async (t) => {
    const { app, ctx } = t.context as TestContext;
    let passport = new Passport(app.context);
    const user = { id: 1, username: 'jared' };
    await t.throws(passport.serializeUser(user, ctx), 'Failed to serialize user into session',
        'should throw error if no serializeUser function');

    passport.serializeUser(async (u, c) => {
        return u.id;
    });
    t.is(await passport.serializeUser(user, ctx), 1, 'should serialize user');

    passport = new Passport(app.context);
    passport.serializeUser((u, c) => {
        return Promise.resolve(0);
    });
    t.is(await passport.serializeUser(user, ctx), 0, 'should serialize user to 0');

    passport = new Passport(app.context);
    passport.serializeUser(async (u, c) => {
        return false;
    });
    await t.throws(passport.serializeUser(user, ctx), 'Failed to serialize user into session',
        'should not serialize user if return false');

    passport = new Passport(app.context);
    passport.serializeUser(async (u, c) => {
        return null;
    });
    await t.throws(passport.serializeUser(user, ctx), 'Failed to serialize user into session',
        'should not serialize user, if return null');

    passport = new Passport(app.context);
    passport.serializeUser(async (u, c) => {
        return undefined;
    });
    await t.throws(passport.serializeUser(user, ctx), 'Failed to serialize user into session',
        'should not serialize user, if return undefined');

    passport = new Passport(app.context);
    passport.serializeUser(async (u, c) => {
        throw new Error('something went wrong');
    });
    await t.throws(passport.serializeUser(user, ctx), 'something went wrong',
        'should not serialize user, if throw error');

    passport = new Passport(app.context);
    passport.serializeUser(async (u, c) => {
        return false;
    });
    passport.serializeUser(async (u, c) => {
        return 'two';
    });
    passport.serializeUser(async (u, c) => {
        return 'three';
    });
    t.is(await passport.serializeUser(user, ctx), 'two', 'should serialize user to \'two\'');

    passport = new Passport(app.context);
    passport.serializeUser(async (u, c) => {
        return false;
    });
    passport.serializeUser(async (u, c) => {
        return false;
    });
    passport.serializeUser(async (u, c) => {
        return 'three';
    });
    t.is(await passport.serializeUser(user, ctx), 'three', 'should serialize user to \'three\'');

    passport = new Passport(app.context);
    passport.serializeUser(async (u, c) => {
        return null;
    });
    passport.serializeUser(async (u, c) => {
        return undefined;
    });
    passport.serializeUser(async (u, c) => {
        return 'three';
    });
    t.is(await passport.serializeUser(user, ctx), 'three', 'should serialize user to \'three\'');

    passport = new Passport(app.context);
    passport.serializeUser(async (u, c) => {
        if (ctx.request.path !== '/foo') {
            throw new Error('incorrect req argument');
        }
        return u.id;
    });
    ctx.request.path = '/foo';
    t.is(await passport.serializeUser(user, ctx), 1, 'should serialize user to 1');
});

test('Passport#deserializeUser', async (t) => {
    const { app, ctx } = t.context as TestContext;
    let passport = new Passport(app.context);
    const user = { id: 1, username: 'jared' };
    await t.throws(passport.deserializeUser(user, ctx), 'Failed to deserialize user out of session',
        'should throw error if no deserializeUser function');

    passport.deserializeUser(async (o, c) => {
        return o;
    });
    t.is(await passport.deserializeUser(user, ctx), user, 'should deserialize user');

    passport = new Passport(app.context);
    passport.deserializeUser(async (o, c) => {
        return false;
    });
    t.false(await passport.deserializeUser(user, ctx), 'should deserialize user to false, if return false');

    passport = new Passport(app.context);
    passport.deserializeUser(async (o, c) => {
        return null;
    });
    t.is(await passport.deserializeUser(user, ctx), false, 'should deserialize user to false, if return null');

    passport = new Passport(app.context);
    passport.deserializeUser(async (o, c) => {
        return undefined;
    });
    await t.throws(passport.deserializeUser(user, ctx), 'Failed to deserialize user out of session',
        'should not deserialize user, if return undefined');

    passport = new Passport(app.context);
    passport.deserializeUser(async (o, c) => {
        throw new Error('something went wrong');
    });
    await t.throws(passport.deserializeUser(user, ctx), 'something went wrong',
        'should not serialize user, if return null');

    passport = new Passport(app.context);
    passport.deserializeUser(async (o, c) => {
        return undefined;
    });
    passport.deserializeUser(async (o, c) => {
        return 'two';
    });
    passport.deserializeUser(async (o, c) => {
        return 'three';
    });
    t.is(await passport.deserializeUser(user, ctx), 'two', 'should deserialize user to \'two\'');

    passport = new Passport(app.context);
    passport.deserializeUser(async (o, c) => {
        return undefined;
    });
    passport.deserializeUser(async (o, c) => {
        return undefined;
    });
    passport.deserializeUser(async (o, c) => {
        return 'three';
    });
    t.is(await passport.deserializeUser(user, ctx), 'three', 'should deserialize user to \'three\'');

    passport = new Passport(app.context);
    passport.deserializeUser(async (o, c) => {
        return undefined;
    });
    passport.deserializeUser(async (o, c) => {
        return false;
    });
    passport.deserializeUser(async (o, c) => {
        return 'three';
    });
    t.false(await passport.deserializeUser(user, ctx), 'should deserialize user to \'false\'');

    passport = new Passport(app.context);
    passport.deserializeUser(async (o, c) => {
        return undefined;
    });
    passport.deserializeUser(async (o, c) => {
        return null;
    });
    passport.deserializeUser(async (o, c) => {
        return 'three';
    });
    t.is(await passport.deserializeUser(user, ctx), false, 'should deserialize user to \'null\'');

    passport = new Passport(app.context);
    passport.deserializeUser(async (o, c) => {
        if (ctx.request.path !== '/foo') {
            throw new Error('incorrect req argument');
        }
        return o.username;
    });
    ctx.request.path = '/foo';
    t.is(await passport.deserializeUser(user, ctx), 'jared', 'should deserialize user to jared');
});

test('Passport#transformAuthInfo', async (t) => {
    const { app, ctx } = t.context as TestContext;
    let passport = new Passport(app.context);
    const info = { type: '1', message: 'write' };

    // 1
    let tInfo = await passport.transformAuthInfo(info, ctx);
    t.deepEqual(tInfo, info, 'should not transform info');

    // 2
    passport.transformAuthInfo(async (i, c) => {
        return { type: i.type, client: { name: 'Foo' } };
    });
    tInfo = await passport.transformAuthInfo(info, ctx);
    t.deepEqual(tInfo, { type: '1', client: { name: 'Foo' } }, 'should transform info');

    // 3
    passport = new Passport(app.context);
    passport.transformAuthInfo(async (i, c) => {
        throw new Error('something went wrong');
    });
    await t.throws(passport.transformAuthInfo(info, ctx), 'something went wrong', 'should throw an error');

    // 4
    passport = new Passport(app.context);
    passport.transformAuthInfo(async (i, c) => {
        return null;
    });
    passport.transformAuthInfo(async (i, c) => {
        return { type: i.type, client: { name: 'Two' } };
    });
    passport.transformAuthInfo(async (i, c) => {
        return { type: i.type, client: { name: 'Three' } };
    });
    tInfo = await passport.transformAuthInfo(info, ctx);
    t.deepEqual(tInfo, { type: '1', client: { name: 'Two' } }, 'should transform info to \'Two\'');

    // 5
    passport = new Passport(app.context);
    passport.transformAuthInfo(async (i, c) => {
        return null;
    });
    passport.transformAuthInfo(async (i, c) => {
        return undefined;
    });
    passport.transformAuthInfo(async (i, c) => {
        return { type: i.type, client: { name: 'Three' } };
    });
    tInfo = await passport.transformAuthInfo(info, ctx);
    t.deepEqual(tInfo, { type: '1', client: { name: 'Three' } }, 'should transform info to \'Three\'');

    // 6
    passport = new Passport(app.context);
    passport.transformAuthInfo(async (i, c) => {
        return null;
    });
    passport.transformAuthInfo(async (i, c) => {
        return false;
    });
    passport.transformAuthInfo(async (i, c) => {
        return { type: i.type, client: { name: 'Three' } };
    });
    tInfo = await passport.transformAuthInfo(info, ctx);
    t.deepEqual(tInfo, { type: '1', client: { name: 'Three' } }, 'should transform info to \'Three\'');

    // 7
    passport = new Passport(app.context);
    passport.transformAuthInfo(async (i, c) => {
        if (c.request.path !== '/foo') {
            throw new Error('incorrect request argument');
        }
        return { type: i.type, client: { name: 'Three' } };
    });
    ctx.request.path = '/foo';
    tInfo = await passport.transformAuthInfo(info, ctx);
    t.deepEqual(tInfo, { type: '1', client: { name: 'Three' } }, 'should transform info to \'Three\'');
});

test('Passport#session', async (t) => {
    const { app, ctx } = t.context as TestContext;
    const passport = new Passport(app.context);
    let nextCount = 0;
    const next = () => {
        ++nextCount;
        return Promise.resolve({});
    };
    (ctx as any).session = {};
    let middleware = passport.initialize();
    await middleware(ctx, next);
    t.is(nextCount, 1, 'should call next middleware once');
    middleware = passport.session();
    await middleware(ctx, next);
    t.is(nextCount, 2, 'should call next middleware once again');
    const next2 = () => {
        throw Error('error in next2');
    };
    middleware = passport.authenticate('session', (err) => err.message);
    const res = await middleware(ctx, next2);
    t.deepEqual(res, 'error in next2', 'error message should be same');
});
