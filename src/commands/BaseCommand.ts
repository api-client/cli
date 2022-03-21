import { Command } from 'commander';
import chalk from 'chalk';
import { ApiStore } from '../lib/ApiStore.js';
import { IConfigEnvironment, Config, IConfig } from '../lib/Config.js';
import { FileStore } from '../lib/FileStore.js';
import { parseInteger } from './ValueParsers.js';

export interface IGlobalOptions {
  /**
   * The key or the name of the configuration environment to use.
   * When not provided then it takes the default environment, if defined.
   */
  configEnv?: string;
  /**
   * The URL of the store to use to connect to the data.
   * Note, setting this up will require authentication flow when running the command.
   */
  store?: string;
  /**
   * For commands that require a selection of the space. The key of the user space to use.
   */
  space?: string;
  /**
   * The config environment to use with the command. This is not available through the CLI.
   */
  env?: IConfigEnvironment;
}

export abstract class BaseCommand {
  /**
   * The command definition.
   */
  static get command(): Command {
    throw new Error('Not implemented');
  }

  /**
   * Appends common for all commands options.
   * @param command The input command
   * @returns The same command for chaining.
   */
  static CliOptions(command: Command): Command {
    return command
      .option(
        '-E, --config-env [name or key]', 
        'The configuration environment to use. When not set it searches for other options (--in, --store) to read the data.'
      )
      .option(
        '-S, --space [key]', 
        'The key of the user space to use.'
      );
  }

  /**
   * Adds options that are reserved for listing objects from the store.
   */
  static ListOptions(command: Command): Command {
    return command
    .option('-c, --cursor [value]', 'The cursor for pagination. It is returned with every list query.')
    .option('-l, --limit [value]', 'The maximum number of results in the response.', parseInteger.bind(null, 'limit'))
    .option('-q, --query [value]', 'If the API supports it, the query term to filter the results')
    .option('-f, --query-field [value...]', 'The list of fields to apply the "--query" to.');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract run(...args: any[]): Promise<void>;
  /**
   * The CLI configuration.
   */
  config = new Config();
  /**
   * An instance to the API store.
   */
  apiStore = new ApiStore(this.config);
  /**
   * An instance to the File store.
   */
  fileStore = new FileStore();
  

  constructor(public command: Command) {}

  /**
   * Reads the CLI configuration
   */
  protected async getConfig(): Promise<IConfig> {
    return this.config.read();
  }

  /**
   * Reads the environment depending on the CLI configuration and user options.
   * @param opts User options.
   * @returns The current environment.
   */
  async readEnvironment(opts: IGlobalOptions): Promise<IConfigEnvironment> {
    if (opts.env) {
      return opts.env;
    }
    const { configEnv, store } = opts;
    if (configEnv && store) {
      throw new Error(`You can either specify the "--store" or "--config-env" option. Not both.`);
    }
    if (store) {
      return {
        key: '',
        name: 'Default',
        source: 'net-store',
        authenticated: false,
        location: store,
      }
    }
    const data = await this.config.read();
    return this.config.getEnv(data, configEnv);
  }

  /**
   * Prints out a warning message.
   * @param message The message to write to the stdout
   */
  warn(message: string): void {
    const data = chalk.magenta(`\n${message}\n`);
    process.stdout.write(Buffer.from(data));
  }

  /**
   * Prints out an error message.
   * @param message The message to write to the stdout
   */
  err(message: string): void {
    const data = chalk.red(`\n${message}\n`);
    process.stderr.write(Buffer.from(data));
  }

  /**
   * Prints out a message in a new line.
   * @param message The message to write to the stdout
   */
  println(message: string): void {
    const data =`\n${message}\n`;
    process.stdout.write(Buffer.from(data));
  }
}
