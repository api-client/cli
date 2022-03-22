import enquirer from 'enquirer';
// @ts-ignore
const { NumberPrompt } = enquirer;

export class RunnerInteractions {
  static async recursive(): Promise<boolean> {
    const prompt = await enquirer.prompt({
      type: 'confirm',
      message: 'Should run requests recursively (from all all folders under the parent)?',
      name: 'recursive',
      initial: true,
    }) as any;
    return prompt.recursive;
  }

  static async iterations(): Promise<number> {
    const prompt = new NumberPrompt({
      message: 'How many iterations to execute? Must be at least 1.',
      name: 'iterations',
      initial: 1,
      validate(value: string): string | boolean {
        const parsed = Number.parseInt(value);
        if (Number.isNaN(parsed)) {
          return prompt.styles.danger(`The iterations must be a number`);
        }
        if (parsed < 1) {
          return prompt.styles.danger(`The iterations number must be at least 1`);
        }
        return true;
      }
    });
    const answer = await prompt.run();
    return Number(answer);
  }

  static async parallel(): Promise<boolean> {
    const prompt = await enquirer.prompt({
      type: 'confirm',
      message: 'Should run iterations in parallel?',
      name: 'parallel',
      initial: false,
    }) as any;
    return prompt.parallel;
  }
}
