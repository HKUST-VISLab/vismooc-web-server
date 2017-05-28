import test from 'ava';
import * as Koa from 'koa';
import { BaseStateStore, SessionStore } from '../../../../../src/middlewares/passport/strategies/baseOAuth2';
import { MockReq, MockRes } from '../../../../testUtils';

interface TestContext {
    app: Koa;
    ctx: Koa.Context;
}

test.beforeEach('init', (t) => {
    const app: Koa = new Koa();
    const ctx = app.createContext(new MockReq(), new MockRes());
    t.context = {
        app,
        ctx,
    };
});

test('BaseStateStore#store', async (t) => {
    const { ctx } = t.context as TestContext;
    const store = new BaseStateStore();
    const authorizationURL = '///';
    const tokenURL = '/token';
    const clientId = 'clientId';
    const meta = { authorizationURL, tokenURL, clientId };
    t.deepEqual(await store.store(ctx), '', 'should return empty string');
    t.deepEqual(await store.store(ctx, meta), '', 'should return empty string');
});

test('BaseStateStore#verify', async (t) => {
    const { ctx } = t.context as TestContext;
    const store = new BaseStateStore();
    const providedState = 'asdf';
    const result = { result: true, message: '' };
    t.deepEqual(await store.verify(ctx, providedState), result, 'should return default result');
});

test('SessionStore#store', async (t) => {
    const { ctx } = t.context as TestContext;
    const key = 'a key';
    const store = new SessionStore(key);
    const authorizationURL = '///';
    const tokenURL = '/token';
    const clientId = 'clientId';
    const meta = { authorizationURL, tokenURL, clientId };

    await t.throws(store.store(ctx), Error, 'should throw error if no session in ctx');
    await t.throws(store.store(ctx, meta), Error, 'should throw error if no session in ctx');

    (ctx as any).session = {};
    const state = await store.store(ctx);
    t.is(state.length, 32, 'should return a state with length 24');
    t.deepEqual(ctx.session[key], { state }, 'should have a object with `state` property in ctx.session[key]');

    const newState = await store.store(ctx, meta);
    t.is(state.length, 32, 'should return a state with length 24');
    t.deepEqual(ctx.session[key], { state: newState }, 'should have new `state` value in ctx.session[key]');

});

test('SessionStore#verify', async (t) => {
    const { ctx } = t.context as TestContext;
    const key = 'a key';
    const store = new SessionStore(key);
    const providedState = 'asdf';
    await t.throws(store.verify(ctx, providedState), Error, 'should throw error if no session in ctx');

    (ctx as any).session = {};
    let { result, message } = await store.verify(ctx, providedState);
    t.falsy(result, 'should be false if `ctx.session[key]` is undefined');
    t.deepEqual(message, 'Unable to verify authorization request state.', 'default error msg');

    (ctx as any).session = { [key]: {} };
    ({ result, message } = await store.verify(ctx, providedState));
    t.falsy(result, 'should be false if `ctx.session[key].state` is undefined');
    t.deepEqual(message, 'Unable to verify authorization request state.', 'default error msg');

    (ctx as any).session = { [key]: { state: 'lkj' } };
    ({ result, message } = await store.verify(ctx, providedState));
    t.falsy(result, 'should be false if `ctx.session[key].state` is not equal to providedState');
    t.deepEqual(message, 'Invalid authorization request state.', 'default error msg');
    t.falsy(key in ctx.session, '`ctx.session[key]` will be deleted if no property in `ctx.session[key]`');

    (ctx as any).session = { [key]: { state: 'lkj', extra: 'qwer' } };
    ({ result, message } = await store.verify(ctx, providedState));
    t.falsy(result, 'should be false if `ctx.session[key].state` is not equal to providedState');
    t.deepEqual(message, 'Invalid authorization request state.', 'default error msg');
    t.falsy('state' in ctx.session[key], '`ctx.session[key].state` will be deleted');
    t.truthy(key in ctx.session, '`ctx.session[key]` still exists if extra property in `ctx.session[key]`');

    (ctx as any).session = { [key]: { state: providedState } };
    ({ result, message } = await store.verify(ctx, providedState));
    t.truthy(result, 'should be true if `ctx.session[key].state` is equal to providedState');
    t.deepEqual(message, '', 'no msg if success');
});
