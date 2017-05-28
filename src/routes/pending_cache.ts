import * as Router from 'koa-router';
import DatabaseManager from '../database/databaseManager';

const cacheRouter: Router = new Router()
    .get('/(.*)', async (ctx, next) => {
        const redis = DatabaseManager.CacheDatabase;
        const url: string = ctx.request.originalUrl;
        const result = await redis.get(url);
        const cached = result && result !== '[]';
        if (cached) {
            ctx.body = JSON.parse(result as string);
        }
        await next();
        if (!cached && ctx.body !== null && ctx.body !== '[]') {
            const value: string = JSON.stringify(ctx.body);
            await redis.set(url, value);
        }
    });

export default cacheRouter;
