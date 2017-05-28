import test from 'ava';
import { Redis } from '../../src/database/redis';

test('Redis#constructor', (t) => {
    const redis: Redis = new Redis();
    t.truthy(redis instanceof Redis);
});

test('Redis#constructorWithFlush', (t) => {
    const redis: Redis = new Redis({}, true);
    t.truthy(redis instanceof Redis);
});

test('Redis#dropDatabase', async (t) => {
    const redis: Redis = new Redis({db: 2});
    const testKey: string = 'asdfghjkl';
    const testValue: string = 'qwertyyuio';
    await redis.set(testKey, testValue);
    let output = await redis.get(testKey);
    t.is(output, testValue, `the output of redis.get(${testKey}) should be ${testValue}`);
    await redis.dropDatabase();
    output = await redis.get(testKey);
    t.falsy(output, `the output of redis.get(${testKey}) should be null after drop database`);
});
