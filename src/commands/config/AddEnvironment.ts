import { Command, Option, CommanderError } from 'commander';
import { uuidV4 } from '@api-client/core';
import { BaseCommand } from '../BaseCommand.js';
import { InteractiveConfig } from './InteractiveConfig.js';
import { Config, IConfigEnvironment } from '../../lib/Config.js';
import { FileStore } from '../../lib/FileStore.js';
import { ApiStore } from '../../lib/ApiStore.js';
import { IEnvironmentCreateOptions } from '../../interactive/ConfigInteractions.js';

interface ICommandOptions extends IEnvironmentCreateOptions {
  interactive?: boolean;
}

export default class AddEnvironment extends BaseCommand {
  static get command(): Command {
    const cmd = new Command('add');

    const srcOption = new Option('--source', 'The data source for this environment. Choose "file" to read project data from a file or "net-store" to connect to the store.').choices(['file', 'net-store']);
    cmd
      .description('Adds a new configuration environment.')
      .option('-i, --interactive', 'When set it ignores set options and starts an interactive form to gather environment data')
      .option('-n, --name [value]', 'The name of the environment. Required in non-interactive mode.')
      .option('-l --location [value]', 'The URL to the store or an absolute path to the project file. Required in non-interactive mode.')
      .option('-a, --authenticate', 'Performs authentication (if required) after creating the environment. Required in non-interactive mode with "source" set to "net-store".')
      .option('-d, --make-default', 'Makes this environment a default environment.')
      .addOption(srcOption)
      .action(async (opts) => {
        const instance = new AddEnvironment(cmd);
        await instance.run(opts);
      });
    return cmd;
  }

  async run(opts: ICommandOptions): Promise<void> {
    if (opts.interactive) {
      return this.runInteractive();
    }
    
    return this.runNonInteractive(opts);
  }

  async runInteractive(): Promise<void> {
    if (!process.stdout.isTTY) {
      throw new Error(`This commands can only run in the interactive mode.`);
    }
    const interactive = new InteractiveConfig(this.config);
    await interactive.addEnvironment();
  }

  async runNonInteractive(opts: ICommandOptions): Promise<void> {
    const { authenticate=false, makeDefault=false, source, location, name } = opts;
    if (!source) {
      throw new CommanderError(1, 'E_MISSING_OPTION', 'The "source" option is required in non-interactive mode.');
    }
    if (!location) {
      throw new CommanderError(1, 'E_MISSING_OPTION', 'The "location" option is required in non-interactive mode.');
    }
    if (!name) {
      throw new CommanderError(1, 'E_MISSING_OPTION', 'The "name" option is required in non-interactive mode.');
    }
    if (source === 'file') {
      const error = await FileStore.validateFileLocation(location);
      if (error) {
        throw new CommanderError(1, 'E_INVALID_OPTION', `The "location" validation error: ${error}.`);
      }
    } else if (source === 'net-store') {
      const error = ApiStore.validateStoreUrl(location);
      if (error) {
        throw new CommanderError(1, 'E_INVALID_OPTION', `The "location" validation error: ${error}.`);
      }
    }
    const env: IConfigEnvironment = {
      key: uuidV4(),
      source,
      name,
      location,
    };
    if (source === 'net-store') {
      await this.processNetStore(env, location, authenticate);
    }
    const config = new Config();
    await config.addEnvironment(env, {
      makeDefault,
    });
  }

  private async processNetStore(env: IConfigEnvironment, location: string, authenticate: boolean): Promise<void> {
    const sdk = this.apiStore.getSdk(location);
    const { token } = await sdk.auth.createSession();
    env.token = token;
    sdk.token = token;
    const info = await sdk.store.getInfo();
    if (authenticate && info.mode !== 'multi-user') {
      // TODO: delete the session.
      throw new CommanderError(1, 'E_INVALID_OPTION', 'The store is not configured to authenticate a user.');
    }
    if (!authenticate) {
      env.authenticated = false;
      return;
    }
    try {
      await this.apiStore.authenticateStore(sdk);
    } catch (e) {
      const err = e as Error;
      throw new CommanderError(1, 'E_STORE_AUTH', `Unable to authenticate: ${err.message}`);
    }
    env.authenticated = true;
  }
}
