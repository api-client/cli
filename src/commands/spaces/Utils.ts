import { Table } from 'console-table-printer';
import { IUserWorkspace } from '@api-client/core';

/**
 * Prints the list of requests to the output.
 */
export function printSpacesTable(spaces: IUserWorkspace[]): void {
  const table = new Table({
    title: 'User spaces',
    columns: [
      { name: 'key', title: 'Key', alignment: 'left',  },
      { name: 'name', title: 'Name', alignment: 'left', },
      { name: 'access', title: 'Access', alignment: 'left', },
    ],
  });
  spaces.forEach((item) => {
    table.addRow({
      key: item.key,
      name: item.info.name,
      access: item.access,
    });
  });
  table.printTable();
}
