import test from 'ava';
import deepEqual from '../../src/utils/deepEqual';

test('deepEqual', (t) => {
    t.truthy(deepEqual({ a: [2, 3], b: [4] }, { a: [2, 3], b: [4] }), 'objects should be equal');
    t.truthy(deepEqual(3, 3), 'number should be equal');
    t.truthy(deepEqual('beep', 'beep'), 'str should be equal');
    t.falsy(deepEqual({ x: 5, y: [6] }, { x: 5, y: 6 }), 'should not be equal');
    t.falsy(deepEqual('3', 3), 'non-objects should not be equal');
    t.falsy(deepEqual('3', [3]), 'non-objects should not be equal');
    t.truthy(deepEqual([null, null, null], [null, null, null]), 'nested nulls');
    t.truthy(deepEqual(new Buffer('xyz'), new Buffer('xyz')), 'buffers');
    t.falsy(deepEqual(true, []), 'booleans and arrays');
    t.falsy(deepEqual(null, undefined), 'null !== undefined');
    const d0 = new Date(1387585278000);
    const d1 = new Date('Fri Dec 20 2013 16:21:18 GMT-0800 (PST)');
    t.truthy(deepEqual(d0, d1), 'Dates');
});
