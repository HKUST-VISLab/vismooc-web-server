import { Context } from 'koa';
import { UserProfile } from './passport/strategies/HKMOOCStrategy';

export default (options: any = {}) => {
    return async (ctx: Context, next: () => Promise<any>) => {
        if (!ctx.session || !ctx.session.passport || !ctx.session.passport.user) {
            return await next();
        }
        ctx.logger.debug('=============Begin of permission middleware================');
        const userProfile: UserProfile = ctx.session.passport.user;
        const permissions = {};
        if (userProfile.staff_courses) {
            ctx.logger.debug('get the permission from staff_courses');
            for (const courseId of userProfile.staff_courses) {
                const match = courseId.match(/course-v1:?([^\/]+)/);
                permissions[match ? match[1] : courseId] = true;
            }
            ctx.logger.debug(`now the permissions are ${JSON.stringify(permissions)}`);
        }
        if (userProfile.instructor_courses) {
            ctx.logger.debug('get the permission from instructor_courses');
            for (const courseId of userProfile.instructor_courses) {
                const match = courseId.match(/course-v1:?([^\/]+)/);
                permissions[match ? match[1] : courseId] = true;
            }
            ctx.logger.debug(`now the permissions are ${JSON.stringify(permissions)}`);
        }
        if (userProfile.administrator) {
            ctx.logger.debug('get the permission from administrator');
            permissions['*'] = true;
            ctx.logger.debug(`now the permissions are ${JSON.stringify(permissions)}`);
        }
        const username: string = ctx.session.passport.user.username;
        const user = await ctx.dataController.getUserByUsername(username);
        if (user) {
            ctx.logger.debug(`the courseRole of user ${username} in mongodb is ${JSON.stringify(user.courseRoles)}`);
            if (user.courseRoles) {
                ctx.logger.debug('get the permission from mongodb');
                const { courseRoles } = user;
                Object.keys(courseRoles).forEach(course => {
                    const role = new Set(courseRoles[course]);
                    permissions[course] = role.has('instructor') || role.has('staff');
                });
                ctx.logger.debug(`now the permissions are ${JSON.stringify(permissions)}`);
            }
        } else {
            ctx.logger.debug(`No user ${username} in the mongodb!`);
        }
        ctx.session.passport.user.permissions = permissions;
        ctx.logger.debug(`The permission of user ${username} is ${JSON.stringify(permissions)}`);
        ctx.logger.debug('=============End of permission middleware================');
        await next();
    };
};
