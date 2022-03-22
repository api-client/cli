import inquirer from 'inquirer';
import { FileStore } from '../lib/FileStore.js';
import slugify from 'slugify';
import { join } from 'path';

export class FileSourceInteractions {
  /**
   * Asks the user about the project input file location.
   */
  static async projectSourceFile(): Promise<string> {
    const result = await inquirer.prompt({
      type: 'input',
      message: 'Enter the path to the input project file.',
      name: 'path',
      validate: async (value: string): Promise<string | boolean> => {
        const error = await FileStore.validateFileLocation(value, { allowNotExisting: false, });
        if (error) {
          return error;
        }
        return true;
      }
    });
    return result.path;
  }

  /**
   * Asks the user about the absolute file location
   */
  static async getProjectFileLocation(defaultValue?: string): Promise<string | undefined> {
    const result = await inquirer.prompt({
      type: 'input',
      message: 'Enter the absolute path to the project destination file.',
      name: 'path',
      default: defaultValue,
      validate: async (value: string): Promise<string | boolean> => {
        const error = await FileStore.validateFileLocation(value, { allowNotExisting: true });
        if (error) {
          return error;
        }
        return true;
      }
    });
    return result.path;
  }

  /**
   * Creates a file location from the name.
   * 
   * @param name The name to process.
   * @param ext File extension to use. Must include the "." (dot)
   */
  static filePathFromName(name: string, ext='.json'): string {
    const parsed = slugify(name, {
      lower: true,
      trim: true,
    });
    const file = `${parsed}${ext}`;
    const dir = process.cwd();
    return join(dir, file);
  }
}
