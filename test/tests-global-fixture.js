import { mkdir, rm } from 'fs/promises';
import { join } from 'path';

const playgroundPath = join('test', 'playground');

async function createPlayground() {
  await mkdir(playgroundPath, { recursive: true });
}

async function deletePlayground() {
  await rm(playgroundPath, { recursive: true, force: true });
}

export const mochaGlobalSetup = async () => {
  await createPlayground();
};

export const mochaGlobalTeardown = async () => {
  await deletePlayground();
};
