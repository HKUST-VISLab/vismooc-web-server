import { Context } from 'koa';
import DatabaseManager from '../database/databaseManager';
import * as DataSchema from '../database/dataSchema';
import { Session } from './session';

export default (options: any = {}) => {
    return async (ctx: Context, next: () => Promise<any>) => {
        if (!ctx.session) {
            ctx.session = {} as Session;
        }
        if (!ctx.session.passport) {
            ctx.session.passport = { user: {} };
        }
        if (!ctx.session.passport.user) {
            ctx.session.passport.user = {};
        }
        const courses = await DatabaseManager.Database
            .model<DataSchema.Course, DataSchema.CourseModel>(DataSchema.COURSES)
            .all();
        // console.info(courses);

        ctx.session.passport.user.permissions = courses.reduce((o, c) => {
            o[c.originalId] = true;
            return o;
        }, {});

        // console.info(ctx.session.passport.user.permission);
        return await next();
    };
};
