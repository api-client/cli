import enquirer from 'enquirer';

export class RequestInteractions {
  /**
   * Asks the user about the request name.
   */
  static async requestName(): Promise<string> {
    const prompt = await enquirer.prompt({
      type: 'input',
      message: 'What is the name of the request?',
      name: 'name',
    }) as any;
    return prompt.name;
    // const result = await inquirer.prompt({
    //   type: 'input',
    //   name: 'name',
    //   message: 'What is the name of the request?',
    // });
    // return result.name;
  }

  /**
   * Asks the user about the request URL.
   */
  static async requestUrl(): Promise<string> {
    const prompt = await enquirer.prompt({
      type: 'input',
      message: 'What is the URL of the request?',
      name: 'url',
    }) as any;
    return prompt.url;
    // const result = await inquirer.prompt({
    //   type: 'input',
    //   name: 'url',
    //   message: 'What is the URL of the request?',
    // });
    // return result.url;
  }

  /**
   * Asks the user about the HTTP method
   */
  static async httpOperation(): Promise<string> {
    const prompt = await enquirer.prompt({
      type: 'select',
      choices: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD', 'TRACE', 'CONNECT'],
      message: 'Select the HTTP method.',
      name: 'method',
    }) as any;
    return prompt.method as string;
  }
}
