#!/usr/bin/env node

import { Command, CommanderError } from 'commander';
import chalk from 'chalk';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import ProjectCommand from './commands/Project.js';
import ConfigCommand from './commands/Config.js';
import SpacesCommand from './commands/Space.js';
import AuthCommand from './commands/Auth.js';
import UsersCommand from './commands/Users.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const pkgFile = join(__dirname, '..', 'package.json');
const pkg = JSON.parse(readFileSync(pkgFile, 'utf8'));

const program = new Command();
program.version(pkg.version);

program.addCommand(SpacesCommand.command);
program.addCommand(ProjectCommand.command);
program.addCommand(ConfigCommand.command);
program.addCommand(AuthCommand.command);
program.addCommand(UsersCommand.command);
program.exitOverride();
// program.allowUnknownOption();

(async (): Promise<void> => {
  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    const cause = err as CommanderError;
    if (['commander.version', 'commander.helpDisplayed'].includes(cause.code)) {
      return;
    }
    const message = cause.message || 'Unknown error';
    let mainMessage = '';
    if (cause.code) {
      mainMessage += `\n[${cause.code}]: `;
    }
    mainMessage += chalk.red(`${message.trim()}\n`);
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
