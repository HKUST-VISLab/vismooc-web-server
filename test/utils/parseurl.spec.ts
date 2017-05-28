import test from 'ava';
import { parseurl } from '../../src/utils';

function createReq(url?, originalUrl?) {
    return {
        originalUrl,
        url,
    };
}

test('should parse the requrst URL', t => {
    const req = createReq('/foo/bar');
    const url = parseurl.parseurl(req);
    t.falsy(url.host);
    t.falsy(url.hostname);
    t.deepEqual(url.href, '/foo/bar');
    t.deepEqual(url.pathname, '/foo/bar');
    t.falsy(url.port);
    t.falsy(url.query);
    t.falsy(url.search);
});

test('should parse with query string', t => {
    const req = createReq('/foo/bar?fizz=buzz');
    const url = parseurl.parseurl(req);
    t.falsy(url.host);
    t.falsy(url.hostname);
    t.deepEqual(url.href, '/foo/bar?fizz=buzz');
    t.deepEqual(url.pathname, '/foo/bar');
    t.falsy(url.port);
    t.deepEqual(url.query, 'fizz=buzz');
    t.deepEqual(url.search, '?fizz=buzz');
});

test('should parse a full URL', t => {
    const req = createReq('http://localhost:8888/foo/bar');
    const url = parseurl.parseurl(req);
    t.deepEqual(url.host, 'localhost:8888');
    t.deepEqual(url.hostname, 'localhost');
    t.deepEqual(url.href, 'http://localhost:8888/foo/bar');
    t.deepEqual(url.pathname, '/foo/bar');
    t.deepEqual(url.port, '8888');
    t.falsy(url.query);
    t.falsy(url.search);
});

test('should not choke on auth-looking URL', t => {
    const req = createReq('//todo@txt');
    t.deepEqual(parseurl.parseurl(req).pathname, '//todo@txt');
});

test('should return undefined missing url', t => {
    const req = createReq();
    const url = parseurl.parseurl(req);
    t.deepEqual(url, undefined);
});

test('when using the same request', t => {
    const req = createReq('/foo/bar');
    t.deepEqual(parseurl.parseurl(req).pathname, '/foo/bar', 'should parse multiple times 0');
    t.deepEqual(parseurl.parseurl(req).pathname, '/foo/bar', 'should parse multiple times 1');
    t.deepEqual(parseurl.parseurl(req).pathname, '/foo/bar', 'should parse multiple times 2');

    let url = parseurl.parseurl(req);
    const val = Math.random();

    (url as any)._token = val;
    t.deepEqual((url as any)._token, val, 'should reflect url changes');
    t.deepEqual(url.pathname, '/foo/bar', 'should reflect url changes');

    url = parseurl.parseurl(req);
    t.deepEqual((url as any)._token, val, 'should cache parsing');
    t.deepEqual(url.pathname, '/foo/bar', 'should cache parsing');

    req.url = '/bar/baz';
    url = parseurl.parseurl(req);
    t.falsy((url as any)._token, 'should reflect url changes');
    t.deepEqual(parseurl.parseurl(req).pathname, '/bar/baz', 'should reflect url changes');
});

test('should parse the request original URL', t => {
    const req = createReq('/foo/bar', '/foo/bar');
    const url = parseurl.originalurl(req);
    t.falsy(url.host);
    t.falsy(url.hostname);
    t.deepEqual(url.href, '/foo/bar');
    t.deepEqual(url.pathname, '/foo/bar');
    t.falsy(url.port);
    t.falsy(url.query);
    t.falsy(url.search);
});

test('should parse originalUrl when different', t => {
    const req = createReq('/bar', '/foo/bar');
    const url = parseurl.originalurl(req);
    t.falsy(url.host);
    t.falsy(url.hostname);
    t.deepEqual(url.href, '/foo/bar');
    t.deepEqual(url.pathname, '/foo/bar');
    t.falsy(url.port);
    t.falsy(url.query);
    t.falsy(url.search);
});

test('should parse req.url when originalUrl missing', t => {
    const req = createReq('/foo/bar');
    const url = parseurl.originalurl(req);
    t.falsy(url.host);
    t.falsy(url.hostname);
    t.deepEqual(url.href, '/foo/bar');
    t.deepEqual(url.pathname, '/foo/bar');
    t.falsy(url.port);
    t.falsy(url.query);
    t.falsy(url.search);
});

test('should return undefined missing req.url and originalUrl', t => {
    const req = createReq();
    const url = parseurl.originalurl(req);
    t.deepEqual(url, undefined);
});

test('when using the same request', t => {
    const req = createReq('/foo/bar', '/foo/bar');
    t.deepEqual(parseurl.originalurl(req).pathname, '/foo/bar', 'should parse multiple times');
    t.deepEqual(parseurl.originalurl(req).pathname, '/foo/bar', 'should parse multiple times');
    t.deepEqual(parseurl.originalurl(req).pathname, '/foo/bar', 'should parse multiple times');

    let url = parseurl.originalurl(req);
    const val = Math.random();
    (url as any)._token = val;
    t.deepEqual((url as any)._token, val, 'should reflect url changes');
    t.deepEqual(url.pathname, '/foo/bar', 'should reflect url changes');

    url = parseurl.originalurl(req);
    t.deepEqual((url as any)._token, val, 'should cache parsing');
    t.deepEqual(url.pathname, '/foo/bar', 'should cache parsing');

    req.url = '/baz';
    url = parseurl.originalurl(req);
    t.deepEqual((url as any)._token, val, 'should reflect url changes');
    t.deepEqual(parseurl.originalurl(req).pathname, '/foo/bar', 'should reflect url changes');
});
