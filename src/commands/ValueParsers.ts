import { InvalidArgumentError } from 'commander';

export function parseInteger(property: string, value: string): number {
  const parsedValue = parseInt(value, 10);
  if (Number.isNaN(parsedValue)) {
    throw new InvalidArgumentError(`The ${property} must be a number.`);
  }
  return parsedValue;
}
