// tslint:disable:only-arrow-functions
import test from 'ava';
import { Agent } from 'http';
import * as nock from 'nock';
import { parse } from 'url';
import { OAuth2, OAuth2Error } from '../../src/utils';

interface TestContext {
    clientId: string;
    baseSite: string;
    clientSecret: string;
    authorizeUrl: string;
    accessTokenUrl: string;
}

test.beforeEach('init some properties', (t) => {
    const baseSite = `http://baseSite${Math.random()}`;
    t.context = {
        clientId: 'clientID',
        baseSite,
        clientSecret: 'clientSecret',
        authorizeUrl: '/authorizeUrl',
        accessTokenUrl: '/accessTokenUrl',
    };
});

// test line by line
test('OAuth2Error#constructor', (t) => {
    const status = 909;
    const msg = 'asdf';
    const error = new OAuth2Error(status, msg);
    t.deepEqual(error.status, status, 'status');
    t.deepEqual(error.message, msg, 'message');
});

test('OAuth2#Properties', (t) => {
    const { clientId, clientSecret, baseSite, authorizeUrl, accessTokenUrl } = t.context as TestContext;
    const oauth2 = new OAuth2(clientId, clientSecret, baseSite, authorizeUrl, accessTokenUrl, undefined);

    t.deepEqual(oauth2.Agent, undefined, 'Agent default to undefined');
    const agent = new Agent();
    oauth2.Agent = agent;
    t.is(oauth2.Agent, agent, 'Agent set to agent');

    t.deepEqual(oauth2.AccessTokenName, 'access_token', 'AccessTokenName default to access_token');
    oauth2.AccessTokenName = 'accessx';
    t.deepEqual(oauth2.AccessTokenName, 'accessx', 'AccessTokenName set to accessx');

    t.deepEqual(oauth2.AuthMethod, 'Bearer', 'AuthMethod default to Bearer');
    oauth2.AuthMethod = 'Basic';
    t.deepEqual(oauth2.AuthMethod, 'Basic', 'AuthMethod set to Basic');

    t.deepEqual(oauth2.UseAuthorizationHeaderForGET, false, 'UseAuthorizationHeaderForGET default to false');
    oauth2.UseAuthorizationHeaderForGET = true;
    t.deepEqual(oauth2.UseAuthorizationHeaderForGET, true, 'UseAuthorizationHeaderForGET set to true');

    t.deepEqual(oauth2.ClientId, clientId, 'ClientId');
    t.deepEqual(oauth2.AuthorizeUrl, authorizeUrl, 'AuthorizeUrl');
});

test('OAuth2#constructor', (t) => {
    const { clientId, clientSecret, baseSite } = t.context as TestContext;
    const oauth2 = new OAuth2(clientId, clientSecret, baseSite, undefined, undefined, undefined);

    t.deepEqual(oauth2.getAuthorizeUrl({}), `${baseSite}/oauth/authorize?client_id=${clientId}`,
        `the default value of authorizeUrl is '/oauth/authorize'`);
});

test('OAuth2#buildAuthHeader', (t) => {
    const { clientId, clientSecret, baseSite } = t.context as TestContext;
    const oauth2 = new OAuth2(clientId, clientSecret, baseSite, undefined, undefined, undefined);

    const testToken = 'test token';
    t.deepEqual(oauth2.buildAuthHeader(testToken), `Bearer ${testToken}`, 'the authHeader should start with Bearer');

});

test('OAuth2#getAuthorizeUrl', (t) => {
    const { clientId, clientSecret, baseSite, authorizeUrl, accessTokenUrl } = t.context as TestContext;
    const oauth2 = new OAuth2(clientId, clientSecret, baseSite, authorizeUrl, accessTokenUrl, undefined);

    const params = { asdf: '123' };
    t.deepEqual(oauth2.getAuthorizeUrl(), `${baseSite}${authorizeUrl}?client_id=${clientId}`,
        'default params is empty');
    t.deepEqual(oauth2.getAuthorizeUrl(params), `${baseSite}${authorizeUrl}?asdf=123&client_id=${clientId}`,
        'convert params to query string');
});

test('OAuth2#getOAuthAccessToken, extract the token', async (t) => {
    const { clientId, clientSecret, baseSite } = t.context as TestContext;
    const oauth2 = new OAuth2(clientId, clientSecret, baseSite, undefined, undefined, undefined);

    nock(baseSite).post('/oauth/access_token').reply(200, 'access_token=access&refresh_token=refresh');
    let { accessToken, refreshToken } = await oauth2.getOAuthAccessToken('');
    t.deepEqual(accessToken, 'access', 'accessToken#should correctly extract the token if received as form-data');
    t.deepEqual(refreshToken, 'refresh', 'refreshToken#should correctly extract the token if received as form-data');

    nock(baseSite).post('/oauth/access_token').reply(200, '{"access_token":"access","refresh_token":"refresh"}');
    ({ accessToken, refreshToken } = await oauth2.getOAuthAccessToken(''));
    t.deepEqual(accessToken, 'access', 'access#should correctly extract the token if received as a JSON literal');
    t.deepEqual(refreshToken, 'refresh', 'refresh#should correctly extract the token if received as a JSON literal');

});

test('OAuth2#getOAuthAccessToken, extract the result', async (t) => {
    const { clientId, clientSecret, baseSite } = t.context as TestContext;
    const oauth2 = new OAuth2(clientId, clientSecret, baseSite, undefined, undefined, undefined);

    nock(baseSite).post('/oauth/access_token')
        .reply(200, '{"access_token":"access","refresh_token":"refresh","extra_1":1, "extra_2":"foo"}');
    const { result, accessToken, refreshToken } = await oauth2.getOAuthAccessToken('');
    t.deepEqual(accessToken, 'access', 'access#should return the received data to the calling method');
    t.deepEqual(refreshToken, 'refresh', 'access#should return the received data to the calling method');
    t.not(result, null, 'result#should not be null');
    t.deepEqual(result.extra_1, 1, 'result.extra_1#should return the received data to the calling method');
    t.deepEqual(result.extra_2, 'foo', 'result.extra_2#should return the received data to the calling method');
});

test('OAuth2#getOAuthAccessToken, when no accessToken is return', async (t) => {
    const { clientId, clientSecret, baseSite } = t.context as TestContext;
    const oauth2 = new OAuth2(clientId, clientSecret, baseSite, undefined, undefined, undefined);

    nock(baseSite).post('/oauth/access_token')
        .reply(200, `{'refresh_token':'refresh'}`);
    let err: OAuth2Error = await t.throws(oauth2.getOAuthAccessToken(''), OAuth2Error, 'should throw a OAuth2Error');
    t.is(err.status, 400, 'the status should be 400');
    t.is(err.message, JSON.stringify({ client_id: clientId, client_secret: clientSecret, code: '' }),
        'the data should be JSON str of params');

    nock(baseSite).post('/oauth/access_token').reply(200, `{'access_token:'access'}`);
    oauth2.AccessTokenName = 'another';
    err = await t.throws(oauth2.getOAuthAccessToken(''), OAuth2Error,
        `should thorw OAuth2Error if the accessToken with custome name don't return`);
    t.is(err.status, 400, 'custom token name#the status should be 400');
    t.is(err.message, JSON.stringify({ client_id: clientId, client_secret: clientSecret, code: '' }),
        'custom token name#the data should be JSON str of params');
});

test('OAuth2#getOAuthAccessToken, when no grant_type parameter is specified', async (t) => {
    const { clientId, clientSecret, baseSite } = t.context as TestContext;
    const oauth2 = new OAuth2(clientId, clientSecret, baseSite, undefined, undefined, undefined);

    nock(baseSite).post('/oauth/access_token').reply((uri, requestBody) => {
        t.truthy(requestBody.indexOf('code=xsds23') !== -1,
            'should pass the value of the code argument as the code parameter');
        return { access_token: 'access' };
    });
    await oauth2.getOAuthAccessToken('xsds23');

});

test('OAuth2#getOAuthAccessToken, when an invalid grant_type parameter is specified', async (t) => {
    const { clientId, clientSecret, baseSite } = t.context as TestContext;
    const oauth2 = new OAuth2(clientId, clientSecret, baseSite, undefined, undefined, undefined);

    nock(baseSite).post('/oauth/access_token').reply((uri, requestBody) => {
        t.truthy(requestBody.indexOf('code=xsds23') !== -1,
            'should pass the value of the code argument as the code parameter');
        return { access_token: 'access' };
    });
    await oauth2.getOAuthAccessToken('xsds23', { grant_type: 'refresh_toucan' });
});

test(`OAuth2#getOAuthAccessToken, when a grant_type parameter of value 'refresh_token' is specified`, async (t) => {
    const { clientId, clientSecret, baseSite } = t.context as TestContext;
    const oauth2 = new OAuth2(clientId, clientSecret, baseSite, undefined, undefined, undefined);

    nock(baseSite).post('/oauth/access_token').reply((uri, requestBody) => {
        t.truthy(requestBody.indexOf('refresh_token=sdsds2') !== -1,
            'should pass the value of the code argument as the refresh_token parameter');
        t.truthy(requestBody.indexOf('grant_type=refresh_token') !== -1, 'should pass a grant_type parameter');
        t.truthy(requestBody.indexOf('code=') === -1, 'but shouldn\'t pass a code parameter');
        return { access_token: 'access' };
    });
    await oauth2.getOAuthAccessToken('sdsds2', { grant_type: 'refresh_token' });
});

test('OAuth2#get, normal', async (t) => {
    const { clientId, clientSecret, baseSite } = t.context as TestContext;
    const oauth2 = new OAuth2(clientId, clientSecret, baseSite, undefined, undefined, undefined);

    nock(baseSite).get('/oauth').reply(201, true);
    let { result } = await oauth2.get(`${baseSite}/oauth`, '');
    t.truthy(result, 'we should treat a 201 response as a success');

    nock(baseSite).get('/oauth').reply(200, true);
    ({ result } = await oauth2.get(`${baseSite}/oauth`, ''));
    t.truthy(result, 'we should treat a 200 response as a success');

});

test('OAuth2#get, when using the authorization header', async (t) => {
    const { clientId, clientSecret, baseSite } = t.context as TestContext;
    const oauth2 = new OAuth2(clientId, clientSecret, baseSite, undefined, undefined, undefined);

    nock(baseSite).get('/').reply(function(uri, requestBody) {
        t.truthy(!('access_token' in parse(this.req.path, true).query), 'access_token not present in query');
        t.truthy(('authorization' in this.req.headers), 'Authorization in headers');
    });
    oauth2.UseAuthorizationHeaderForGET = true;
    await oauth2.get(`${baseSite}/`, 'BadNews');

    nock(baseSite).get('/').reply(function(uri, requestBody) {
        t.deepEqual(this.req.headers.authorization, 'Bearer abcd5',
            'get with the default authorization method#should pass the authorization header with Bearer method');
        t.is(parse(this.req.path, true).query.access_token, undefined,
            'get with the default authorization method#should be passed a undefined access_token');
        return { access_token: 'access' };
    });
    oauth2.UseAuthorizationHeaderForGET = true;
    await oauth2.get(baseSite, 'abcd5');

    nock(baseSite).get('/').reply(function(uri, requestBody) {
        t.deepEqual(this.req.headers.authorization, 'Basic cdg2',
            'get with the Basic authorization method#should pass the authorization header with Basic method');
        t.is(parse(this.req.path, true).query.access_token, undefined,
            'get with the Basic authorization method#should be passed a undefined access_token');
        return { access_token: 'access' };
    });
    oauth2.UseAuthorizationHeaderForGET = true;
    oauth2.AuthMethod = 'Basic';
    await oauth2.get(baseSite, 'cdg2');
});

test('OAuth2#get, when do not use the authorization header', async (t) => {
    const { clientId, clientSecret, baseSite } = t.context as TestContext;
    const oauth2 = new OAuth2(clientId, clientSecret, baseSite, undefined, undefined, undefined);

    nock(baseSite).get('/').query({ access_token: 'accessx' }).reply(function(uri, requestBody) {
        t.truthy(('access_token' in parse(this.req.path, true).query), 'access_token in query');
        t.truthy(!('authorization' in this.req.headers), 'Authorization not in headers');
    });
    oauth2.UseAuthorizationHeaderForGET = false;
    await oauth2.get(`${baseSite}/`, 'accessx');

    nock(baseSite).get('/').query({ access_token: 'abcd5' }).reply(function(uri, requestBody) {
        t.is(this.req.headers.authorization, undefined,
            'get#should pass NOT provide an authorization header');
        t.is(parse(this.req.path, true).query.access_token, 'abcd5',
            'get#the access_token should be being passed');
        return { access_token: 'access' };
    });
    oauth2.UseAuthorizationHeaderForGET = false;
    await oauth2.get(baseSite, 'abcd5');
});

test('OAuth2#request, normal', async (t) => {
    const { clientId, clientSecret, baseSite } = t.context as TestContext;
    const customerHeader = { SomeHeader: '123' };
    const oauth2 = new OAuth2(clientId, clientSecret, baseSite, undefined, undefined, customerHeader);

    nock(baseSite).get('/').reply(function(uri, requestBody) {
        const headers = this.req.headers;
        t.deepEqual(headers.someheader, '123',
            'should see the custom headers in constructor mixed into headers passed to http-library');
        t.deepEqual(headers['content-length'], 0, 'when no postBody is passed, the content-length should be 0');
        return { access_token: 'access' };
    });
    await oauth2.request('GET', baseSite);

    nock(baseSite).get('/').reply(function(uri, requestBody) {
        const headers = this.req.headers;
        t.deepEqual(headers.someheader, '123',
            'should see the custom headers in constructor mixed into headers passed to http-library');
        t.deepEqual(headers['content-type'], 'text/plain',
            'should see the custom headers in request mixed into headers passed to http-library');
        t.deepEqual(headers['content-length'], 0, 'when no postBody is passed, the content-length should be 0');
        return { access_token: 'access' };
    });
    await oauth2.request('GET', baseSite, { 'Content-Type': 'text/plain' });

});

test('OAuth2#request, when the User-Agent is passed', async (t) => {
    const { clientId, clientSecret, baseSite } = t.context as TestContext;
    const customerHeader = { 'User-Agent': 'in consturctor' };
    const oauth2 = new OAuth2(clientId, clientSecret, baseSite, undefined, undefined, customerHeader);

    nock(baseSite).get('/').reply(function(uri, requestBody) {
        t.deepEqual(this.req.headers['user-agent'], 'in consturctor',
            'should see the custom headers mixed into headers passed to http-library');
        return { access_token: 'access' };
    });
    await oauth2.request('GET', baseSite);

    nock(baseSite).get('/').reply(function(uri, requestBody) {
        t.deepEqual(this.req.headers['user-agent'], 'in request',
            'the costom header in request will override the one in constrctor');
        return { access_token: 'access' };
    });
    await oauth2.request('GET', baseSite, { 'User-Agent': 'in request' });
});

test('OAuth2#request, when no User-Agent custom headers is passed', async (t) => {
    const { clientId, clientSecret, baseSite } = t.context as TestContext;
    const oauth2 = new OAuth2(clientId, clientSecret, baseSite, undefined, undefined, undefined);

    nock(baseSite).get('/').reply(function(uri, requestBody) {
        t.deepEqual(this.req.headers['user-agent'], 'Node-oauth',
            'should see the default User-Agent header mixed into headers passed to http-library');
        return { access_token: 'access' };
    });
    await oauth2.request('GET', baseSite);

    nock(baseSite).get('/').reply(function(uri, requestBody) {
        t.deepEqual(this.req.headers['user-agent'], 'in request',
            'the costom header in request will be passed');
        return { access_token: 'access' };
    });
    await oauth2.request('GET', baseSite, { 'User-Agent': 'in request' });
});

test('OAuth2#request, when no accessToken is passed', async (t) => {
    const { clientId, clientSecret, baseSite } = t.context as TestContext;
    const oauth2 = new OAuth2(clientId, clientSecret, baseSite, undefined, undefined, undefined);

    nock(baseSite).get('/').reply(200, true);
    const result = await oauth2.request('GET', baseSite);
    t.truthy(result, 'we should get path without queryStr');

});

test('OAuth2#request, when accessToken is passed', async (t) => {
    const { clientId, clientSecret, baseSite } = t.context as TestContext;
    const oauth2 = new OAuth2(clientId, clientSecret, baseSite, undefined, undefined, undefined);

    nock(baseSite).get('/').query({ access_token: 'access' }).reply(200, true);
    let result = await oauth2.request('GET', baseSite, undefined, undefined, 'access');
    t.truthy(result, 'we should get path with queryStr');

    oauth2.AccessTokenName = 'accessx';
    nock(baseSite).get('/').query({ accessx: 'access' }).reply(200, true);
    result = await oauth2.request('GET', baseSite, undefined, undefined, 'access');
    t.truthy(result, 'we should get path with queryStr with custom accessTokenName');
});

test('OAuth2#request, https', async (t) => {
    const { clientId, clientSecret, baseSite } = t.context as TestContext;
    const uri = parse(baseSite);
    const httpsSite = `https://${uri.host}:443`;
    const oauth2 = new OAuth2(clientId, clientSecret, httpsSite, undefined, undefined, undefined);

    nock(httpsSite).get('/').reply(200, true);
    const { result } = await oauth2.request('GET', httpsSite);
    t.truthy(result, 'the default port of https is 443');
});

test('OAuth2#request, when agent', async (t) => {
    const { clientId, clientSecret, baseSite } = t.context as TestContext;
    const oauth2 = new OAuth2(clientId, clientSecret, baseSite, undefined, undefined, undefined);

    const agent = new Agent({ keepAlive: true });
    oauth2.Agent = agent;
    nock(baseSite).get('/').reply(200, 'agent');
    const result = await oauth2.request('GET', baseSite);
    t.truthy(result, 'agent is set');
});

test('OAuth2#request, when POSTing', async (t) => {
    const { clientId, clientSecret, baseSite } = t.context as TestContext;
    const oauth2 = new OAuth2(clientId, clientSecret, baseSite, undefined, undefined, undefined);

    let content: string | Buffer = 'THIS_IS_A_POST_BODY_STRING';
    nock(baseSite).post('/').reply(function(uri, requestBody) {
        const headers = this.req.headers;
        t.deepEqual(headers['content-type'], 'text/plain', 'string#get the right headers');
        t.deepEqual(headers['content-length'], Buffer.byteLength(content as string),
            'string#get the right content-length');
        t.deepEqual(requestBody, content, 'string#get the right body');
    });
    await oauth2.request('POST', baseSite, { 'Content-Type': 'text/plain' }, content);

    content = new Buffer(content);
    nock(baseSite).post('/').reply(function(uri, requestBody) {
        const headers = this.req.headers;
        t.deepEqual(headers['content-type'], 'application/octet-stream', 'buffer#get the right headers');
        t.deepEqual(headers['content-length'], content.length, 'buffer#get the right content-length');
        t.deepEqual(new Buffer(requestBody), content, 'buffer#get the right body');
    });
    await oauth2.request('POST', baseSite, { 'Content-Type': 'application/octet-stream' }, content);
});

test('OAuth2#request, when PUTing', async (t) => {
    const { clientId, clientSecret, baseSite } = t.context as TestContext;
    const oauth2 = new OAuth2(clientId, clientSecret, baseSite, undefined, undefined, undefined);

    let content: string | Buffer = 'THIS_IS_A_POST_BODY_STRING';
    nock(baseSite).put('/').reply(function(uri, requestBody) {
        const headers = this.req.headers;
        t.deepEqual(headers['content-type'], 'text/plain', 'string#get the right headers');
        t.deepEqual(headers['content-length'], Buffer.byteLength(content as string),
            'string#get the right content-length');
        t.deepEqual(requestBody, content, 'string#get the right body');
    });
    await oauth2.request('PUT', baseSite, { 'Content-Type': 'text/plain' }, content);

    content = new Buffer(content);
    nock(baseSite).put('/').reply(function(uri, requestBody) {
        const headers = this.req.headers;
        t.deepEqual(headers['content-type'], 'application/octet-stream', 'buffer#get the right headers');
        t.deepEqual(headers['content-length'], content.length, 'buffer#get the right content-length');
        t.deepEqual(new Buffer(requestBody), content, 'buffer#get the right body');
    });
    await oauth2.request('PUT', baseSite, { 'Content-Type': 'application/octet-stream' }, content);

});

test('OAuth2#request, when error', async (t) => {
    const { clientId, clientSecret, baseSite } = t.context as TestContext;
    const customerHeader = { SomeHeader: '123' };
    const oauth2 = new OAuth2(clientId, clientSecret, baseSite, undefined, undefined, customerHeader);

    nock(baseSite).get('/').replyWithError('a error');
    let err: Error | OAuth2Error = await t.throws(oauth2.request('GET', baseSite), Error,
        'should throw a error when a error event is emited');
    t.deepEqual(err.message, 'a error');

    nock(baseSite).get('/').reply(500, 'a 500 error');
    err = await t.throws(oauth2.request('GET', baseSite), OAuth2Error,
        'should throw a error when a error event is emited');
    t.deepEqual(err.message, 'a 500 error');
    t.deepEqual((err as OAuth2Error).status, 500);
});
