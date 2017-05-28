import { Context } from 'koa';
import { BaseStrategy, PassAction } from './base';

export class SessionStrategy extends BaseStrategy {
    /**
     * `SessionStrategy` constructor.
     *
     */
    constructor() {
        super();
        this.name = 'session';
    }

    /**
     * Authenticate request based on the current session state.
     *
     * The session authentication strategy uses the session to restore any login
     * state across requests.  If a login session has been established, `req.user`
     * will be populated with the current user.
     *
     * This strategy is registered automatically by Passport.
     *
     */
    public async authenticate(ctx: Context, options = {}) {
        if (!ctx.passport) {
            throw new Error('passport.initialize() middleware not in use');
        }

        let su;
        if (ctx.session.passport) {
            su = ctx.session.passport.user;
        }

        if (su || su === 0) {
            // NOTE: Stream pausing is desirable in the case where later middleware is
            //       listening for events emitted from request.  For discussion on the
            //       matter, refer to: https://github.com/jaredhanson/passport/pull/106
            const user = ctx.passport.deserializeUser(su, ctx);
            if (!user) {
                ctx.session.passport.user = undefined;
                return new PassAction();
            }
            const property = ctx.passport.UserProperty;
            ctx.state[property] = user;
        }
        return new PassAction();
    }
}
