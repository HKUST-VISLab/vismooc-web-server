import test from 'ava';
import * as Koa from 'koa';

import {
    ActionType,
    PassAction,
} from '../../../../src/middlewares/passport/strategies';
import { SessionStrategy } from '../../../../src/middlewares/passport/strategies/session';
import { MockReq, MockRes } from '../../../testUtils';

test.beforeEach('init a HKMOOCStrategy', (t) => {
    const app = new Koa();
    const ctx = app.createContext(new MockReq(), new MockRes());
    t.context = {
        ctx,
        app,
    };
});

test('SessionStrategy#constructor', (t) => {
    const strategy = new SessionStrategy();
    t.deepEqual(strategy.Name, 'session', 'should be session strategy');
});

test('SessionStrategy#authenticate', async (t) => {
    const { ctx } = t.context as any;
    const strategy = new SessionStrategy();
    await t.throws(strategy.authenticate(ctx), 'passport.initialize() middleware not in use',
        'should throw an error when passport not used');
    (ctx as any).passport = {};
    (ctx as any).session = {};
    const res = await strategy.authenticate(ctx);
    t.deepEqual(res.type, ActionType.PASS, 'should be pass type');
    t.truthy(res instanceof PassAction , 'should be an instance of PassAction');
    t.is(ctx.state.username, undefined, 'user should not be put into the state');
});

test('SessionStrategy#authenticate, provided session.passport, but not session.passport.user', async (t) => {
    const { ctx } = t.context as any;
    const strategy = new SessionStrategy();
    (ctx as any).passport = {};
    (ctx as any).session = { passport: {} };
    const res = await strategy.authenticate(ctx);
    t.deepEqual(res.type, ActionType.PASS, 'should be pass type');
    t.truthy(res instanceof PassAction , 'should be an instance of PassAction');
    t.is(ctx.state.username, undefined, 'user should not be put into the state');
});

test('SessionStrategy#authenticate, provided session.passport.user', async (t) => {
    class MockPassport {
        constructor( public deserializeUser = (obj, ctx?)  => obj.username) { }
        public get UserProperty() {
            return 'username';
        }
    }
    const { ctx } = t.context as any;
    const strategy = new SessionStrategy();
    (ctx as any).passport = new MockPassport();
    (ctx as any).session = { passport: {user: {username: 'foo'}} };
    await strategy.authenticate(ctx);
    t.deepEqual(ctx.state.username, 'foo', 'should be pass type');
});

test('SessionStrategy#authenticate, passed due to user do not match', async (t) => {
    class MockPassport {
        constructor( public deserializeUser = (obj, ctx?)  => null) { }
        public get UserProperty() {
            return 'username';
        }
    }
    const { ctx } = t.context as any;
    const strategy = new SessionStrategy();
    (ctx as any).passport = new MockPassport();
    (ctx as any).session = { passport: {user: {username: 'foo'}} };
    const res = await strategy.authenticate(ctx);
    t.deepEqual(res.type, ActionType.PASS, 'should be pass type');
    t.truthy(res instanceof PassAction , 'should be an instance of PassAction');
    t.is(ctx.state.username, undefined, 'user should not be put into the state');
});
