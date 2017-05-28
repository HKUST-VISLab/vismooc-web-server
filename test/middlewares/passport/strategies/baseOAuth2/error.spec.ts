import test from 'ava';
import {
    AuthorizationError, TokenError,
} from '../../../../../src/middlewares/passport/strategies/baseOAuth2';

test('AuthorizationError#constructor, with default params', (t) => {
    const msg = 'a error';
    const uri = 'http://error';
    const err = new AuthorizationError(msg, uri);
    t.deepEqual(err.message, msg);
    t.deepEqual(err.uri, uri);
    t.deepEqual(err.code, 'server_error');
    t.deepEqual(err.status, 502);
    t.deepEqual(err.toString(), `${AuthorizationError.ErrorName}: ${msg}`, 'should be formated correctly');
});

test('AuthorizationError#constructor, with params', (t) => {
    const msg = 'a error';
    const uri = 'http://error';
    let code = 'access_denied';
    let err = new AuthorizationError(msg, uri, code);
    t.deepEqual(err.message, msg);
    t.deepEqual(err.uri, uri);
    t.deepEqual(err.code, code);
    t.deepEqual(err.status, 403);

    code = 'server_error';
    err = new AuthorizationError(msg, uri, code);
    t.deepEqual(err.message, msg);
    t.deepEqual(err.uri, uri);
    t.deepEqual(err.code, code);
    t.deepEqual(err.status, 502);

    code = 'temporarily_unavailable';
    err = new AuthorizationError(msg, uri, code);
    t.deepEqual(err.message, msg);
    t.deepEqual(err.uri, uri);
    t.deepEqual(err.code, code);
    t.deepEqual(err.status, 503);

    code = 'unknow';
    err = new AuthorizationError(msg, uri, code);
    t.deepEqual(err.message, msg);
    t.deepEqual(err.uri, uri);
    t.deepEqual(err.code, code);
    t.deepEqual(err.status, 500);

    err = new AuthorizationError(msg, uri, undefined, 505);
    t.deepEqual(err.message, msg);
    t.deepEqual(err.uri, uri);
    t.deepEqual(err.code, 'server_error');
    t.deepEqual(err.status, 505, 'will not be override by code');

    code = 'server_error';
    err = new AuthorizationError(msg, uri, code, 505);
    t.deepEqual(err.message, msg);
    t.deepEqual(err.uri, uri);
    t.deepEqual(err.code, code);
    t.deepEqual(err.status, 505, 'will not be override even code is specified');
});

// test("InternalOAuthError#constructor", (t) => {
//     const msg = "a error";
//     let insideErr: Error | OAuth2Error = new Error("opps");
//     let err = new InternalOAuthError(msg, insideErr);
//     t.deepEqual(err.message, msg);
//     t.is(err.oauthError, insideErr);
//     t.deepEqual(err.toString(), `${InternalOAuthError.ErrorName}: ${msg}`, "should be formated correctly");

//     insideErr = new OAuth2Error(400, "oauthError");
//     err = new InternalOAuthError(msg, insideErr);
//     t.deepEqual(err.message, msg);
//     t.is(err.oauthError, insideErr);
//     t.deepEqual(err.toString(),
//         `${InternalOAuthError.ErrorName}: ${msg} (status: ${insideErr.status} message: ${insideErr.message})`,
//         "should be formated correctly");
// });

test('TokenError#constructor', (t) => {
    const msg = 'a error';
    const uri = 'http://error';
    const code = 'unknown';
    const status = 505;

    let err = new TokenError(msg, uri);
    t.deepEqual(err.message, msg);
    t.deepEqual(err.uri, uri);
    t.deepEqual(err.code, 'invalid_requret', 'default code value');
    t.deepEqual(err.status, 500, 'default status value');
    t.deepEqual(err.toString(), `${TokenError.ErrorName}: ${msg}`, 'should be formated correctly');

    err = new TokenError(msg, uri, code, status);
    t.deepEqual(err.message, msg);
    t.deepEqual(err.uri, uri);
    t.deepEqual(err.code, code);
    t.deepEqual(err.status, status);
    t.deepEqual(err.toString(), `${TokenError.ErrorName}: ${msg}`, 'should be formated correctly');
});
