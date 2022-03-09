import { Table } from 'console-table-printer';
import { IUserWorkspace } from '@api-client/core';
import { ObjectTable } from '../../lib/ObjectTable.js';

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

interface SpaceDescription {
  name: string;
  key: string;
  access: string;
  owner: string;
}

/**
 * Prints a table with a user space information.
 * Targetted for a single space UI.
 */
export function printSpaceInfo(space: IUserWorkspace): void {
  const info: SpaceDescription = {
    key: space.key,
    name: space.info.name || '',
    access: space.access,
    owner: space.owner,
  };
  const table = new ObjectTable(info);
  table.print();
}
