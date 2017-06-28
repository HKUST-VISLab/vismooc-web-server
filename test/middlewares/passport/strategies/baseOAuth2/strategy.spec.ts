import test from 'ava';
import * as Koa from 'koa';
import * as nock from 'nock';
import * as querystring from 'querystring';
import { parse, resolve } from 'url';
import {
    ActionType,
    // BaseAction,
    FailAction,
    RedirectAction,
    SuccessAction,
} from '../../../../../src/middlewares/passport/strategies';
import {
    AuthorizationError,
    BaseOAuth2Strategy,
    TokenError,
} from '../../../../../src/middlewares/passport/strategies/baseOAuth2';
import {
    BaseStateStore,
} from '../../../../../src/middlewares/passport/strategies/baseOAuth2/stateStore';
import { OAuth2Error } from '../../../../../src/utils/oauth2';
import { MockReq, MockRes } from '../../../../testUtils';

interface TestContext {
    clientId: string;
    authorizationURL: string;
    tokenURL: string;
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

test.beforeEach('init a strategy', (t) => {
    const app = new Koa();
    const ctx = app.createContext(new MockReq(), new MockRes());
    const tokenURL = 'https://test.com/oauth/token' + Math.random();
    t.context = {
        clientId: 'clientID',
        authorizationURL: 'https://test.com/oauth/authorize',
        tokenURL,
        verify: (accessToken, refreshToken, params, profile) => ({ user: {}, info: null }),
        skipUserProfile: true,
        scopeSeparator: ';',
        callbackURL: 'https://test.com/callback',
        scope: 'email',
        sessionKey: 'a key',
        clientSecret: 'qwer',
        customHeaders: { header: 'zxcv' },
        stateStore: false,
        ctx,
        app,
    };
});

test('BaseOAuth2Strategy#constructor', (t) => {
    const { clientId, authorizationURL, tokenURL, verify } = t.context as TestContext;
    const strategy = new BaseOAuth2Strategy(clientId, authorizationURL, tokenURL, verify);
    t.deepEqual(strategy.Name, 'oauth2', 'should named oauth2');
});

test('BaseOAuth2Strategy#constructor, that skipUserProfile is true', async (t) => {
    const { clientId, authorizationURL, tokenURL, ctx } = t.context as TestContext;
    const accessToken = '2YotnFZFEjr1zCsicMWpAA';
    const refreshToken = 'tGzv3JOkF0XG5Qx2TlKWIA';
    const code = 'SplxlOBeZQQYbYS6WxSbIA';
    const verify = (at: string, rt: string, params, profile: object) => {
        if (at !== accessToken) {
            throw new Error('incorrect accessToken argument');
        }
        if (rt !== refreshToken) {
            throw new Error('incorrect refreshToken argument');
        }
        if (profile === null) {
            throw new Error('profile is null');
        }
        throw new Error('should not reach here');
    };
    const uri = parse(tokenURL);
    nock(`${uri.protocol}//${uri.host}`).post(uri.path)
        .reply(200, (requestUri, requestBody) => {
            return JSON.stringify({ access_token: accessToken, refresh_token: refreshToken });
        });
    const strategy = new BaseOAuth2Strategy(
        clientId,
        authorizationURL,
        tokenURL,
        verify,
        true);
    ctx.query = { code };
    await t.throws(strategy.authenticate(ctx), 'profile is null', 'should throw an Error');
});

test('BaseOAuth2Strategy#authenticate, that redirects to service provider without redirect URI', async (t) => {
    const { clientId, authorizationURL, tokenURL, verify, ctx } = t.context as TestContext;
    const strategy = new BaseOAuth2Strategy(clientId, authorizationURL, tokenURL, verify);
    const res = await strategy.authenticate(ctx);
    t.deepEqual(res.type, ActionType.REDIRECT, 'should be a redirect type');
    const url = (res as RedirectAction).url;
    const queryStr = querystring.stringify({
        response_type: 'code',
        client_id: clientId,
    });
    t.deepEqual(url, `${authorizationURL}?${queryStr}`, 'should be redirect');
});

test('BaseOAuth2Strategy#authenticate, that redirects to service provider with redirect URI', async (t) => {
    const { clientId, authorizationURL, tokenURL, verify, callbackURL, ctx } = t.context as TestContext;
    const strategy = new BaseOAuth2Strategy(clientId, authorizationURL, tokenURL, verify, undefined, undefined,
        callbackURL);
    const res = await strategy.authenticate(ctx);
    t.deepEqual(res.type, ActionType.REDIRECT, 'should be a redirect type');
    const url = (res as RedirectAction).url;
    const queryStr = querystring.stringify({
        response_type: 'code',
        redirect_uri: callbackURL,
        client_id: clientId,
    });
    t.deepEqual(url, `${authorizationURL}?${queryStr}`, 'should be redirect');
});

test('BaseOAuth2Strategy#authenticate, that redirects to service provider with redirect URI and scope',
    async (t) => {
        const { clientId, authorizationURL, tokenURL, verify, callbackURL, scope, ctx } = t.context as TestContext;
        const strategy = new BaseOAuth2Strategy(clientId, authorizationURL, tokenURL, verify, undefined, undefined,
            callbackURL, scope);
        const res = await strategy.authenticate(ctx);
        t.deepEqual(res.type, ActionType.REDIRECT, 'should be a redirect type');
        const url = (res as RedirectAction).url;
        const queryStr = querystring.stringify({
            response_type: 'code',
            redirect_uri: callbackURL,
            scope,
            client_id: clientId,
        });
        t.deepEqual(url, `${authorizationURL}?${queryStr}`, 'should be redirect');
    });

test('BaseOAuth2Strategy#authenticate, that redirects to service provider with scope option', async (t) => {
    const { clientId, authorizationURL, tokenURL, verify, callbackURL, ctx, scope } = t.context as TestContext;
    const strategy = new BaseOAuth2Strategy(clientId, authorizationURL, tokenURL, verify, undefined, undefined,
        callbackURL, scope);
    const res = await strategy.authenticate(ctx);
    t.deepEqual(res.type, ActionType.REDIRECT, 'should be a redirect type');
    const url = (res as RedirectAction).url;
    const queryStr = querystring.stringify({
        response_type: 'code',
        redirect_uri: callbackURL,
        scope,
        client_id: clientId,
    });
    t.deepEqual(url, `${authorizationURL}?${queryStr}`, 'should be redirect');
});

test('BaseOAuth2Strategy#authenticate, that redirects to service provider with scope option \
  as array', async (t) => {
        const { clientId, authorizationURL, tokenURL, verify, callbackURL, ctx } = t.context as TestContext;
        const strategy = new BaseOAuth2Strategy(clientId, authorizationURL, tokenURL, verify, undefined, undefined,
            callbackURL);
        const res = await strategy.authenticate(ctx, { scope: ['email', 'github'] });
        t.deepEqual(res.type, ActionType.REDIRECT, 'should be a redirect type');
        const url = (res as RedirectAction).url;
        const queryStr = querystring.stringify({
            response_type: 'code',
            redirect_uri: callbackURL,
            scope: `email github`,
            client_id: clientId,
        });
        t.deepEqual(url, `${authorizationURL}?${queryStr}`, 'should be redirect');
    });

test('BaseOAuth2Strategy#authenticate, that redirects to service provider with scope options as \
  array using non-standard separator', async (t) => {
        const {
        clientId,
            authorizationURL,
            tokenURL,
            verify,
            callbackURL,
            ctx,
            scopeSeparator,
    } = t.context as TestContext;
        const strategy = new BaseOAuth2Strategy(clientId, authorizationURL, tokenURL, verify, undefined, scopeSeparator,
            callbackURL);
        const res = await strategy.authenticate(ctx, { scope: ['email', 'github'] });
        t.deepEqual(res.type, ActionType.REDIRECT, 'should be a redirect type');
        const url = (res as RedirectAction).url;
        const queryStr = querystring.stringify({
            response_type: 'code',
            redirect_uri: callbackURL,
            scope: `email${scopeSeparator}github`,
            client_id: clientId,
        });
        t.deepEqual(url, `${authorizationURL}?${queryStr}`, 'should be redirect');
    });

test('BaseOAuth2Strategy#authenticate, that redirects to service provider with state option', async (t) => {
    const { clientId, authorizationURL, tokenURL, verify, callbackURL, ctx } = t.context as TestContext;
    const strategy = new BaseOAuth2Strategy(clientId, authorizationURL, tokenURL, verify, undefined, undefined,
        callbackURL);
    const res = await strategy.authenticate(ctx, { state: 'foo123' });
    t.deepEqual(res.type, ActionType.REDIRECT, 'should be a redirect type');
    const url = (res as RedirectAction).url;
    const queryStr = querystring.stringify({
        response_type: 'code',
        redirect_uri: callbackURL,
        state: 'foo123',
        client_id: clientId,
    });
    t.deepEqual(url, `${authorizationURL}?${queryStr}`, 'should be redirect');
});

test('BaseOAuth2Strategy#authenticate, that redirects to service provider with redirect URI option', async (t) => {
    const { clientId, authorizationURL, tokenURL, verify, ctx } = t.context as TestContext;
    const callbackURL = 'https://test.com/callback';
    const strategy = new BaseOAuth2Strategy(clientId, authorizationURL, tokenURL, verify);
    const res = await strategy.authenticate(ctx, { callbackURL });
    t.deepEqual(res.type, ActionType.REDIRECT, 'should be a redirect type');
    const url = (res as RedirectAction).url;
    const queryStr = querystring.stringify({
        response_type: 'code',
        redirect_uri: callbackURL,
        client_id: clientId,
    });
    t.deepEqual(url, `${authorizationURL}?${queryStr}`, 'should be redirect');
});

test('BaseOAuth2Strategy#authenticate, that redirects to service provider with relative\
  redirect URI option', async (t) => {
        const { clientId, authorizationURL, tokenURL, verify, ctx } = t.context as TestContext;
        const strategy = new BaseOAuth2Strategy(clientId, authorizationURL, tokenURL, verify, undefined, undefined);
        const callbackURL = '/auth/callback';
        ctx.req.headers = {
            'host': 'test.com',
            'x-forwarded-proto': 'https',
        };
        ctx.app.proxy = true;
        const res = await strategy.authenticate(ctx, { callbackURL });
        t.deepEqual(res.type, ActionType.REDIRECT, 'should be a redirect type');
        const url = (res as RedirectAction).url;
        // const uri = parse(authorizationURL);
        const queryStr = querystring.stringify({
            response_type: 'code',
            redirect_uri: resolve('https://test.com/', callbackURL),
            client_id: clientId,
        });
        t.deepEqual(url, `${authorizationURL}?${queryStr}`, 'should be redirect');
    });

test('BaseOAuth2Strategy#authenticate, that redirects to authorization server using authorization endpoint\
  that has query parameters with scope option', async (t) => {
        const { clientId, authorizationURL, tokenURL, verify, callbackURL, ctx } = t.context as TestContext;
        const strategy = new BaseOAuth2Strategy(clientId, `${authorizationURL}?foo=bar`, tokenURL, verify, undefined,
            undefined, callbackURL);
        const res = await strategy.authenticate(ctx, { scope: 'email' });
        t.deepEqual(res.type, ActionType.REDIRECT, 'should be a redirect type');
        const url = (res as RedirectAction).url;
        const queryStr = querystring.stringify({
            foo: 'bar',
            response_type: 'code',
            redirect_uri: callbackURL,
            scope: 'email',
            client_id: clientId,
        });
        t.deepEqual(url, `${authorizationURL}?${queryStr}`, 'should be redirect');
    });

test('BaseOAuth2Strategy#authenticate, that redirects to authorization server using authorization endpoint that\
  has query parameters including scope with scope option', async (t) => {
        const { clientId, authorizationURL, tokenURL, verify, callbackURL, ctx } = t.context as TestContext;
        const strategy = new BaseOAuth2Strategy(clientId, `${authorizationURL}?foo=bar&scope=baz`, tokenURL, verify,
            undefined, undefined, callbackURL);
        const res = await strategy.authenticate(ctx, { scope: 'email' });
        t.deepEqual(res.type, ActionType.REDIRECT, 'should be a redirect type');
        const url = (res as RedirectAction).url;
        const queryStr = querystring.stringify({
            foo: 'bar',
            scope: 'email',
            response_type: 'code',
            redirect_uri: callbackURL,
            client_id: clientId,
        });
        t.deepEqual(url, `${authorizationURL}?${queryStr}`, 'should be redirect');
    });

test('BaseOAuth2Strategy#authenticate, that redirects to authorization server using authorization endpoint that\
  has query parameters including state with state option', async (t) => {
        const { clientId, authorizationURL, tokenURL, verify, callbackURL, ctx } = t.context as TestContext;
        const strategy = new BaseOAuth2Strategy(clientId, `${authorizationURL}?foo=bar&state=baz`, tokenURL, verify,
            undefined, undefined, callbackURL);
        const res = await strategy.authenticate(ctx, { state: 'email' });
        t.deepEqual(res.type, ActionType.REDIRECT, 'should be a redirect type');
        const url = (res as RedirectAction).url;
        const queryStr = querystring.stringify({
            foo: 'bar',
            state: 'email',
            response_type: 'code',
            redirect_uri: callbackURL,
            client_id: clientId,
        });
        t.deepEqual(url, `${authorizationURL}?${queryStr}`, 'should be redirect');
    });

test('BaseOAuth2Strategy#authenticate, that that was approved without redirect URI', async (t) => {
    const { clientId, authorizationURL, tokenURL, ctx } = t.context as TestContext;
    const code = 'SplxlOBeZQQYbYS6WxSbIA';
    const accessToken = '2YotnFZFEjr1zCsicMWpAA';
    const refreshToken = 'tGzv3JOkF0XG5Qx2TlKWIA';
    const user = { id: '1234' };
    const info = { message: 'Hello' };
    const verify = (at: string, rt: string, params, profile: object) => {
        if (at !== accessToken) {
            throw new Error('incorrect accessToken argument');
        }
        if (rt !== refreshToken) {
            throw new Error('incorrect refreshToken argument');
        }
        if (Object.keys(profile).length !== 0) {
            throw new Error('incorrect profile argument');
        }
        return Promise.resolve({ user, info });
    };

    const uri = parse(tokenURL);
    nock(`${uri.protocol}//${uri.host}`).post(uri.path)
        .reply(200, (requestUri, requestBody) => {
            const query = querystring.parse(requestBody);
            if (query.code !== code) {
                throw new Error('incorrect code argument');
            }
            if (query.grant_type !== 'authorization_code') {
                throw new Error('incorrect options.grant_type argument');
            }
            if (query.redirect_uri !== undefined) {
                throw new Error(`incorrect redirect_uri argument:${query.redirect_uri} !== undefined`);
            }
            return JSON.stringify({ access_token: accessToken, refresh_token: refreshToken });
        });

    const strategy = new BaseOAuth2Strategy(clientId, authorizationURL, tokenURL, verify);
    ctx.query = { code };
    const res = await strategy.authenticate(ctx);
    t.deepEqual(res.type, ActionType.SUCCESS, 'should be a success type');
    const { user: u, info: i } = (res as SuccessAction);
    t.deepEqual(u, user, 'should supply user');
    t.deepEqual(i, info, 'should supply info');
});

test('BaseOAuth2Strategy#authenticate, that was approved without redirect URI', async (t) => {
    const { clientId, authorizationURL, tokenURL, ctx } = t.context as TestContext;
    const code = 'SplxlOBeZQQYbYS6WxSbIA';
    const accessToken = '2YotnFZFEjr1zCsicMWpAA';
    const refreshToken = 'tGzv3JOkF0XG5Qx2TlKWIA';
    const user = { id: '1234' };
    const info = { message: 'Hello' };
    const verify = (at: string, rt: string, params, profile: object) => {
        if (at !== accessToken) {
            throw new Error('incorrect accessToken argument');
        }
        if (rt !== refreshToken) {
            throw new Error('incorrect refreshToken argument');
        }
        if (Object.keys(profile).length !== 0) {
            throw new Error('incorrect profile argument');
        }
        return Promise.resolve({ user, info });
    };

    const uri = parse(tokenURL);
    nock(`${uri.protocol}//${uri.host}`).post(uri.path)
        .reply(200, (requestUri, requestBody) => {
            const query = querystring.parse(requestBody);
            if (query.code !== code) {
                throw new Error('incorrect code argument');
            }
            if (query.grant_type !== 'authorization_code') {
                throw new Error('incorrect options.grant_type argument');
            }
            if (query.redirect_uri !== undefined) {
                throw new Error(`incorrect redirect_uri argument:${query.redirect_uri} !== undefined`);
            }
            return JSON.stringify({ access_token: accessToken, refresh_token: refreshToken });
        });

    const strategy = new BaseOAuth2Strategy(clientId, authorizationURL, tokenURL, verify);

    ctx.query = { code };
    const res = await strategy.authenticate(ctx);
    t.deepEqual(res.type, ActionType.SUCCESS, 'should be success type');
    const { user: u, info: i } = (res as SuccessAction);
    t.deepEqual(u, user, 'should supply user');
    t.deepEqual(i, info, 'should supply info');
});

test('BaseOAuth2Strategy#authenticate, that was approved with redirect URI', async (t) => {
    const { clientId, authorizationURL, tokenURL, callbackURL, ctx } = t.context as TestContext;
    const code = 'SplxlOBeZQQYbYS6WxSbIA';
    const accessToken = '2YotnFZFEjr1zCsicMWpAA';
    const refreshToken = 'tGzv3JOkF0XG5Qx2TlKWIA';
    const user = { id: '1234' };
    const info = { message: 'Hello' };
    const verify = (at: string, rt: string, params, profile: object) => {
        if (at !== accessToken) {
            throw new Error('incorrect accessToken argument');
        }
        if (rt !== refreshToken) {
            throw new Error('incorrect refreshToken argument');
        }
        if (Object.keys(profile).length !== 0) {
            throw new Error('incorrect profile argument');
        }
        return Promise.resolve({ user, info });
    };

    const uri = parse(tokenURL);
    nock(`${uri.protocol}//${uri.host}`).post(uri.path)
        .reply(200, (requestUri, requestBody) => {
            const query = querystring.parse(requestBody);
            if (query.code !== code) {
                throw new Error('incorrect code argument');
            }
            if (query.grant_type !== 'authorization_code') {
                throw new Error('incorrect options.grant_type argument');
            }
            if (query.redirect_uri !== callbackURL) {
                throw new Error(`incorrect redirect_uri argument:${query.redirect_uri} !== ${callbackURL}`);
            }
            return JSON.stringify({ access_token: accessToken, refresh_token: refreshToken });
        });

    const strategy = new BaseOAuth2Strategy(clientId, authorizationURL, tokenURL, verify,
        undefined, undefined, callbackURL);

    ctx.query = { code };
    const res = await strategy.authenticate(ctx);
    t.deepEqual(res.type, ActionType.SUCCESS, 'should be success type');
    const { user: u, info: i } = (res as SuccessAction);
    t.deepEqual(u, user, 'should supply user');
    t.deepEqual(i, info, 'should supply info');
});

test('BaseOAuth2Strategy#authenticate, that was approved with redirect URI option', async (t) => {
    const { clientId, authorizationURL, tokenURL, callbackURL, ctx } = t.context as TestContext;
    const code = 'SplxlOBeZQQYbYS6WxSbIA';
    const accessToken = '2YotnFZFEjr1zCsicMWpAA';
    const refreshToken = 'tGzv3JOkF0XG5Qx2TlKWIA';
    const user = { id: '1234' };
    const info = { message: 'Hello' };
    const verify = (at: string, rt: string, params, profile: object) => {
        if (at !== accessToken) {
            throw new Error('incorrect accessToken argument');
        }
        if (rt !== refreshToken) {
            throw new Error('incorrect refreshToken argument');
        }
        if (Object.keys(profile).length !== 0) {
            throw new Error('incorrect profile argument');
        }
        return Promise.resolve({ user, info });
    };

    const uri = parse(tokenURL);
    nock(`${uri.protocol}//${uri.host}`).post(uri.path)
        .reply(200, (requestUri, requestBody) => {
            const query = querystring.parse(requestBody);
            if (query.code !== code) {
                throw new Error('incorrect code argument');
            }
            if (query.grant_type !== 'authorization_code') {
                throw new Error('incorrect options.grant_type argument');
            }
            if (query.redirect_uri !== `${callbackURL}/atl`) {
                throw new Error(`incorrect redirect_uri argument:${query.redirect_uri} !== ${callbackURL}`);
            }
            return JSON.stringify({ access_token: accessToken, refresh_token: refreshToken });
        });

    const strategy = new BaseOAuth2Strategy(clientId, authorizationURL, tokenURL, verify,
        undefined, undefined, callbackURL);

    ctx.query = { code };
    const res = await strategy.authenticate(ctx, { callbackURL: `${callbackURL}/atl` });
    t.deepEqual(res.type, ActionType.SUCCESS, 'should be success type');
    const { user: u, info: i } = (res as SuccessAction);
    t.deepEqual(u, user, 'should supply user');
    t.deepEqual(i, info, 'should supply info');
});

test('BaseOAuth2Strategy#authenticate, that was approved with relative redirect URI option', async (t) => {
    const { clientId, authorizationURL, tokenURL, callbackURL, ctx } = t.context as TestContext;
    const code = 'SplxlOBeZQQYbYS6WxSbIA';
    const accessToken = '2YotnFZFEjr1zCsicMWpAA';
    const refreshToken = 'tGzv3JOkF0XG5Qx2TlKWIA';
    const user = { id: '1234' };
    const info = { message: 'Hello' };
    const verify = (at: string, rt: string, params, profile: object) => {
        if (at !== accessToken) {
            throw new Error('incorrect accessToken argument');
        }
        if (rt !== refreshToken) {
            throw new Error('incorrect refreshToken argument');
        }
        if (Object.keys(profile).length !== 0) {
            throw new Error('incorrect profile argument');
        }
        return Promise.resolve({ user, info });
    };

    const relativeCallbackURL = '/oauth/callback/alt';
    const uri = parse(tokenURL);
    nock(`${uri.protocol}//${uri.host}`).post(uri.path)
        .reply(200, (requestUri, requestBody) => {
            const query = querystring.parse(requestBody);
            if (query.code !== code) {
                throw new Error('incorrect code argument');
            }
            if (query.grant_type !== 'authorization_code') {
                throw new Error('incorrect options.grant_type argument');
            }
            if (query.redirect_uri !== resolve('https://test.com', relativeCallbackURL)) {
                throw new Error(`incorrect redirect_uri argument:${query.redirect_uri} !== ${callbackURL}`);
            }
            return JSON.stringify({ access_token: accessToken, refresh_token: refreshToken });
        });

    const strategy = new BaseOAuth2Strategy(clientId, authorizationURL, tokenURL, verify,
        undefined, undefined, callbackURL);

    ctx.req.headers = {
        'host': 'test.com',
        'x-forwarded-proto': 'https',
    };
    ctx.app.proxy = true;
    ctx.query = { code };
    const res = await strategy.authenticate(ctx, { callbackURL: relativeCallbackURL });
    t.deepEqual(res.type, ActionType.SUCCESS, 'should be success type');
    const { user: u, info: i } = (res as SuccessAction);
    t.deepEqual(u, user, 'should supply user');
    t.deepEqual(i, info, 'should supply info');
});

test('BaseOAuth2Strategy#authenticate, that was approved using verify callback that accepts params', async (t) => {
    const { clientId, authorizationURL, tokenURL, callbackURL, ctx } = t.context as TestContext;
    const code = 'SplxlOBeZQQYbYS6WxSbIA';
    const accessToken = '2YotnFZFEjr1zCsicMWpAA';
    const refreshToken = 'tGzv3JOkF0XG5Qx2TlKWIA';
    const user = { id: '1234' };
    const info = { message: 'Hello' };
    const example_param = 'twaetwqer';
    const verify = (at: string, rt: string, params, profile: object) => {
        if (at !== accessToken) {
            throw new Error('incorrect accessToken argument');
        }
        if (rt !== refreshToken) {
            throw new Error('incorrect refreshToken argument');
        }
        if (params.example_param !== example_param) {
            throw new Error('incorrect params argument');
        }
        if (Object.keys(profile).length !== 0) {
            throw new Error('incorrect profile argument');
        }
        return Promise.resolve({ user, info });
    };

    const uri = parse(tokenURL);
    nock(`${uri.protocol}//${uri.host}`).post(uri.path)
        .reply(200, (requestUri, requestBody) => {
            const query = querystring.parse(requestBody);
            if (query.code !== code) {
                throw new Error('incorrect code argument');
            }
            if (query.grant_type !== 'authorization_code') {
                throw new Error('incorrect options.grant_type argument');
            }
            if (query.redirect_uri !== callbackURL) {
                throw new Error(`incorrect redirect_uri argument:${query.redirect_uri} !== ${callbackURL}`);
            }
            return JSON.stringify({ access_token: accessToken, refresh_token: refreshToken, example_param });
        });

    const strategy = new BaseOAuth2Strategy(clientId, authorizationURL, tokenURL, verify,
        undefined, undefined, callbackURL);

    ctx.query = { code };
    const res = await strategy.authenticate(ctx);
    t.deepEqual(res.type, ActionType.SUCCESS, 'should be success type');
    const { user: u, info: i } = (res as SuccessAction);
    t.deepEqual(u, user, 'should supply user');
    t.deepEqual(i, info, 'should supply info');
});

test('BaseOAuth2Strategy#authenticate, that was approved using sessionStore', async (t) => {
    const { clientId, authorizationURL, tokenURL, ctx } = t.context as TestContext;
    const code = 'SplxlOBeZQQYbYS6WxSbIA';
    const accessToken = '2YotnFZFEjr1zCsicMWpAA';
    const refreshToken = 'tGzv3JOkF0XG5Qx2TlKWIA';
    const user = { id: '1234' };
    const info = { message: 'Hello' };
    const verify = (at: string, rt: string, params, profile: object) => {
        if (at !== accessToken) {
            throw new Error('incorrect accessToken argument');
        }
        if (rt !== refreshToken) {
            throw new Error('incorrect refreshToken argument');
        }
        if (Object.keys(profile).length !== 0) {
            throw new Error('incorrect profile argument');
        }
        return Promise.resolve({ user, info });
    };
    const strategy = new BaseOAuth2Strategy(
        clientId,
        authorizationURL,
        tokenURL,
        verify,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        true);
    const uri = parse(tokenURL);
    nock(`${uri.protocol}//${uri.host}`).post(uri.path)
        .reply(200, JSON.stringify({ access_token: accessToken, refresh_token: refreshToken }));
    (ctx as any).session = {};
    const firstRes = await strategy.authenticate(ctx);
    t.deepEqual(firstRes.type, ActionType.REDIRECT, 'should be a redirect type');
    const { url } = (firstRes as RedirectAction);
    const state = parse(url, true).query.state;
    ctx.query = { code, state };
    const secondRes = await strategy.authenticate(ctx);
    t.deepEqual(secondRes.type, ActionType.SUCCESS, 'should be a success type');
    const { user: u, info: i } = (secondRes as SuccessAction);
    t.deepEqual(u, user, 'should supply user');
    t.deepEqual(i, info, 'should supply info');
});

test('BaseOAuth2Strategy#authenticate, that fails due to verify callback supplying false', async (t) => {
    const { clientId, authorizationURL, tokenURL, callbackURL, ctx } = t.context as TestContext;
    const code = 'SplxlOBeZQQYbYS6WxSbIA';
    const accessToken = '2YotnFZFEjr1zCsicMWpAA';
    const refreshToken = 'tGzv3JOkF0XG5Qx2TlKWIA';
    const example_param = 'twaetwqer';
    const user = null;
    const info = undefined;
    const verify = (at: string, rt: string, params, profile: object) => Promise.resolve({ user, info });

    const uri = parse(tokenURL);
    nock(`${uri.protocol}//${uri.host}`).post(uri.path)
        .reply(200, (requestUri, requestBody) => {
            const query = querystring.parse(requestBody);
            if (query.code !== code) {
                throw new Error('incorrect code argument');
            }
            if (query.grant_type !== 'authorization_code') {
                throw new Error('incorrect options.grant_type argument');
            }
            if (query.redirect_uri !== callbackURL) {
                throw new Error(`incorrect redirect_uri argument:${query.redirect_uri} !== ${callbackURL}`);
            }
            return JSON.stringify({ access_token: accessToken, refresh_token: refreshToken, example_param });
        });

    const strategy = new BaseOAuth2Strategy(clientId, authorizationURL, tokenURL, verify,
        undefined, undefined, callbackURL);

    ctx.query = { code };
    const res = await strategy.authenticate(ctx);
    t.deepEqual(res.type, ActionType.FAIL, 'should be fail type');
    const { challenge, status } = (res as FailAction);
    // TODO, not sure 401 is the correct meaning
    t.is(status, 401, 'should return 401 status code');
    t.deepEqual(challenge, info, 'no info is supplied');
});

test('BaseOAuth2Strategy#authenticate, that fails due to state do not match in the second \
    authentication using sessionStore', async (t) => {
        const { clientId, authorizationURL, tokenURL, verify, ctx } = t.context as TestContext;
        const code: string = 's23d8dHgdfa';
        const strategy = new BaseOAuth2Strategy(
            clientId,
            authorizationURL,
            tokenURL,
            verify,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            true);
        (ctx as any).session = {};
        const firstRes = await strategy.authenticate(ctx);
        t.deepEqual(firstRes.type, ActionType.REDIRECT, 'should be a redirect type');
        const url = (firstRes as RedirectAction).url;
        const state = parse(url, true).query.state;
        ctx.query = { code, state: state + 'sdfd' };
        const secondRes = await strategy.authenticate(ctx);
        t.deepEqual(secondRes.type, ActionType.FAIL, 'should be a fail type');
        const { challenge, status } = (secondRes as FailAction);
        t.is(status, 403, 'should return 403 status code');
        t.deepEqual(challenge, 'Invalid authorization request state.'
            , 'message is supplied should match with which is supplied in sessionStore');
    });

test('BaseOAuth2Strategy#authenticate, that fails due to stateStore verify callback not supply\
  result field', async (t) => {
        const { clientId, authorizationURL, tokenURL, callbackURL, ctx } = t.context as TestContext;
        const code = 'SplxlOBeZQQYbYS6WxSbIA';
        const message = '';
        const verify = (at: string, rt: string, params, profile: object) => {
            throw Error('verify callback should not be called');
        };

        const baseStateStore: BaseStateStore = new BaseStateStore();
        baseStateStore.verify = (ctx: Koa.Context, providedState: string) => Promise.resolve({ message });

        const strategy = new BaseOAuth2Strategy(clientId, authorizationURL, tokenURL, verify,
            undefined, undefined, callbackURL, undefined, undefined, undefined, undefined, baseStateStore);

        ctx.query = { code };
        const res = await strategy.authenticate(ctx);
        t.deepEqual(res.type, ActionType.FAIL, 'should be fail type');
        const { challenge, status } = (res as FailAction);
        t.is(status, 403, 'should return 403 status code');
        t.deepEqual(challenge, message, 'no message is supplied');
    });

test('BaseOAuth2Strategy#authenticate, that fails due to stateStore verify callback supply\
  a false result', async (t) => {
        const { clientId, authorizationURL, tokenURL, callbackURL, ctx } = t.context as TestContext;
        const code = 'SplxlOBeZQQYbYS6WxSbIA';
        const verify = (at: string, rt: string, params, profile: object) => {
            throw Error('verify callback should not be called');
        };
        const message = '';
        const baseStateStore: BaseStateStore = new BaseStateStore();
        baseStateStore.verify = (ctx: Koa.Context, providedState: string) => Promise.resolve({ result: false, message });

        const strategy = new BaseOAuth2Strategy(clientId, authorizationURL, tokenURL, verify,
            undefined, undefined, callbackURL, undefined, undefined, undefined, undefined, baseStateStore);

        ctx.query = { code };
        const res = await strategy.authenticate(ctx);
        t.deepEqual(res.type, ActionType.FAIL, 'should be fail type');
        const { challenge, status } = (res as FailAction);
        t.is(status, 403, 'should return 403 status code');
        t.deepEqual(challenge, message, 'no message is supplied');
    });

test('BaseOAuth2Strategy#authenticate, that fails due to stateStore verify callback supply\
  a false result with a message', async (t) => {
        const { clientId, authorizationURL, tokenURL, callbackURL, ctx } = t.context as TestContext;
        const code = 'SplxlOBeZQQYbYS6WxSbIA';
        const verify = (at: string, rt: string, params, profile: object) => {
            throw Error('verify callback should not be called');
        };
        const message = 'error';
        const baseStateStore: BaseStateStore = new BaseStateStore();
        baseStateStore.verify = (ctx: Koa.Context, providedState: string) => Promise.resolve({ result: false, message });

        const strategy = new BaseOAuth2Strategy(clientId, authorizationURL, tokenURL, verify,
            undefined, undefined, callbackURL, undefined, undefined, undefined, undefined, baseStateStore);

        ctx.query = { code };
        const res = await strategy.authenticate(ctx);
        t.deepEqual(res.type, ActionType.FAIL, 'should be fail type');
        const { challenge, status } = (res as FailAction);
        t.is(status, 403, 'should return 403 status code');
        t.deepEqual(challenge, message, 'message should match');
    });

test('BaseOAuth2Strategy#authenticate, that fails due to verify callback supplying false \
    with additional info', async (t) => {
        const { clientId, authorizationURL, tokenURL, callbackURL, ctx } = t.context as TestContext;
        const code = 'SplxlOBeZQQYbYS6WxSbIA';
        const accessToken = '2YotnFZFEjr1zCsicMWpAA';
        const refreshToken = 'tGzv3JOkF0XG5Qx2TlKWIA';
        const user = null;
        const info = 'info info';
        const example_param = 'twaetwqer';
        const verify = (at: string, rt: string, params, profile: object) => Promise.resolve({ user, info });

        const uri = parse(tokenURL);
        nock(`${uri.protocol}//${uri.host}`).post(uri.path)
            .reply(200, (requestUri, requestBody) => {
                const query = querystring.parse(requestBody);
                if (query.code !== code) {
                    throw new Error('incorrect code argument');
                }
                if (query.grant_type !== 'authorization_code') {
                    throw new Error('incorrect options.grant_type argument');
                }
                if (query.redirect_uri !== callbackURL) {
                    throw new Error(`incorrect redirect_uri argument:${query.redirect_uri} !== ${callbackURL}`);
                }
                return JSON.stringify({ access_token: accessToken, refresh_token: refreshToken, example_param });
            });

        const strategy = new BaseOAuth2Strategy(clientId, authorizationURL, tokenURL, verify,
            undefined, undefined, callbackURL);

        ctx.query = { code };
        const res = await strategy.authenticate(ctx);
        t.deepEqual(res.type, ActionType.FAIL, 'should be fail type');
        const { challenge, status } = (res as FailAction);
        // TODO, not sure 401 is the correct meaning
        t.is(status, 401, 'should return 401 status code');
        t.deepEqual(challenge, info, 'no info is supplied');
    });

test('BaseOAuth2Strategy#authenticate, that was denied', async (t) => {
    const { clientId, authorizationURL, tokenURL, callbackURL, ctx } = t.context as TestContext;
    const error = 'access_denied';
    const verify = (at: string, rt: string, params, profile: object) => Promise.resolve({ user: null, info: null });
    const strategy = new BaseOAuth2Strategy(clientId, authorizationURL, tokenURL, verify,
        undefined, undefined, callbackURL);

    ctx.query = { error };
    const res = await strategy.authenticate(ctx);
    t.deepEqual(res.type, ActionType.FAIL, 'should be fail type');
    const { challenge, status } = (res as FailAction);
    // TODO, not sure 401 is the correct meaning
    t.is(status, 401, 'should return 401 status code');
    t.deepEqual(challenge, undefined, 'no info is supplied');
});

test('BaseOAuth2Strategy#authenticate, that was denied with description', async (t) => {
    const { clientId, authorizationURL, tokenURL, ctx } = t.context as TestContext;
    const error = 'access_denied';
    const error_description = 'werwq;lerkjqwe';
    const verify = (at: string, rt: string, params, profile: object) => Promise.resolve({ user: null, info: null });
    const strategy = new BaseOAuth2Strategy(clientId, authorizationURL, tokenURL, verify);

    ctx.query = { error, error_description };
    const res = await strategy.authenticate(ctx);
    t.deepEqual(res.type, ActionType.FAIL, 'should be fail type');
    const { challenge, status } = (res as FailAction);
    // TODO, not sure 401 is the correct meaning
    t.is(status, 401, 'should return 401 status code');
    t.deepEqual(challenge, error_description, 'no info is supplied');
});

test('BaseOAuth2Strategy#authenticate, that was returned with an error without description', async (t) => {
    const { clientId, authorizationURL, tokenURL, ctx } = t.context as TestContext;
    const error = 'invalid_scope';
    const verify = (at: string, rt: string, params, profile: object) => Promise.resolve({ user: null, info: null });
    const strategy = new BaseOAuth2Strategy(clientId, authorizationURL, tokenURL, verify);

    ctx.query = { error };
    const err: AuthorizationError = await t.throws(strategy.authenticate(ctx), AuthorizationError,
        'should throw an AuthorizationError');
    t.deepEqual(err.message, '', 'should have no err msg');
    t.deepEqual(err.code, error, 'should have a err code of invalid_scope');
    t.deepEqual(err.uri, undefined, 'should have no err uri');
    t.deepEqual(err.status, 500, 'should have a status of 500');
});

test('BaseOAuth2Strategy#authenticate, that was returned with an error with description', async (t) => {
    const { clientId, authorizationURL, tokenURL, ctx } = t.context as TestContext;
    const error = 'invalid_scope';
    const error_description = 'asdfsadf';
    const verify = (at: string, rt: string, params, profile: object) => Promise.resolve({ user: null, info: null });
    const strategy = new BaseOAuth2Strategy(clientId, authorizationURL, tokenURL, verify);

    ctx.query = { error, error_description };
    const err: AuthorizationError = await t.throws(strategy.authenticate(ctx), AuthorizationError,
        'should throw an AuthorizationError');
    t.deepEqual(err.message, error_description, 'should have err msg');
    t.deepEqual(err.code, error, 'should have a err code of invalid_scope');
    t.deepEqual(err.uri, undefined, 'should have no err uri');
    t.deepEqual(err.status, 500, 'should have a status of 500');
});

test('BaseOAuth2Strategy#authenticate, that was returned with an error with description and link', async (t) => {
    const { clientId, authorizationURL, tokenURL, ctx } = t.context as TestContext;
    const error = 'invalid_scope';
    const error_description = 'asdfsadf';
    const error_uri = 'http://error';
    const verify = (at: string, rt: string, params, profile: object) => Promise.resolve({ user: null, info: null });
    const strategy = new BaseOAuth2Strategy(clientId, authorizationURL, tokenURL, verify);

    ctx.query = { error, error_description, error_uri };
    const err: AuthorizationError = await t.throws(strategy.authenticate(ctx), AuthorizationError,
        'should throw an AuthorizationError');
    t.deepEqual(err.message, error_description, 'should have err msg');
    t.deepEqual(err.code, error, 'should have a err code of invalid_scope');
    t.deepEqual(err.uri, error_uri, 'should have err uri');
    t.deepEqual(err.status, 500, 'should have a status of 500');
});

test('BaseOAuth2Strategy#authenticate, that errors due to token request error', async (t) => {
    const { clientId, authorizationURL, tokenURL, ctx } = t.context as TestContext;
    const code = 'SplxlOBeZQQYbYS6WxSbIA';
    const verify = (at: string, rt: string, params, profile: object) => {
        throw Error('verify callback should not be called');
    };
    const strategy = new BaseOAuth2Strategy(clientId, authorizationURL, tokenURL, verify);

    const uri = parse(tokenURL);
    nock(`${uri.protocol}//${uri.host}`).post(uri.path)
        .reply(200, 'error');

    ctx.query = { code };
    const err: OAuth2Error = await t.throws(strategy.authenticate(ctx), OAuth2Error, 'should throw an OAuth2Error');
    t.truthy(err.message.indexOf('Failed to obtain access token') !== -1,
        'should have err msg of \'Failed to obtain access token\'');
    t.deepEqual(err.status, 400, 'should have a status of 400');
});

test('BaseOAuth2Strategy#authenticate, that errors due to token request error, in node-oauth object literal \
form with OAuth 2.0-compatible body', async (t) => {
        const { clientId, authorizationURL, tokenURL, ctx } = t.context as TestContext;
        const code = 'SplxlOBeZQQYbYS6WxSbIA';
        const verify = (at: string, rt: string, params, profile: object) => {
            throw Error('verify callback should not be called');
        };
        const strategy = new BaseOAuth2Strategy(clientId, authorizationURL, tokenURL, verify);
        const error_description = 'The provided value for the input parameter \'code\' is not valid.';
        const error = 'invalid_grant';
        const uri = parse(tokenURL);
        nock(`${uri.protocol}//${uri.host}`).post(uri.path)
            .reply(400, `{"error":"${error}","error_description":"${error_description}"} `);

        ctx.query = { code };
        const err: TokenError = await t.throws(strategy.authenticate(ctx), TokenError, 'should throw an TokenError');
        t.deepEqual(err.message, `Failed to obtain access token:${error_description}`, 'should have err message');
        t.is(err.status, 400, 'should have a status of 400');
        t.deepEqual(err.code, error, 'should have a err code of invalid_grant');
    });

test('BaseOAuth2Strategy#authenticate, that errors due to token request error, in node-oauth object literal\
 form with JSON body', async (t) => {
        const { clientId, authorizationURL, tokenURL, ctx } = t.context as TestContext;
        const code = 'SplxlOBeZQQYbYS6WxSbIA';
        const verify = (at: string, rt: string, params, profile: object) => {
            throw Error('verify callback should not be called');
        };
        const strategy = new BaseOAuth2Strategy(clientId, authorizationURL, tokenURL, verify);

        const error = 'invalid_grant';
        const uri = parse(tokenURL);
        nock(`${uri.protocol}//${uri.host}`).post(uri.path)
            .reply(400, `{"error":"${error}"}`);

        ctx.query = { code };
        const err: TokenError = await t.throws(strategy.authenticate(ctx), TokenError, 'should throw an TokenError');
        t.truthy(err.message.indexOf('Failed to obtain access token') !== -1,
            'should have err msg of \'Failed to obtain access token\'');
        t.is(err.status, 400, 'should have a status of 400');
        t.deepEqual(err.code, error, 'should have a err code of invalid_grant');
    });

test('BaseOAuth2Strategy#authenticate, that errors due to token request error, \
with a non-json format', async (t) => {
        const { clientId, authorizationURL, tokenURL, ctx } = t.context as TestContext;
        const code = 'SplxlOBeZQQYbYS6WxSbIA';
        const verify = (at: string, rt: string, params, profile: object) => {
            throw Error('verify callback should not be called');
        };
        const strategy = new BaseOAuth2Strategy(clientId, authorizationURL, tokenURL, verify);

        const error = 'invalid_grant';
        const uri = parse(tokenURL);
        nock(`${uri.protocol}//${uri.host}`).post(uri.path)
            .reply(400, error);

        ctx.query = { code };
        const err: OAuth2Error = await t.throws(strategy.authenticate(ctx), OAuth2Error, 'should throw an OAuth2Error');
        t.truthy(err.message.indexOf('Failed to obtain access token') !== -1,
            'should have err msg of \'Failed to obtain access token\'');
        t.truthy(err.message.indexOf(error) !== -1, 'should include \'invalid_grant\' error message');
        t.is(err.status, 400, 'should have a status of 400');
    });

test('BaseOAuth2Strategy#authenticate, that errors due to request read stream error', async (t) => {
    const { clientId, authorizationURL, tokenURL, ctx } = t.context as TestContext;
    const code = 'SplxlOBeZQQYbYS6WxSbIA';
    const verify = (at: string, rt: string, params, profile: object) => {
        throw Error('verify callback should not be called');
    };
    const strategy = new BaseOAuth2Strategy(clientId, authorizationURL, tokenURL, verify);
    const errMessage = 'an error';
    const uri = parse(tokenURL);
    nock(`${uri.protocol}//${uri.host}`).post(uri.path).replyWithError(errMessage);

    ctx.query = { code };
    await t.throws(
        strategy.authenticate(ctx),
        `Failed to obtain access token:${errMessage}`,
        'should throw an OAuth2Error',
    );
});

test('BaseOAuth2Strategy#authenticate, that errors due to token request error, in node-oauth object literal form\
  with text body', async (t) => {
        const { clientId, authorizationURL, tokenURL, ctx } = t.context as TestContext;
        const code = 'SplxlOBeZQQYbYS6WxSbIA';
        const verify = (at: string, rt: string, params, profile: object) => {
            throw Error('verify callback should not be called');
        };
        const strategy = new BaseOAuth2Strategy(clientId, authorizationURL, tokenURL, verify);

        const error = 'server_internal_error';
        const uri = parse(tokenURL);
        nock(`${uri.protocol}//${uri.host}`).post(uri.path)
            .reply(500, `{"error":"${error}"}`);

        ctx.query = { code };
        const err: TokenError = await t.throws(strategy.authenticate(ctx), TokenError, 'should throw an TokenError');
        t.truthy(err.message.indexOf('Failed to obtain access token') !== -1,
            'should have err msg of \'Failed to obtain access token\'');
        t.is(err.status, 500, 'should have a status of 500');
    });

test('BaseOAuth2Strategy#authenticate, that errors due to verify callback supplying error', async (t) => {
    const { clientId, authorizationURL, tokenURL, ctx } = t.context as TestContext;
    const code = 'SplxlOBeZQQYbYS6WxSbIA';
    const accessToken = '2YotnFZFEjr1zCsicMWpAA';
    const refreshToken = 'tGzv3JOkF0XG5Qx2TlKWIA';
    const verify = (at: string, rt: string, params, profile: object) => {
        throw Error('verify callback should be called');
    };
    const strategy = new BaseOAuth2Strategy(clientId, authorizationURL, tokenURL, verify);

    const uri = parse(tokenURL);
    nock(`${uri.protocol}//${uri.host}`).post(uri.path)
        .reply(200, JSON.stringify({ access_token: accessToken, refresh_token: refreshToken }));

    ctx.query = { code };
    const err: Error = await t.throws(strategy.authenticate(ctx), Error,
        'should throw an Error');
    t.deepEqual(err.message, 'verify callback should be called',
        'should have err msg of \'Failed to obtain access token\'');
});

test('BaseOAuth2Strategy#authenticate, that redirects with a proxy which is trusted by app and sets \
    x-forward-proto and x-forwarded-host', async (t) => {
        const { clientId, authorizationURL, tokenURL, callbackURL, ctx } = t.context as TestContext;
        const code = 'SplxlOBeZQQYbYS6WxSbIA';
        const accessToken = '2YotnFZFEjr1zCsicMWpAA';
        const refreshToken = 'tGzv3JOkF0XG5Qx2TlKWIA';
        const user = { id: '1234' };
        const info = { message: 'Hello' };
        const verify = (at: string, rt: string, params, profile: object) => {
            if (at !== accessToken) {
                throw new Error('incorrect accessToken argument');
            }
            if (rt !== refreshToken) {
                throw new Error('incorrect refreshToken argument');
            }
            if (Object.keys(profile).length !== 0) {
                throw new Error('incorrect profile argument');
            }
            return Promise.resolve({ user, info });
        };

        const relativeCallbackURL = '/oauth/callback/alt';
        const uri = parse(tokenURL);
        nock(`${uri.protocol}//${uri.host}`).post(uri.path)
            .reply(200, (requestUri, requestBody) => {
                const query = querystring.parse(requestBody);
                if (query.code !== code) {
                    throw new Error('incorrect code argument');
                }
                if (query.grant_type !== 'authorization_code') {
                    throw new Error('incorrect options.grant_type argument');
                }
                if (query.redirect_uri !== resolve('https://test.com', relativeCallbackURL)) {
                    throw new Error(`incorrect redirect_uri argument:${query.redirect_uri} !==\
                        ${resolve('https://test.com', relativeCallbackURL)}`);
                }
                return JSON.stringify({ access_token: accessToken, refresh_token: refreshToken });
            });

        const strategy = new BaseOAuth2Strategy(clientId, authorizationURL, tokenURL, verify,
            undefined, undefined, callbackURL);
        ctx.req.headers = {
            'host': 'server.internal',
            'x-forwarded-proto': 'https',
            'x-forwarded-host': 'test.com',
        };
        ctx.app.proxy = true;
        ctx.query = { code };
        const res = await strategy.authenticate(ctx, { callbackURL: relativeCallbackURL });
        t.deepEqual(res.type, ActionType.SUCCESS, 'should be success type');
        const { user: u, info: i } = (res as SuccessAction);
        t.deepEqual(u, user, 'should supply user');
        t.deepEqual(i, info, 'should supply info');
    });
