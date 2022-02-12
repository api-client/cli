import { exec } from 'child_process';

export async function runCommand(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const finalCommand = `node build/src/cli.js ${command}`;

    exec(finalCommand, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        const returnValue = stdout || stderr || '';
        resolve(returnValue.trim());
      }
    });
  });
}
