import { Command } from 'commander';
import { StoreSdk } from '@api-client/core';
import { BaseCommand } from '../BaseCommand.js';
import { Config } from '../../lib/Config.js';

export default class AuthEnvironment extends BaseCommand {
  static get command(): Command {
    const cmd = new Command('auth');
    
    cmd
      .description('When using the net-store it authenticates the user in the system..')
      .argument('[key]', 'The environment key. When not set it uses the default environment.')
      .action(async (key) => {
        const instance = new AuthEnvironment(cmd);
        await instance.run(key);
      });
    return cmd;
  }

  async run(key?: string): Promise<void> {
    const config = new Config();
    const data = await config.read();
    const env = config.getEnv(data, key);
    if (env.source !== 'net-store') {
      this.warn(`This environment does not require user log in.`);
      return;
    }
    if (!env.location) {
      this.warn(`The configuration is incomplete. Missing store location.`);
      return;
    }
    const sdk = new StoreSdk(env.location as string);
    const { token } = await sdk.auth.createSession();
    sdk.token = token;
    try {
      await this.apiStore.authenticateStore(sdk);
    } catch (e) {
      const err = e as Error;
      throw new Error(`Unable to authenticate: ${err.message}`);
    }
    env.token = sdk.token;
    env.authenticated = true;
    await config.write(data);
  }
}
