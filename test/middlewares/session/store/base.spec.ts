import test from 'ava';
import { EventEmitter } from 'events';
import { BaseStore, Session } from '../../../../src/middlewares/session';

interface BaseStoreTestContext {
    store: BaseStore;
    sess: Session;
}

class MockStore extends BaseStore {
    public get(): Promise<Session> {
        return Promise.resolve({ cookie: { signed: false } });
    }
    public destroy(): Promise<void> {
        return;
    }
}

test.beforeEach('new a BaseStore', (t) => {
    t.context = {
        store: new MockStore(),
        sess: { cookie: { signed: false } },
    };
});

test('BaseStore#constructor', (t) => {
    const { store } = t.context as BaseStoreTestContext;
    t.truthy(store instanceof EventEmitter, 'basestore is a subclass of EventEmitter');
});

test('BaseStore#set', async (t) => {
    const { store, sess } = t.context as BaseStoreTestContext;
    const sid = 'BaseStore#set';
    const ttl = 1000;
    t.deepEqual(await store.set(sid, sess), 86400000, 'if session has no expires, it\
        should return the default maxage of session');
    sess.cookie.maxAge = 101010;
    t.deepEqual(await store.set(sid, sess), 101010, 'if session has no expires, it\
        should return the maxage of session');

    t.deepEqual(await store.set(sid, sess, ttl), ttl, 'if ttl is not null, return the ttl');
    const expires = new Date(2018, 1, 1);
    const sess2: Session = { cookie: { signed: false, expires } };
    const tempNow = Date.now;
    Date.now = () => 1131; // a random number
    t.deepEqual(await store.set(sid, sess2), Math.ceil(expires.getTime() - Date.now()), `if session
        has expires, it should return the ms from now to expires date`);
    Date.now = tempNow;
});
