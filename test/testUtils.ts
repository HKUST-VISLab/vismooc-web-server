import { IncomingMessage, ServerResponse } from 'http';
import { Readable, Writable } from 'stream';
import { deepEqual } from '../src/utils';
// import {
//     ActionType,
//     BaseAction,
//     FailAction,
//     RedirectAction,
//     SuccessAction,
// } from '../src/middlewares/passport/strategies';

export function wait(ms: number) {
    return new Promise((resolve, rejcect) => {
        setTimeout(resolve, ms);
    });
}

export function mongoContains(fromMongo: any, toMongo: any) {
    if (!fromMongo || !toMongo) {
        return false;
    }
    return Object.keys(toMongo).every(attr => {
        if (fromMongo[attr] !== undefined) {
            return deepEqual(toMongo[attr], fromMongo[attr]);
        }
        return fromMongo[attr] === undefined && toMongo[attr] && Object.keys(toMongo[attr]).length === 0;
    });
}

export class MockReq extends Readable implements IncomingMessage {

    constructor(public httpVersion: string = '2',
                public httpVersionMajor: number = 2,
                public httpVersionMinor: number = 2,
                public connection: any = {},
                public headers: any = {},
                public rawHeaders: string[] = ['headers'],
                public trailers: any = {},
                public rawTrailers: any = {},
                public method: string = 'GET',
                public url: string = 'url',
                public socket: any = {}) {
        super();
    }

    public setTimeout(msecs: number, callback: () => {}): any {
        return 1;
    }

    public destroy(error?: Error): void {
        return;
    }
}

export class MockRes extends Writable implements ServerResponse {
    protected data: any;
    protected headers: any;
    constructor(public statusCode: number = 200,
                public statusMessage: string = 'ok',
                public headersSent: boolean = false,
                public sendDate: boolean = true,
                public finished: boolean = false) {
        super();
        this.data = '';
        this.headers = {};
    }

    // Extended base methods
    public writeContinue(): void {
        return;
    }

    public write(data: any, encoding?: any, cb?: any): boolean {
        this.data = data;
        return true;
    }

    public writeHead(statusCode: number, reasonPhrase?: any, headers?: any): void {
        return;
    }

    public setHeader(name: string, value: string | string[]): void {
        this.headers[name] = value;
        return;
    }
    public setTimeout(msecs: number, callback: () => void): ServerResponse {
        return this;
    }

    public getHeader(name: string): any {
        return this.headers[name];
    }
    public removeHeader(name: string): void {
        return;
    }
    public addTrailers(headers: any): void {
        return;
    }

    // Extended base methods
    public end(data?: any, encoding?: string | any, cb?: () => void): void {
        if (data) {
            this.write(data);
        }
        this.finished = true;
        return;
    }
}

// export class MockPassport {

//     constructor(public fail: (challenge: string, status: number) => any = (c, s) => { return; },
//                 public redirect: (url) => any = (url) => { return; },
//                 public success: (user, info) => any = (user, info) => { return; },
//                 public pass: () => void = () => { return; },
//     ) {

//     }

//     public verifyRes(res: BaseAction) {
//         switch (res.type) {
//             case ActionType.FAIL: {
//                 const { challenge, status } = (res as FailAction);
//                 this.fail(challenge, status);
//                 break;
//             }
//             case ActionType.REDIRECT: {
//                 const { url } = (res as RedirectAction);
//                 this.redirect(url);
//                 return;
//             }
//             case ActionType.SUCCESS: {
//                 const { user, info } = (res as SuccessAction);
//                 this.success(user, info);
//             }
//             case ActionType.PASS:
//             default: {
//                 this.pass();
//             }
//         }
//     }
// }

// export class MockPassport {
//     constructor(
//         public deserializeUser = (obj, ctx?)  => obj.user,
//     ) { }

//     public get UserProperty() {
//         return 'user';
//     }
// }
