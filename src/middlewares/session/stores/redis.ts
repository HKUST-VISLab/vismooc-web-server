import { Redis } from '../../../database/redis';
import { Session } from '../index';
import { BaseStore } from './base';

export class RedisStore extends BaseStore {

    constructor(prefix: string = '', private redis: Redis = new Redis()) {
        super(prefix);
    }

    public async get(sid: string): Promise<Session> {
        sid = this.prefix + sid;
        const session = JSON.parse(await this.redis.get(sid) as string);
        return session;
    }

    public async set(sid: string, val: Session, ttl?: number): Promise<void> {
        sid = this.prefix + sid;
        ttl = await super.set(sid, val, ttl);
        await this.redis.set(sid, JSON.stringify(val));
        await this.redis.pexpire(sid, ttl);
    }

    public async destroy(sid: string): Promise<void> {
        sid = this.prefix + sid;
        await this.redis.del(sid);
    }
}
