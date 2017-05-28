import test from 'ava';
import { BaseStore, MemoryStore, Session } from '../../../../src/middlewares/session';
import { wait } from '../../../testUtils';

interface MemoryStoreTestContext {
    store: MemoryStore;
    sess: Session;
}

test.beforeEach('new a MemoryStore', (t) => {
    t.context = {
        store: new MemoryStore(),
        sess: { cookie: { signed: false } },
    };
});

test('MemoryStore#constructor', (t) => {
    const { store } = t.context as MemoryStoreTestContext;
    t.truthy(store instanceof BaseStore, 'MemoryStore is the subclass of BaseStore');
    let warnMsg;
    const expectWarnMsg = `Warning: koa-generic-session\'s MemoryStore is not
    designed for a production environment, as it will leak
    memory, and will not scale past a single process.`;
    const tempWarn = console.warn;
    console.warn = warning => warnMsg = warning;
    process.env.NODE_ENV = 'production';
    // tslint:disable-next-line:no-unused-expression
    new MemoryStore();
    t.deepEqual(warnMsg, expectWarnMsg, 'Warning when using memorystore in product mode');
    console.warn = tempWarn;
    process.env.NODE_ENV = 'test';
});

test('MemoryStore#set', async (t) => {
    const { store, sess } = t.context as MemoryStoreTestContext;
    const sid = 'MemoryStore#set';
    await store.set(sid, sess);
    t.deepEqual(await store.get(sid), sess, 'get the session by id');

    // test ttl
    const ttl = 500;
    await store.set(sid, sess, ttl);
    t.deepEqual(await store.get(sid), sess, 'get the session by id before ttl');
    await wait(ttl + 100);
    t.falsy(await store.get(sid), 'after ttl, the session of sid is null');

    // test reset ttl
    await store.set(sid, sess, ttl);
    t.deepEqual(await store.get(sid), sess, 'get the session by id before ttl');
    await wait(200);
    await store.set(sid, sess, ttl);
    await wait(ttl - 100);
    t.deepEqual(await store.get(sid), sess, 'the ttl of sess has been reset');
});

test('MemoryStore#get', async (t) => {
    const { store, sess } = t.context as MemoryStoreTestContext;
    const sid = 'MemoryStore#get';
    t.falsy(await store.get(sid), 'get nothing before set');

    await store.set(sid, sess);
    t.deepEqual(await store.get(sid), sess, 'get the sess by id');
    t.not(await store.get(sid), sess, 'get the sess by id, should not be the same obj');
});

test('MemoryStore#destory', async (t) => {
    const { store, sess } = t.context as MemoryStoreTestContext;
    const sid = 'MemoryStore#destory';
    t.falsy(await store.destroy(sid), 'do nothing if sid is not in store');

    await store.set(sid, sess);
    t.deepEqual(await store.get(sid), sess, 'get the sess by id');
    await store.destroy(sid);
    t.falsy(await store.get(sid), 'get nothing after destory');
});
