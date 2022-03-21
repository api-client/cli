import inquirer from 'inquirer';

export class ProjectInteractions {
  /**
   * Asks the user about the project name.
   */
  static async projectName(): Promise<string> {
    const result = await inquirer.prompt({
      type: 'input',
      name: 'name',
      message: 'What is the name of the project?',
    });
    return result.name;
  }

  /**
   * Asks the user about the project name.
   */
  static async projectVersion(): Promise<string> {
    const result = await inquirer.prompt({
      type: 'input',
      name: 'name',
      message: 'What is the the project version? (optional)',
      default: '',
    });
    return result.name;
  }
}
