import * as Router from 'koa-router';
import { CONFIG } from '../init';
import { Passport } from '../middlewares/passport';
import { HKMOOCStrategyNAME } from '../middlewares/passport/strategies/HKMOOCStrategy';

export let OAuthReferer: string = null;

export default (passport: Passport)  => {
    return new Router()
        .get('/login', async (ctx, next) => {
            OAuthReferer = ctx.header.referer;
            if (ctx.isAuthenticated()) {
                ctx.redirect(`${CONFIG.subPath}/`);
            } else {
                ctx.redirect(`${CONFIG.subPath}/oauth`);
            }
        })
        .get('/logout', async (ctx, next) => {
            if (ctx.isAuthenticated()) {
                ctx.logout();
            }
            ctx.redirect(`${CONFIG.subPath}/`);
        })
        .get('/oauth', passport.authenticate(HKMOOCStrategyNAME))
        .get('/oauth2', passport.authenticate(HKMOOCStrategyNAME, {
            successRedirect: `${CONFIG.subPath}/`,
            failureRedirect: `${CONFIG.subPath}/login`,
        }));
};
