import { Context } from 'koa';
import { Authenticator } from '../authenticator';

export class BaseStrategy {
    protected name: string;
    private authenticator: Authenticator;

    public get Name(): string {
        return this.name;
    }
    /**
     * Authenticate request.
     *
     * This function must be overridden by subclasses.  In abstract form, it always
     * throws an exception.
     *
     */
    public async authenticate(ctx: Context, options?): Promise<BaseAction> {
        return new PassAction();
    }

    public registerAuthenticator(authenticator: Authenticator) {
        this.authenticator = authenticator;
    }
}

// tslint:disable:max-classes-per-file
export enum ActionType { SUCCESS, FAIL, REDIRECT, PASS, ERROR }

export class BaseAction {
    constructor(public type: ActionType) { }
}

/**
 * Pass without making a success or fail decision.
 *
 * Under most circumstances, Strategies should not need to call this
 * function.  It exists primarily to allow previous authentication state
 * to be restored, for example from an HTTP session.
 *
 */
export class PassAction extends BaseAction {
    constructor() {
        super(ActionType.PASS);
    }
}

/**
 * Fail authentication, with optional `challenge` and `status`, defaulting
 * to 401.
 *
 * Strategies should return this action to fail an authentication attempt.
 *
 * @param {String} challenge
 * @param {Number} status
 * @api public
 */
export class FailAction extends BaseAction {
    constructor(public challenge: string, public status: number) {
        super(ActionType.FAIL);
    }
}

/**
 * Redirect to `url` with optional `status`, defaulting to 302.
 *
 * Strategies should return this function to redirect the user (via their
 * user agent) to a third-party website for authentication.
 *
 * @param {String} url
 * @param {Number} status
 * @api public
 */
export class RedirectAction extends BaseAction {
    constructor(public url: string, public status: number = 302) {
        super(ActionType.REDIRECT);
    }
}

/**
 * Authenticate `user`, with optional `info`.
 *
 * Strategies should return this action to successfully authenticate a
 * user.  `user` should be an object supplied by the application after it
 * has been given an opportunity to verify credentials.  `info` is an
 * optional argument containing additional user information.  This is
 * useful for third-party authentication strategies to pass profile
 * details.
 *
 * @param {Object} user
 * @param {Object} info
 * @api public
 */
export class SuccessAction extends BaseAction {
    constructor(public user: object, public info: { type: string, message: string }) {
        super(ActionType.SUCCESS);
    }
}
