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
    public model<T>(name: string, mockResult: T);
    public model<T>(name: string, schema?: any) {
        return new MockModel<T>(schema);
    }
}

class MockModel<T> extends BaseModel<T> {

    constructor(public mockResult: T) {
        super();
    }

    public where(path: string, val?: object): MockQuery<T> {
        return new MockQuery(this.mockResult);
    }
    public async all(): Promise<T[]> {
        return [];
    }
}

class MockQuery<T> extends BaseQuery<T> {

    constructor(public mockResult: T) {
        super();
    }

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
    public async exec() {
        return [this.mockResult];
    }
    public async count(): Promise<number> {
        return 100;
    }
}

test('Base#mongo', async (t) => {
    const mockRes = 1000;
    const db: MockDatabase = new MockDatabase();
    const mockQuery = await db.model<number>('test', mockRes)
        .where('name').equals('xiaoming')
        .exec();
    t.deepEqual(mockQuery, [mockRes], 'Mockdatabase created successful');
});
