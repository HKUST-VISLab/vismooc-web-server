/**
 * Morgan is the logger middleware
 */
import * as Koa from 'koa';
import * as originalMorgan from 'morgan';
import { promisify } from '../utils';

type formatType = 'combined' | 'common' | 'dev' | 'short' | 'tiny';
export interface KoaMorgan {
    (format: formatType | string | originalMorgan.FormatFn, options?: originalMorgan.Options): Koa.Middleware;
    compile(format: string);
    compile(format: string): originalMorgan.FormatFn;
    format(name: string, fmt: string | originalMorgan.FormatFn): originalMorgan.Morgan;
    token(name: string, callback: originalMorgan.TokenCallbackFn): originalMorgan.Morgan;
}

const morgan: any = (format, options) => {
    const fn = promisify(originalMorgan(format, options));
    return async (ctx, next) => {
        try {
            await fn(ctx.request, ctx.response);
        } catch (err) {
            console.warn('err in logging middleware');
            throw err;
        }
        await next();
    };
};
morgan.compile = originalMorgan.compile;
morgan.format = originalMorgan.format;
morgan.token = originalMorgan.token;
export default morgan as KoaMorgan;
