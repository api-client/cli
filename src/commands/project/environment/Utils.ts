import { printTable, Table } from 'console-table-printer';
import { Environment, HttpProject } from '@advanced-rest-client/core';
import { ObjectTable } from '../../../lib/ObjectTable.js';

function prepareEnvironmentTable(environment: Environment): Record<string, unknown> {
  const { info, variables=[], server } = environment;
  let srvUri = '(none)';
  if (server) {
    srvUri = server.readUri();
  }
  return {
    key: environment.key,
    name: info.name,
    server: srvUri,
    variables: variables.length,
  };
}

/**
 * Prints the list of environments to the output.
 */
export function printEnvironmentTable(environments: Environment[]): void {
  const table = new Table({
    title: 'Project environments',
    columns: [
      { name: 'key', title: 'Key', alignment: 'left',  },
      { name: 'name', title: 'Name', alignment: 'left', },
      { name: 'server', title: 'Server', alignment: 'left', },
      { name: 'variables', title: 'Variables', alignment: 'right', },
    ],
  });
  environments.forEach((item) => {
    const row = prepareEnvironmentTable(item);
    table.addRow(row);
  });
  table.printTable();
}

/**
 * Prints the list of request keys to the output.
 */
export function printEnvironmentKeys(requests: Environment[]): void {
  if (!requests.length) {
    printTable([{ key: '' }]);
  } else {
    const items = requests.map((item) => ({ key: item.key }));
    printTable(items);
  }
}


interface EnvDescription {
  key: string;
  name: string;
  description?: string;
  variables?: string;
  server?: string;
}

/**
 * Prints a table with an environment information.
 * Targetted for a single environment UI.
 */
export function printEnvironmentInfo(environment: Environment): void {
  const { info, key, variables, server } = environment;
  const data: EnvDescription = {
    key,
    name: info.name || '',
  };
  if (info.description) {
    data.description = info.description;
  }
  
  const maxWidth = process.stdout.columns || 80;
  const maxValueWidth = maxWidth - 17;

  if (Array.isArray(variables) && variables.length) {
    data.variables = variables.map(e => e.name || '').join(', ');
    if (data.variables.length > maxValueWidth) {
      data.variables = `${data.variables.substring(0, maxValueWidth)}... (${variables.length})`;
    }
  } else {
    data.variables = '(none)';
  }

  if (server) {
    data.server = server.readUri();
  } else {
    data.server = '(none)';
  }

  const table = new ObjectTable(data);
  table.print();
}

/**
 * Finds an environment anywhere in the project
 */
export function findEnvironment(key: string, project: HttpProject): Environment | undefined {
  const environment = project.definitions.environments.find(i => i.key === key);
  return environment;
}
