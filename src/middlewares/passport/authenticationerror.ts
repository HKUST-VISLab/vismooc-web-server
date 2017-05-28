/**
 * `AuthenticationError` error.
 *
 * @api private
 */
export class AuthenticationError extends Error {
    public static ErrorName: string = 'AuthenticationError';

    constructor(message, public status: number = 401) {
        super(message);
        this.name = AuthenticationError.ErrorName;
        Error.captureStackTrace(this, this.constructor);
    }
}
