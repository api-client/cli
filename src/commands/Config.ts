import { Command } from 'commander';
import { BaseCommand } from './BaseCommand.js';
import ConfigInit from './config/ConfigInit.js';
import ListEnvironments from './config/ListEnvironments.js';
import AddEnvironment from './config/AddEnvironment.js';
import DeleteEnvironment from './config/DeleteEnvironment.js';
import SetDefault from './config/SetDefault.js';
import AuthEnvironment from './config/AuthEnvironment.js';

/**
 * CLI configuration command
 * - config init - initializes the configuration. It offers to replace the config or add an environment
 * - config environments list - Lists the configuration environments
 * - config environments add - adds an environment
 * - config environments delete <key> - deletes an environment
 * - config environments login <key> - authenticates with a net store when needed
 * - config set-default [key] [--interactive] - sets a default environment
 */
export default class ConfigCommand extends BaseCommand {
  async run(): Promise<void> {
    // ...
  }

  /**
   * The command definition.
   */
  static get command(): Command {
    const config = new Command('config');
    config.description('The CLI configuration.');
    config.addCommand(ConfigInit.command);
    const env = new Command('environments');
    env.addCommand(ListEnvironments.command);
    env.addCommand(AddEnvironment.command);
    env.addCommand(DeleteEnvironment.command);
    config.addCommand(AuthEnvironment.command);
    config.addCommand(SetDefault.command);
    config.addCommand(env);
    return config;
  }
}
