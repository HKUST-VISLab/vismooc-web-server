import test from 'ava';
import { Redis } from '../../../../src/database/redis';
import { BaseStore, RedisStore, Session } from '../../../../src/middlewares/session';
import { wait } from '../../../testUtils';

interface RedisStoreTestContext {
    store: RedisStore;
    sess: Session;
}

let dbIdx = 11;
test.beforeEach('new a RedisStore', (t) => {
    const redis = new Redis({ db: dbIdx++ });
    t.context = {
        redis,
        store: new RedisStore(undefined, redis),
        sess: { cookie: { signed: true } },
    };
});

test.afterEach('flush db', async (t) => {
    t.context.redis.flushAll();
});

test.serial('RedisStore#constructor', async (t) => {
    const { store } = t.context as RedisStoreTestContext;
    t.truthy(store instanceof BaseStore, 'RedisStore is the subclass of BaseStore');
});

test.serial('RedisStore#set', async (t) => {
    const { store, sess } = t.context as RedisStoreTestContext;
    const sid = 'RedisStore#set';
    await store.set(sid, sess);
    t.deepEqual(await store.get(sid), sess, 'get the session by id');

    // test ttl
    const ttl = 1500;
    await store.set(sid, sess, ttl);
    t.deepEqual(await store.get(sid), sess, 'test ttl, get the session by id before ttl');
    await wait(ttl + 200);
    t.falsy(await store.get(sid), 'after ttl, the session of sid is null');

    // test reset ttl
    await store.set(sid, sess, ttl);
    t.deepEqual(await store.get(sid), sess, 'test reset ttl, get the session by id before ttl');
    await wait(700);
    await store.set(sid, sess, ttl);
    await wait(ttl - 100);
    t.deepEqual(await store.get(sid), sess, 'the ttl of sess has been reset');
});

test.serial('RedisStore#get', async (t) => {
    const { store, sess } = t.context as RedisStoreTestContext;
    const sid = 'RedisStore#get';
    t.falsy(await store.get(sid), 'get nothing before set');

    await store.set(sid, sess);
    t.deepEqual(await store.get(sid), sess, 'get the sess by id');
    t.not(await store.get(sid), sess, 'get the sess by id, should not be the same obj');
});

test.serial('RedisStore#destory', async (t) => {
    const { store, sess } = t.context as RedisStoreTestContext;
    const sid = 'RedisStore#destory';
    t.falsy(await store.destroy(sid), 'do nothing if sid is not in store');

    await store.set(sid, sess);
    t.deepEqual(await store.get(sid), sess, 'get the sess by id');
    await store.destroy(sid);
    t.falsy(await store.get(sid), 'get nothing after destory');
});
