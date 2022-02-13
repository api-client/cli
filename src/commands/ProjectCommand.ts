import { Command } from 'commander';
import chalk from 'chalk';

export abstract class ProjectCommand {
  /**
   * The command definition.
   */
  static get command(): Command {
    throw new Error('Not implemented');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract run(...args: any[]): Promise<void>;

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
