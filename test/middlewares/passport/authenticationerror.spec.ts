import test from 'ava';
import { AuthenticationError } from '../../../src/middlewares/passport/authenticationerror';

test('Authentication#constructor', (t) => {
    const msg: string = 'Test';
    const status: number = 501;
    const error1 = new AuthenticationError(msg, status);
    t.truthy(error1 instanceof Error);
    t.is(error1.message, msg);
    t.is(error1.status, status);
    t.is(error1.name, AuthenticationError.ErrorName);
    t.is(error1.stack.split('\n').shift(), `${AuthenticationError.ErrorName}: ${msg}`);

    const error2 = new AuthenticationError(msg);
    t.is(error2.status, 401);
});
