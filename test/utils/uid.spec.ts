import test from 'ava';
import { uid, uidSync } from '../../src/utils/uid';

test('uid', async (t) => {
    let id = await uid(18);
    t.is(id.length, Buffer.byteLength(id), 'should return a uid of the correct length');
    id = await uid(10000);
    t.is(id.indexOf('+'), -1, 'should not contain `+`');
    t.is(id.indexOf('/'), -1, 'should not contain `/`');
    t.is(id.indexOf('='), -1, 'should not contain `=`');
});

test('uidSync', (t) => {
    let id = uidSync(18);
    t.is(id.length, Buffer.byteLength(id), 'should return a uid of the correct length');
    id = uidSync(10000);
    t.is(id.indexOf('+'), -1, 'should not contain `+`');
    t.is(id.indexOf('/'), -1, 'should not contain `/`');
    t.is(id.indexOf('='), -1, 'should not contain `=`');
});
