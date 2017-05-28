import test from 'ava';
import { BaseDatabase, BaseModel, BaseQuery } from '../../src/database/base';

class MockDatabase extends BaseDatabase {
    constructor(host: string = 'localhost',
                port: number = 27017,
                name: string = 'vismooc') {
        super('MOCK', host, port, name);
    }
    public open() {
        return null;
    }
    public connection(): any {
        return null;
    }
    public model<T extends number>(name: string, schema?: any): MockModel<T> {
        return new MockModel<T>();
    }
}

class MockModel<T extends number> extends BaseModel<T> {
    public where(path: string, val?: object): MockQuery<T> {
        return new MockQuery<T>();
    }
    public async all(): Promise<T[]> {
        return [];
    }
}

class MockQuery<T extends number> extends BaseQuery<T> {
    public gt(val: number): this {
        return this;
    }
    public gte(val: number): this {
        return this;
    }
    public in(val: any[]): this {
        return this;
    }
    public lt(val: number): this {
        return this;
    }
    public lte(val: number): this {
        return this;
    }
    public ne(val: any): this {
        return this;
    }
    public nin(val: any[]): this {
        return this;
    }
    public where(path?: string | object, val?: any): this {
        return this;
    }
    public equals(val: any): this {
        return this;
    }
    public select(arg: string): this {
        return this;
    }
    public async exec(): Promise<number[]> {
        return [1000];

    }
    public async count(): Promise<number> {
        return 100;
    }
}

test('Base#mongo', async (t) => {
    const db: MockDatabase = new MockDatabase();
    const mockQuery = await db.model<number>('test')
        .where('name').equals('xiaoming')
        .exec();
    t.deepEqual(mockQuery, [1000], 'Mockdatabase created successful');
});
