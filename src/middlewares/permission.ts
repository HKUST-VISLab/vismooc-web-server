import { Context } from 'koa';

export default (options: any = {}) => {
    return async (ctx: Context, next: () => Promise<any>) => {
        if (!ctx.session || !ctx.session.passport || !ctx.session.passport.user) {
            return await next();
        }
        const username: string = ctx.session.passport.user.username;
        const user = await ctx.dataController.getUserByUsername(username);
        const permissions = {};
        if (user && user.courseRoles) {
            const courseRoles: { [courseId: string]: string[] } = user.courseRoles as { [courseId: string]: string[] };
            Object.keys(courseRoles).forEach(course => {
                const role = new Set(courseRoles[course]);
                permissions[course] = role.has('instructor') || role.has('staff');
            });
        }
        console.info('in permissions middleware');
        ctx.session.passport.user.permissions = permissions;
        await next();
    };
};
