#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ProjectCommand from './commands/Project.js';
import ConfigCommand from './commands/Config.js';
import SpacesCommand from './commands/Spaces.js';

const program = new Command();
program.version('0.1.0');

program.addCommand(ProjectCommand.command);
program.addCommand(ConfigCommand.command);
program.addCommand(SpacesCommand.command);
program.exitOverride();
// program.allowUnknownOption();

(async (): Promise<void> => {
  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    const cause = err as Error;
    const message = cause.message || 'Unknown error';
    const mainMessage = chalk.red(`\n${message.trim()}\n`);
    process.stderr.write(Buffer.from(mainMessage));
    const hasDebug = process.argv.includes('--debug');
    const { stack } = cause;
    if (hasDebug && stack) {
      const stackMessage = chalk.blackBright(`\n${stack.trim()}\n`);
      process.stderr.write(Buffer.from(stackMessage));
    }
    process.stderr.write(Buffer.from('\n'));
  }
})();
