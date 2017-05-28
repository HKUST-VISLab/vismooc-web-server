import * as Router from 'koa-router';

function courseIdOf(query: any): string {
    const id: string = query.courseId;
    if (id && id.indexOf(' ') !== -1) {
        return id.replace(new RegExp(' ', 'gm'), '+');
    }
    return id || null;
}

const verifyRouter: Router = new Router()
    .get('/(.*)', async (ctx, next) => {
        console.info('in verify router');
        // to check whether the user login or not
        if (!ctx.session.passport || !ctx.session.passport.user || !ctx.session.passport.user.permissions) {
            ctx.body = 'No Permission_1';
            return await next();
        }
        console.info('login already');
        // to check whether the user has permission to fetch the data of this course
        const query = ctx.query;
        const courseId = courseIdOf(query);
        if (courseId && !(courseId in ctx.session.passport.user.permissions)) {
            ctx.body = 'No Permission_2';
            return await next();
        }
        return await next();
    });

export default verifyRouter;
