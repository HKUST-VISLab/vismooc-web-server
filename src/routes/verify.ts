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
        ctx.logger.debug('==========Begin of verify==========');
        // to check whether the user login or not
        const passport = ctx.session.passport;
        const user = passport && passport.user;
        const permissions = user && user.permissions;
        if (!passport || !user || !permissions) {

            ctx.body = 'No Permission_1';
            ctx.logger.debug('No permission_1, which means the user doesn\'t login');
            return;
        }
        ctx.logger.debug('Login sucess');
        // to check whether the user has permission to fetch the data of this course
        const query = ctx.query;
        const courseId = courseIdOf(query);
        if (courseId && permissions !== '*' && !(courseId in permissions)) {
            ctx.body = 'No Permission_2';
            ctx.logger.debug(`No permission_2, which means the user has no right to access the course ${courseId}`);
            return await next();
        }
        ctx.logger.debug('==========End of verify==========');
        return await next();
    });

export default verifyRouter;
