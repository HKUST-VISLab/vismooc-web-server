import { Passport } from 'koa-passport-ts';
import * as Router from 'koa-router';

import { CONFIG } from '../init';
import { HKMOOCStrategyNAME } from '../middlewares/HKMOOCStrategy';

declare module 'koa-session-ts' {
    interface Session {
        redirectCourseId?: string;
    }
}

export default (passport: Passport)  => {
    return new Router()
        .get('/login', async (ctx, next) => {
            ctx.logger.debug('==========Begin of /login==========');
            if (ctx.session) {
                ctx.session.redirectCourseId = ctx.query.courseId;
                ctx.logger.debug(`Set the redirectCourseId to ${ctx.session.redirectCourseId}`);
            }
            if (ctx.isAuthenticated()) {
                ctx.logger.debug('isAuthenticated');
                ctx.redirect(`${CONFIG.subPath}/`);
            } else {
                ctx.logger.debug('is not Authenticated');
                ctx.redirect(`${CONFIG.subPath}/oauth`);
            }
            ctx.logger.debug('==========End of /login==========');
        })
        .get('/logout', async (ctx, next) => {
            ctx.logger.debug('==========Begin of /logout==========');
            if (ctx.isAuthenticated()) {
                ctx.logout();
            }
            ctx.redirect(`${CONFIG.subPath}/`);
            ctx.logger.debug('==========End of /logout==========');
        })
        .get('/oauth', passport.authenticate(HKMOOCStrategyNAME))
        .get('/oauth2', passport.authenticate(HKMOOCStrategyNAME, {
            successRedirect: `${CONFIG.subPath}/`,
            failureRedirect: `${CONFIG.subPath}/login`,
        }));
};
