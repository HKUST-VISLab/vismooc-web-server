import test from 'ava';
import * as Koa from 'koa';
import * as nock from 'nock';
import { parse } from 'url';

import { HKMOOCStrategy } from '../../../../src/middlewares/passport/strategies/HKMOOCStrategy';
import { MockReq, MockRes } from '../../../testUtils';

interface TestContext {
    clientId: string;
    authorizationURL: string;
    tokenURL: string;
    userProfileURL: string;
    verify: (accessToken, refreshToken, params, profile) => Promise<{ user, info }>;
    skipUserProfile: boolean;
    scopeSeparator: string;
    callbackURL: string;
    scope: string;
    sessionKey: string;
    clientSecret: string;
    customHeaders;
    stateStore: object | boolean;
    ctx: Koa.Context;
    app: Koa;
}

test.beforeEach('init a HKMOOCStrategy', (t) => {
    const app = new Koa();
    const ctx = app.createContext(new MockReq(), new MockRes());
    const userProfileURL: string = 'https://learn2.hkmooc.hk/oauth2/user_info' + Math.random();
    t.context = {
        clientId: 'clientID',
        authorizationURL: 'https://learn2.hkmooc.hk/oauth2/authorize/',
        tokenURL: 'https://learn2.hkmooc.hk/oauth2/access_token/',
        userProfileURL,
        verify: (accessToken, refreshToken, params, profile) => ({ user: {}, info: null }),
        skipUserProfile: true,
        scopeSeparator: ';',
        callbackURL: 'https://test.com/callback',
        scope: 'email',
        sessionKey: 'a key',
        clientSecret: 'qwer',
        customHeaders: { 'User-Agent': 'Mocked-Agent' },
        stateStore: false,
        ctx,
        app,
    };
});

test('HKMOOCStrategy#constructor, with default value', (t) => {
    const {clientId, verify} = t.context as TestContext;
    const strategy = new HKMOOCStrategy(clientId, undefined, undefined, verify);
    t.deepEqual(strategy.Name, 'HKMOOCStrategy', 'name must be HKMOOCStrategy');
});

test('HKMOOCStrategy#constructor, with predefined customHeaders', (t) => {
    const {clientId, verify, customHeaders} = t.context as TestContext;
    const strategy = new HKMOOCStrategy(
        clientId,
        undefined,
        undefined,
        verify,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        customHeaders,
    );
    t.deepEqual(strategy.Name, 'HKMOOCStrategy', 'name must be HKMOOCStrategy');
});

test('HKMOOCStrategy#userProfile, success', async (t) => {
    const {clientId, verify, userProfileURL, ctx} = t.context as TestContext;
    const email: string = 'test@gmail.com';
    const preferred_username: string = 'test_username';
    const sub: string = 'test_sub';
    const administrator: string = 'test_administrator';
    const locale: string = 'test_locale';
    const name: string = 'test_name';
    const given_name: string = 'test_given_name';
    const uri = parse(userProfileURL);
    const result = JSON.stringify({ email, preferred_username, sub, administrator, locale, name, given_name });

    nock(`${uri.protocol}//${uri.host}`).get(uri.path)
        .reply(200, (requestUri, requestBody) => {
            return result;
        });
    const strategy = new HKMOOCStrategy(clientId, undefined, undefined, verify, undefined, undefined, userProfileURL);
    const profile = await strategy.userProfile(ctx);
    t.deepEqual((profile as any).provider, 'HKMOOC', 'should be provider');
    t.deepEqual((profile as any)._raw, result, 'should be result');
    t.deepEqual((profile as any)._json, JSON.parse(result), 'should be json');
    t.deepEqual((profile as any).emails, email, 'should be the same email');
    t.deepEqual((profile as any).id, email, 'id should be email address');
    t.deepEqual((profile as any).username, preferred_username, 'username should be preferred_username');
    t.deepEqual((profile as any).sub, sub, 'should be sub');
    t.deepEqual((profile as any).administrator, administrator, 'should be administrator');
    t.deepEqual((profile as any).locale, locale, 'should be locale');
    t.deepEqual((profile as any).name, name, 'should be name');
    t.deepEqual((profile as any).given_name, given_name, 'should be given_name');

});

test('HKMOOCStrategy#userProfile, failed due to provided a non-json result', async (t) => {
    const {clientId, verify, userProfileURL, ctx} = t.context as TestContext;
    const uri = parse(userProfileURL);
    const result: string = 'result';

    nock(`${uri.protocol}//${uri.host}`).get(uri.path)
        .reply(200, (requestUri, requestBody) => {
            return result;
        });
    const strategy = new HKMOOCStrategy(clientId, undefined, undefined, verify, undefined, undefined, userProfileURL);
    await t.throws(strategy.userProfile(ctx), 'Failed to parse user profile', 'should throw an Error');
});

test('HKMOOCStrategy#userProfile, failed due to http error with a json format message', async (t) => {
    const {clientId, verify, userProfileURL, ctx} = t.context as TestContext;
    const uri = parse(userProfileURL);
    const result = { error: 'an error', message: 'some message' };

    nock(`${uri.protocol}//${uri.host}`).get(uri.path)
        .reply(400, (requestUri, requestBody) => {
            return result;
        });
    const strategy = new HKMOOCStrategy(clientId, undefined, undefined, verify, undefined, undefined, userProfileURL);
    await t.throws(strategy.userProfile(ctx), 'some message', 'should throw an Error');
});

test('HKMOOCStrategy#userProfile, failed due to http error with a non-json error message', async (t) => {
    const {clientId, verify, userProfileURL, ctx} = t.context as TestContext;
    const uri = parse(userProfileURL);
    const result = 'an error';

    nock(`${uri.protocol}//${uri.host}`).get(uri.path)
        .reply(400, (requestUri, requestBody) => {
            return result;
        });
    const strategy = new HKMOOCStrategy(clientId, undefined, undefined, verify, undefined, undefined, userProfileURL);
    await t.throws(strategy.userProfile(ctx), `Failed to fetch user profile:${result}`, 'should throw an Error');
});

test('HKMOOCStrategy#userProfile, failed due to http error without error message', async (t) => {
    const {clientId, verify, userProfileURL, ctx} = t.context as TestContext;
    const uri = parse(userProfileURL);

    nock(`${uri.protocol}//${uri.host}`).get(uri.path)
        .reply(400, (requestUri, requestBody) => {
            return null;
        });
    const strategy = new HKMOOCStrategy(clientId, undefined, undefined, verify, undefined, undefined, userProfileURL);
    await t.throws(strategy.userProfile(ctx), `Failed to fetch user profile:`, 'should throw an Error');
});
