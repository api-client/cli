import { printTable, Table } from 'console-table-printer';
import { Environment } from '@advanced-rest-client/core';

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
