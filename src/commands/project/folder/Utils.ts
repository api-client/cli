import { printTable, Table } from 'console-table-printer';
import { ProjectFolder } from '@advanced-rest-client/core';

const formatterOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', };
const formatter = new Intl.DateTimeFormat(undefined, formatterOptions);

function prepareFolderTable(folder: ProjectFolder): Record<string, unknown> {
  const folders = folder.listFolderItems();
  const requests = folder.listRequestItems();
  return {
    key: folder.key,
    name: folder.info.name,
    // description: folder.info.description,
    created: formatter.format(folder.created),
    updated: formatter.format(folder.updated),
    folders: folders.length,
    requests: requests.length,
  };
}

/**
 * Prints the folders list to the output.
 */
export function printFolderTable(folders: ProjectFolder[]): void {
  const table = new Table({
    title: 'Project folders',
    columns: [
      { name: 'key', title: 'Key', alignment: 'left',  },
      { name: 'name', title: 'Name', alignment: 'left', },
      { name: 'created', title: 'Created', alignment: 'right', },
      { name: 'updated', title: 'Updated', alignment: 'right', },
      { name: 'folders', title: 'Folders', alignment: 'right', },
      { name: 'requests', title: 'Requests', alignment: 'right', },
    ],
  });
  if (Array.isArray(folders)) {
    folders.forEach((item) => {
      const row = prepareFolderTable(item);
      table.addRow(row);
    });
  }
  table.printTable();
}

/**
 * Prints the folders list to the output.
 */
export function printFolderKeys(folders: ProjectFolder[]): void {
  if (!folders.length) {
    printTable([{ key: '' }]);  
  } else {
    const items = folders.map((item) => ({ key: item.key }));
    printTable(items);
  }
}
