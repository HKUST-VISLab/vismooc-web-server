import * as mongoose from 'mongoose';
import { BaseDatabase, BaseModel, BaseQuery } from './base';

export const MONGO = 'MONGO';

export class MongoDatabase extends BaseDatabase {

    private db: mongoose.Connection;

    constructor(host: string = 'localhost',
                port: number = 27017,
                name: string = 'vismooc') {
        super(MONGO, host, port, name);
    }

    public async open() {
        this.db = await mongoose.createConnection(this.host, this.name, this.port);
    }

    public model<T, U extends T & mongoose.Document >(name: string, schema?: mongoose.Schema): MongoModel<T, U> {
        // TODO improve here
        if (!this.db) {
            throw new Error('you should fristly open the database');
        }
        // console.log(schema);
        const model = this.db.model<U>(name, schema);
        return new MongoModel<T, U>(model);
    }

    public async close(): Promise<void> {
        if (this.db) {
            await this.db.close();
            this.db = undefined;
        }
    }
}

export class MongoModel<T, U extends T & mongoose.Document> extends BaseModel<T> {

    constructor(private model: mongoose.Model<U>) {
        super();
    }

    public where(path: string, val?: object): MongoQuery<T> {
        return new MongoQuery<T>(this.model.where(path, val));
    }

    public async all(): Promise<T[]> {
        return (await this.model.find().lean()) as T[];
    }
}

export class MongoQuery<T> extends BaseQuery<T> {
    // private field: string = '';

    constructor(private query: mongoose.Query<T>) {
        super();
    }

    public equals(val: any): this {
        this.query = this.query.equals(val);
        return this;
    }

    public gt(val: number): this {
        this.query = this.query.gt(val);
        return this;
    }

    public gte(val: number): this {
        this.query = this.query.gte(val);
        return this;
    }

    public in(val: any[]): this {
        this.query = this.query.in(val);
        return this;
    }

    public lt(val: number): this {
        this.query = this.query.lt(val);
        return this;
    }

    public lte(val: number): this {
        this.query = this.query.lte(val);
        return this;
    }

    public ne(val: any): this {
        this.query = this.query.ne(val);
        return this;
    }
    public nin(val: any[]): this {
        this.query = this.query.nin(val);
        return this;
    }
    public exists(val?: boolean): this {
        this.query = this.query.exists(val);
        return this;
    }

    public select(arg: string): this {
        // this.field = arg;
        this.query = this.query.select(arg);
        return this;
    }

    public where(path?: string | object, val?: any): this {
        this.query = this.query.where(path, val);
        return this;
    }

    public async count(): Promise<number> {
        return await this.query.count();
    }

    /* Executes the query */
    public async exec(): Promise<T[]> {
        /*
        this.query = this.query.lean();
        const model = (this.query as any).model;
        const query = this.query.getQuery();
        const options = (this.query as any)._optionsForExec(model);
        const fields = Object.assign({}, (self as any)._fields, this.field);
        const schemaOptions = model.schema.options;
        const expires = schemaOptions.expires || 86400;
        const redis = DatabaseManager.CacheDatabase;
        if (options.lean) {
            return mongoose.Query.prototype.exec.apply(self, arguments);
        }
        const key = JSON.stringify(query) + JSON.stringify(options) + JSON.stringify(fields);
        const result: string = (await redis.get(key)) as string;
        let docs;
        if (!result) {
            docs = await self.exec();
            const str = JSON.stringify(docs);
            redis.set(key, str);
            redis.expire(key, expires);
        } else {
            docs = JSON.parse(result);
            redis.expire(key, expires);
        }
        return docs as T[];*/
        return (await this.query.lean().exec()) as T[];
    }
}
