import * as ioredis from 'ioredis';

export interface RedisOptions {
    dropBufferSupport?: boolean;
    port?: number;
    host?: string;
    db?: number;
}

export class Redis extends ioredis {
    public static defaultOptions = {
        dropBufferSupport: true,
        port: 6379,          // Redis port
        host: 'localhost',   // Redis host
        db: 0,
    };

    constructor(options: RedisOptions = {}, flushDB: boolean = false) {
        super(Object.assign({}, Redis.defaultOptions, options));
        if (flushDB) {
            this.flushdb();
        }
    }

    public dropDatabase() {
        this.flushdb();
    }
}
