#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ProjectCommand from './commands/Project.js';

const program = new Command();
program.version('0.1.0');

program.addCommand(ProjectCommand.command);
program.exitOverride();
// program.allowUnknownOption();

(async (): Promise<void> => {
  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    const cause = err as Error;
    const message = cause.message || 'Unknown error';
    process.stderr.write(Buffer.from(chalk`\n{red ${message.trim()}}\n\n`));
    if (cause.stack) {
      process.stdout.write(Buffer.from(chalk`\n{blackBright ${cause.stack}}\n`));
    }
  }
})();
