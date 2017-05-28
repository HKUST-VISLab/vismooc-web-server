/*
current respondes:
[{"_id":"580650eac3e8887c40e39cee",
"courseId":"HKUSTx/COMP102x/2T2014",
"courseName":"Introduction to Computing with Java",
"instructor":null,"url":null,"img":"HKUSTxCOMP102xAbout.jpg","description":null}]

right respondes:
[{"_id":"542d1dba7a261fd8a0310876",
"courseId":4,
"courseName":"Introduction to Computing with Java",
"instructor":"Ting-Chuen PONG",
"url":"https://www.edx.org/course/hkustx/hkustx-comp102x-introduction-computing-1690",
"img":"https://www.edx.org/sites/default/files/course/image/tile/system-of-communications-262x136.jpg",
"description":"This course aims ..."}
]
*/

/*
import * as mysql from "mysql";
import { promisify } from "../utils";
import { BaseDatabase, BaseModel, BaseQuery } from "./base";
import DatabaseManager from "./databaseManager";

export const MYSQL = "MYSQL";

export class MysqlDatabase extends BaseDatabase {
    public static db: mysql.IConnection;

    constructor(host: string = "localhost",
                port: number = 27017,
                name: string = "vismooc") {
        super(MYSQL, host, port, name);
    }

    public open() {
        MysqlDatabase.db = mysql.createConnection({
            host: this.host,
            port: this.port,
            // password: this.pass,
            database: this.name,
        });
        MysqlDatabase.db.connect();
    }

    public model(name: string, schema?: any): MysqlModel {
        return new MysqlModel(name);
    }
}

export class MysqlModel implements BaseModel {
    private tableName: string;

    constructor(tableName: string) {
        this.tableName = tableName;
    }

    public where(path: string, val?: object): MysqlQuery {
        return new MysqlQuery(this.tableName);
    }

    // public model(): any {
    //     return this.tableName;
    // }

    public all(): MysqlQuery {
        return new MysqlQuery(this.tableName);
    }
}

export class MysqlQuery implements BaseQuery {
    private tableName: string;
    private field: string = "*";
    private condition: string;
    private lastWhere: string;
    private isCount: boolean = false;

    constructor(tableName: string) {
        this.tableName = tableName;
        this.condition = "";
    }

    public equals(val: any): this {
        this.condition = this.condition + ` where ${this.lastWhere} = ${this.tr(val)}`;
        return this;
    }

    public gt(val: number): this {
        this.condition = this.condition + ` where ${this.lastWhere} > ${this.tr(val)}`;
        return this;
    }

    public gte(val: number): this {
        this.condition = this.condition + ` where ${this.lastWhere} >= ${this.tr(val)}`;
        return this;
    }

    public lt(val: number): this {
        this.condition = this.condition + ` where ${this.lastWhere} < ${this.tr(val)}`;
        return this;
    }

    public lte(val: number): this {
        this.condition = this.condition + ` where ${this.lastWhere} <= ${this.tr(val)}`;
        return this;
    }

    public ne(val: any): this {
        this.condition = this.condition + ` where ${this.lastWhere} <> ${this.tr(val)}`;
        return this;
    }

    public in(val: any[]): this {
        this.condition = this.condition + ` where ${this.lastWhere} in (${val.map((d) => this.tr(d)).join(",")})`;
        return this;
    }

    public nin(val: any[]): this {
        this.condition = this.condition + ` where ${this.lastWhere} not in (${val.map((d) => this.tr(d)).join(",")})`;
        return this;
    }

    public select(arg: string): this {
        this.field = arg.split(" ").join(",");
        return this;
    }

    public where(path?: string | object, val?: any): this {
        this.lastWhere = path as string;
        return this;
    }

    public count(): this {
        this.isCount = true;
        return this;
    }

    public async exec(): Promise<any> {
        const expires = 86400;
        const redis = DatabaseManager.CacheDatabase;
        if (this.isCount) {
            this.field = `count(${this.field})`;
        }
        const sql = `select ${this.field} from ${this.tableName} ${this.condition}`;
        const key = sql;

        try {
            const result = await redis.get(key) as string;
            let docs;
            if (!result) {
                docs = await promisify(MysqlDatabase.db.query, { thisArg: MysqlDatabase.db })(sql);
                const str = JSON.stringify(docs);
                redis.set(key, str);
                redis.expire(key, expires);
            } else {
                docs = JSON.parse(result);
                redis.expire(key, expires);
            }
            return docs;
        } catch (err) {
            throw err;
        }
    }

    private tr(val: any): string {
        if (typeof val === "string") {
            return `'${val.toString()}'`;
        } else {
            return val.toString();
        }
    }
}
*/
