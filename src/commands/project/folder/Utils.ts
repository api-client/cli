import { printTable, Table } from 'console-table-printer';
import { ProjectFolder } from '@advanced-rest-client/core';
import { ObjectTable } from '../../../lib/ObjectTable.js';

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

interface FolderDescription {
  name: string;
  created: string;
  updated: string;
  description?: string;
  environments?: string;
  folders?: string;
  requests?: string;
  parent?: string;
  ["parent key"]?: string;
}

/**
 * Prints a table with a folder information.
 * Targetted for a single folder UI.
 */
export function printFolderInfo(folder: ProjectFolder): void {
  const folders = folder.listFolders();
  const requests = folder.listRequests();
  const { environments } = folder;
  const parent = folder.getParent();
  const info: FolderDescription = {
    name: folder.info.name || '',
    created: formatter.format(folder.created),
    updated: formatter.format(folder.updated),
  };
  
  const maxWidth = process.stdout.columns || 80;
  const maxValueWidth = maxWidth - 17;

  if (folder.info.description) {
    info.description = folder.info.description;
  }
  if (Array.isArray(environments) && environments.length) {
    info.environments = environments.map(e => e.info.name || '').join(', ');
    if (info.environments.length > maxValueWidth) {
      info.environments = `${info.environments.substring(0, maxValueWidth)}... (${environments.length})`;
    }
  } else {
    info.environments = '(none)';
  }

  if (Array.isArray(folders) && folders.length) {
    info.folders = folders.map(e => e.info.name || '').join(', ');
    if (info.folders.length > maxValueWidth) {
      info.folders = `${info.folders.substring(0, maxValueWidth)}... (${folders.length})`;
    }
  } else {
    info.folders = '(none)';
  }

  if (Array.isArray(requests) && requests.length) {
    info.requests = requests.map(e => e.info.name || '').join(', ');
    if (info.requests.length > maxValueWidth) {
      info.requests = `${info.requests.substring(0, maxValueWidth)}... (${requests.length})`;
    }
  } else {
    info.requests = '(none)';
  }

  if (parent && parent !== folder.getProject()) {
    info.parent = parent.info.name || '';
    info['parent key'] = parent.key;
  }
  const table = new ObjectTable(info);
  table.print();
}
