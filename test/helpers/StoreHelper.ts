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
}
