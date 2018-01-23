export abstract class BaseDatabase {
    // protected type: string;
    public get Type(): string {
        return this.type;
    }

    public get Host(): string {
        return this.host;
    }

    public get Port(): number {
        return this.port;
    }

    public get Name(): string {
        return this.name;
    }

    constructor(protected type: string,
                protected host: string,
                protected port: number,
                protected name: string) {

    }

    public abstract async open();
    public abstract model<T>(name: string, schema?: any): BaseModel<T>;
}

export abstract class BaseModel<T> {
    /**
     * select a field and give condition to limit it.
     */
    public abstract where(path: string, val?: object): BaseQuery<T>;

    /**
     * select a field and give condition to limit it.
     */
    // public abstract model(): any;

    public abstract async all(): Promise<T[]>;
}

export abstract class BaseQuery<T> {
    /**
     * Specifies a greater than query condition.
     * When called this function, the most recent path passed to where() is used.
     */
    public abstract gt(val: number): this;
    /**
     * Specifies a greater than or equal to query condition.
     * When called this function, the most recent path passed to where() is used.
     */
    public abstract gte(val: number): this;
    /**
     * Specifies a in specific set query condition.
     * When called this function, the most recent path passed to where() is used.
     */
    public abstract in(val: any[]): this;
    /**
     * Specifies a less than than query condition.
     * When called this function, the most recent path passed to where() is used.
     */
    public abstract lt(val: number): this;
    /**
     * Specifies a less than or equal than query condition.
     * When called this function, the most recent path passed to where() is used.
     */
    public abstract lte(val: number): this;
    /**
     * Specifies a not equal to query condition.
     * When called this function, the most recent path passed to where() is used.
     */
    public abstract ne(val: any): this;
    /**
     * Specifies a not in query condition.
     * When called this function, the most recent path passed to where() is used.
     */
    public abstract nin(val: any[]): this;
    /**
     * select a field and give condition to limit it.
     */
    public abstract where(path?: string | object, val?: any): this;
    /**
     * Specifies an equal to query condition.
     * When called this function, the most recent path passed to where() is used.
     */
    public abstract equals(val: any): this;

    public abstract select(arg: string): this;
    /**
     * get the result.
     */
    public abstract exec(): Promise<T[]>;

    public abstract async count(): Promise<number>;
}
