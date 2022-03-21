import { StoreSdk, IHttpProject, RouteBuilder } from '@api-client/core';
import { CommanderError } from 'commander';
import { IConfigEnvironment, Config } from './Config.js';
import { IProjectCommandOptions } from '../commands/project/ProjectCommandBase.js';

export interface ISessionInitInfo {
  /**
   * The user access token to the store.
   */
  token: string;
  /**
   * When the token expires, if ever.
   */
  expires?: number;
  /**
   * Whether a new token was generated or the stored token is valid.
   */
  new: boolean;
}

/**
 * A class with common function related to the API Store support.
 */
export class ApiStore {
  sdkCache = new WeakMap<IConfigEnvironment, StoreSdk>();
  constructor(private config: Config) {}

  /**
   * @param url The base URL to the store.
   * @returns An instance of the store's SDK.
   */
  getSdk(url: string): StoreSdk;
  /**
   * @param env The CLI environment to read the store info from
   * @returns An instance of the store's SDK.
   */
  getSdk(env: IConfigEnvironment): StoreSdk;

  getSdk(init: IConfigEnvironment | string): StoreSdk {
    if (typeof init === 'string') {
      return new StoreSdk(init);
    }
    if (!init.location) {
      throw new Error(`The environment has no store location.`);
    }
    if (init.source !== 'net-store') {
      throw new Error(`Current environment is set to a file. Select a "net-store" environment.`);
    }
    const cached = this.sdkCache.get(init);
    if (cached) {
      return cached;
    }
    const created = new StoreSdk(init.location);
    this.sdkCache.set(init, created);
    return created;
  }

  /**
   * Creates a session in the store and authenticates the user when needed.
   * @param sdk The store's SDK
   * @param env The current environment
   * @returns The session token to use with the communication with the store.
   */
  async getStoreSessionToken(sdk: StoreSdk, env: IConfigEnvironment): Promise<ISessionInitInfo> {
    const meUri = sdk.getUrl(RouteBuilder.usersMe()).toString();
    const result: ISessionInitInfo = {
      token: env.token || '',
      expires: env.tokenExpires,
      new: false,
    };
    
    if (result.token) {
      const user = await sdk.http.get(meUri, { token: result.token });
      if (user.status === 200) {
        env.authenticated = true;
        sdk.token = result.token;
        return result;
      }
    }

    result.token = '';
    delete result.expires;
    result.new = true;

    const info = await sdk.auth.createSession();
    result.token = info.token;
    sdk.token = info.token;
    env.token = info.token;
    env.authenticated = false;

    const user = await sdk.http.get(meUri, { token: result.token });
    if (user.status === 200) {
      env.authenticated = true;
    } else {
      await this.authenticateStore(sdk);
    }
    return result;
  }

  /**
   * When needed authenticates the user and stores the token if needed.
   */
  async authEnv(sdk: StoreSdk, env: IConfigEnvironment): Promise<void> {
    const info = await this.getStoreSessionToken(sdk, env);
    if (info.new) {
      env.token = info.token;
      env.tokenExpires = info.expires;
      await this.config.updateEnvironment(env);
    }
  }

  /**
   * Authenticates the user in the store.
   * Note, it opens the browser to the login endpoint.
   */
  async authenticateStore(sdk: StoreSdk): Promise<void> {
    const loginEndpoint = sdk.getUrl('/auth/login').toString();
    const result = await sdk.http.post(loginEndpoint);
    if (result.status !== 204) {
      throw new Error(`Unable to create the authorization session on the store. Invalid status code: ${result.status}.`);
    }
    const location = result.headers.get('location');
    if (!location) {
      throw new Error(`Unable to create the authorization session on the store. The location header is missing.`);
    }
    const open = await import('open');
    const authEndpoint = sdk.getUrl(location).toString();

    console.log(`Opening a web browser to log in to the store.`);
    console.log(`If nothing happened, open this URL: ${authEndpoint}`);

    await open.default(authEndpoint); // this has the state parameter.
    await sdk.auth.listenAuth(loginEndpoint);
    // there, authenticated.
  }

  /**
   * Validates whether the passed URL is a valid URL.
   * @param value The user input value.
   * @returns An error message or undefined when valid.
   */
  static validateStoreUrl(value: string): string | undefined {
    if (!value) {
      return `Please, enter the base URI to the store.`;
    }
    if (!value.startsWith('http:') && !value.startsWith('https:')) {
      return `Invalid scheme. Valid schemes are "http" or "https".`;
    }
    return undefined;
  }

  /**
   * Reads the project data from the data store.
   */
  async readProject(env: IConfigEnvironment, options: IProjectCommandOptions): Promise<IHttpProject> {
    this.validateUserSpace(options);
    const { space, project } = options;
    if (!project) {
      throw new Error(`The --project option is required when reading a project from the data store.`);
    }
    const sdk = this.getSdk(env);
    await this.authEnv(sdk, env);
    const value = await sdk.project.read(space as string, project);
    return value;
  }

  validateUserSpace(options: IProjectCommandOptions): void {
    const { space } = options;
    if (!space) {
      throw new CommanderError(0, 'E_MISSING_OPTION', `The "space" option is required.`);
    }
  }
}
