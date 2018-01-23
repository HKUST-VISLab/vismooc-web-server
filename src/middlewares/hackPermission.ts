import { Context } from 'koa';
import { Session } from 'koa-session-ts';
import DatabaseManager from '../database/databaseManager';
import * as DataSchema from '../database/dataSchema';

export default (options: any = {}) => {
    return async (ctx: Context, next: () => Promise<any>) => {
        if (!ctx.session) {
            ctx.session = {} as Session;
        }
        if (!ctx.session.passport) {
            ctx.session.passport = { user: {} };
        }
        if (!ctx.session.passport.user) {
            ctx.session.passport.user = { username: 'root' };
        }
        const courses = await DatabaseManager.Database
            .model<DataSchema.Course, DataSchema.CourseModel>(DataSchema.COURSES)
            .all();
        // console.info(courses);

        ctx.session.passport.user.permissions = courses.reduce((o, c) => {
            o[c.id] = true;
            return o;
        }, {});

        // console.info(ctx.session.passport.user.permission);
        return await next();
    };
};
