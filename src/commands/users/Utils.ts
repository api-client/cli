import { Table } from 'console-table-printer';
import { IUser, ISpaceUser } from '@api-client/core';
import { ObjectTable } from '../../lib/ObjectTable.js';

/**
 * Prints the list of requests to the output.
 */
export function printUsersTable(users: IUser[]): void {
  const table = new Table({
    title: 'Store users',
    columns: [
      { name: 'key', title: 'Key', alignment: 'left',  },
      { name: 'name', title: 'Name', alignment: 'left', },
      { name: 'locale', title: 'Locale', alignment: 'left', },
    ],
  });
  users.forEach((item) => {
    table.addRow({
      key: item.key,
      name: item.name,
      locale: item.locale,
    });
  });
  table.printTable();
}

interface UserDescription {
  name: string;
  key: string;
  locale: string;
  picture?: string;
}

/**
 * Prints a table with a folder information.
 * Targetted for a single folder UI.
 */
export function printUserInfo(user: IUser): void {
  const info: UserDescription = {
    key: user.key,
    name: user.name || '',
    locale: user.locale || '',
  };
  if (user.picture && user.picture.url) {
    info.picture = user.picture.url;
  }
  const table = new ObjectTable(info);
  table.print();
}

/**
 * Prints the list of requests to the output.
 */
export function printSpaceUsersTable(users: ISpaceUser[]): void {
  const table = new Table({
    title: 'User space users',
    columns: [
      { name: 'key', title: 'Key', alignment: 'left',  },
      { name: 'name', title: 'Name', alignment: 'left', },
      { name: 'locale', title: 'Locale', alignment: 'left', },
      { name: 'access', title: 'Access', alignment: 'left', },
    ],
  });
  users.forEach((item) => {
    table.addRow({
      key: item.key,
      name: item.name,
      locale: item.locale,
      access: item.level,
    });
  });
  table.printTable();
}
