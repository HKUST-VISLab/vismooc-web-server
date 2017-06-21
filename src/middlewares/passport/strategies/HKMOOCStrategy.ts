import { BaseOAuth2Strategy } from './baseOAuth2';

// declare module "../../session" {
//     interface Session {
//         passport?: { user: UserProfile };
//     }
// }

export interface UserProfile {
    provider: string;
    _raw: string;
    _json: any;
    emails: string;
    id: string;
    username: string;
    sub: string;
    administrator: string;
    locale: string;
    name: string;
    given_name: string;
}

type VerifyFunction = (accessToken: string, refreshToken: string, params, profile: UserProfile) =>
    Promise<{ user, info }>;

export const HKMOOCStrategyNAME = 'HKMOOCStrategy';

export class HKMOOCStrategy extends BaseOAuth2Strategy {
    // private authorizationURL: string;
    // private tokenURL: string;
    // private scopeSeparator: string;
    // private customHeaders: object;
    private userProfileURL: string;

    constructor(clientId: string,
                authorizationURL: string = 'https://learn2.hkmooc.hk/oauth2/authorize/',
                tokenURL: string = 'https://learn2.hkmooc.hk/oauth2/access_token/',
                verify: VerifyFunction,
                skipUserProfile: boolean = false,
                scopeSeparator: string = ' ',
                userProfileURL: string = 'https://learn2.hkmooc.hk/oauth2/user_info',
                callbackURL?: string,
                scope?: string | string[],
                sessionKey?: string,
                clientSecret?: string,
                customHeaders: any = {},
                stateStore?: object | boolean) {
        if (!customHeaders['User-Agent']) {
            customHeaders['User-Agent'] = 'passport-hkmooc';
        }
        super(clientId,
            authorizationURL,
            tokenURL,
            verify,
            skipUserProfile,
            scopeSeparator,
            callbackURL,
            scope,
            sessionKey,
            clientSecret,
            customHeaders,
            stateStore,
        );
        this.name = HKMOOCStrategyNAME;
        this.userProfileURL = userProfileURL;
        this.oauth2.UseAuthorizationHeaderForGET = true;
    }

    public async userProfile(accessToken): Promise<UserProfile> {
        let result;
        let response;
        let json;
        try {
            ({ result, response } = await this.oauth2.get(this.userProfileURL, accessToken));
        } catch (err) {
            if (err.message) {
                try {
                    json = JSON.parse(err.message);
                } catch (_) {
                    console.warn('============This error can be ignored==============');
                    console.warn(_);
                    console.warn('===================================================');
                }
            }
            // TODO
            if (json && json.error) {
                throw new Error(json.message);
            }
            throw new Error(`Failed to fetch user profile:${err.message}`);
        }

        try {
            json = JSON.parse(result);
        } catch (ex) {
            throw new Error('Failed to parse user profile');
        }

        const profile: UserProfile = {
            provider: 'HKMOOC',
            _raw: result,
            _json: json,
            emails: json.email,
            id: json.email,
            username: json.preferred_username,
            sub: json.sub,
            administrator: json.administrator,
            locale: json.locale,
            name: json.name,
            given_name: json.given_name,
        };

        return profile;
    }
}
