import { Command, Option } from 'commander';
import { BaseCommand } from './BaseCommand.js';

export abstract class ProjectCommand extends BaseCommand {
  /**
   * Adds global options for the entire CLI
   * 
   * @param command The input command
   * @returns The same command for chaining.
   */
  static globalOptions(command: Command): Command {
    BaseCommand.CliOptions(command);
    const inOption = new Option('-i, --in [project location]', 'the location of the HTTP project file');
    inOption.env('HTTP_PROJECT')
    command.addOption(inOption);
    return command
      .option('-P, --project [project key]', 'The key of the project folder. Cannot be set together with "--in".')
      .option('--pretty-print', 'When preparing the output it formats the JSON for readability.')
      .option('--debug', 'Prints more detailed errors.');
  }

  /**
   * Appends project's output options to the command
   * 
   * @param command The input command
   * @returns The same command for chaining.
   */
  static outputOptions(command: Command): Command {
    return command
      .option('-o, --out [path]', 'The output location of the project file. It is ignored when "--config-env" is used. When not set a default environment is used.')
      .option('-s, --overwrite', 'Overrides the input project when --out is not set. When --out is set it overrides the existing file if exists. It is ignored when "--config-env" is used.');
  }

  /**
   * Appends a global option to list keys only.
   * 
   * @param command The input command
   * @returns The same command for chaining.
   */
  static keyListingOptions(command: Command): Command {
    return command
      .option('-k, --key-only', 'Prints a table with keys only rather than entire objects.');
  }

  /**
   * Appends a global option used with a formatter.
   * 
   * @param command The input command
   * @returns The same command for chaining.
   */
  static reporterOptions(command: Command, reporters = ['table', 'json']): Command {
    const reporterOption = new Option(
      '-r, --reporter <value>', 
      `The reporter to use to print the values. Ignored when --key-only is set. Default to "${reporters[0]}".`
    ).choices(reporters).default(reporters[0]);
    command.addOption(reporterOption);
    return command;
  }

  /**
   * Appends a global option used to determine a location in the project
   * 
   * @param command The input command
   * @param keyOnly Should be set for commands that are not using the "name" to find a folder.
   * @returns The same command for chaining.
   */
  static parentSearchOptions(command: Command, keyOnly = false): Command {
    const desc = keyOnly ?
      'The key of the parent folder. When not set it assumes the project\'s root.':
      'The name or the key of the parent folder. When not set it assumes the project\'s root.';
    return command
    .option(
      '-p, --parent <value>', 
      desc
    );
  }
}
