import { StoreSdk, IHttpProject } from '@api-client/core';
import { CommanderError } from 'commander';
import { IConfigEnvironment } from './Config.js';
import { IProjectCommandOptions } from '../commands/project/ProjectCommandBase.js';

/**
 * A class with common function related to the API Store support.
 */
export class ApiStore {
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
    return new StoreSdk(init.location);
  }

  /**
   * Creates a session in the store and authenticates the user when needed.
   * @param sdk The store's SDK
   * @param env The current environment
   * @returns The session token to use with the communication with the store.
   */
  async getStoreSessionToken(sdk: StoreSdk, env: IConfigEnvironment): Promise<string> {
    let { token } = env;
    const meUri = sdk.getUrl(`/users/me`).toString();
    
    if (token) {
      const user = await sdk.http.get(meUri, { token });
      if (user.status === 200) {
        env.authenticated = true;
        sdk.token = token;
        return token;
      }
      token = undefined;
    }
    if (!token) {
      const ti = await sdk.auth.createSession();
      token = ti.token;
      sdk.token = ti.token;
      env.token = ti.token;
      env.authenticated = false;
    }
    const user = await sdk.http.get(meUri, { token });
    if (user.status === 200) {
      env.authenticated = true;
    } else {
      await this.authenticateStore(sdk);
    }
    return token;
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
    if (!result.headers.location) {
      throw new Error(`Unable to create the authorization session on the store. The location header is missing.`);
    }
    const open = await import('open');
    const authEndpoint = sdk.getUrl(result.headers.location).toString();

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
  validateStoreUrl(value: string): string | undefined {
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
    await this.getStoreSessionToken(sdk, env);
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
