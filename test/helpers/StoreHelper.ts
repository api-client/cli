import { StoreSdk, Workspace, IStoreResponse } from '@api-client/core';
import { IConfigEnvironment } from '../../src/lib/Config.js';

export class StoreHelper {
  sdk: StoreSdk;
  /**
   * The current token.
   */
  token?: string;
  /**
   * The id of the user space created during the initialization.
   */
  space?: string;

  constructor(private baseUri: string) {
    this.sdk = new StoreSdk(this.baseUri);
  }

  async initStore(): Promise<void> {
    const info = await this.sdk.auth.createSession();
    this.token = info.token;
    this.sdk.token = info.token;
  }

  async initStoreSpace(): Promise<void> {
    await this.initStore();
    this.space = await this.sdk.space.create(Workspace.fromName('test'));
  }

  async initMultiUserStore(): Promise<void> {
    const token = await this.createUserToken();
    this.token = token;
    this.sdk.token = token;
  }

  environment(): IConfigEnvironment {
    return {
      key: 'test',
      name: 'default',
      source: 'net-store',
      authenticated: true,
      token: this.token,
      location: this.baseUri,
    };
  }

  async testDelete(path: string): Promise<IStoreResponse> {
    const url = this.sdk.getUrl(path).toString();
    return this.sdk.http.delete(url);
  }

  async testPost(path: string, data?: any): Promise<IStoreResponse> {
    const url = this.sdk.getUrl(path).toString();
    return this.sdk.http.post(url, { body: data });
  }

  /**
   * Performs session initialization and user authentication.
   * 
   * @returns The JWT that has authenticated user.
   */
  async createUserToken(): Promise<string> {
    const tokenInfo = await this.sdk.auth.createSession();
    const token = tokenInfo.token;
    const meUrl = this.sdk.getUrl('/users/me').toString();
    const preTest = await this.sdk.http.get(meUrl, {
      token,
    });
    if (preTest.status === 200) {
      return token;
    }
    const authUrl = await this.getAuthSessionEndpoint(token);
    // this test server uses mocked OAuth server which always returns user data.
    await this.sdk.http.get(authUrl);
    // when the above finishes we are either authenticated as a user or not.
    // We gonna check the /users/me endpoint for confirmation.
    const result = await this.sdk.http.get(meUrl, {
      token,
    });
    // we expect a user info
    if (result.status !== 200) {
      throw new Error(`Authentication unsuccessful. Reported status for /users/me: ${result.status}`);
    }
    return token;
  }

  /**
   * Initializes the authentication session.
   * @param token The unauthenticated session JWT.
   * @returns The location of the authorization endpoint.
   */
  async getAuthSessionEndpoint(token: string): Promise<string> {
    const url = this.sdk.getUrl('/auth/login').toString();
    const result = await this.sdk.http.post(url, {
      token,
    });
    const location = result.headers.get('location');
    if (!location) {
      throw new Error(`The location header not returned by the server.`)
    }
    return this.sdk.getUrl(location).toString();
  }
}
