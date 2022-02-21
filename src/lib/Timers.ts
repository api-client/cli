/**
 * Awaits the set number of milliseconds before resolving the promise.
 * @param timeout The number of milliseconds to wait.
 */
export function sleep(timeout = 0): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), timeout);
  });
}
