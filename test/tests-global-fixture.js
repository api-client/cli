import { mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { ExpressServer } from './servers/ExpressServer.js';

const playgroundPath = join('test', 'playground');
const lockFile = join('test', 'express.lock');
const server = new ExpressServer();

async function createPlayground() {
  await mkdir(playgroundPath, { recursive: true });
}

async function deletePlayground() {
  await rm(playgroundPath, { recursive: true, force: true });
}

export const mochaGlobalSetup = async () => {
  await createPlayground();

  await server.start();
  await writeFile(lockFile, JSON.stringify({
    httpPort: server.httpPort,
    httpsPort: server.httpsPort,
  }));
};

export const mochaGlobalTeardown = async () => {
  await deletePlayground();

  await server.stop();
  await rm(lockFile, { force: true });
};
