import { printTable, Table } from 'console-table-printer';
import { ProjectRequest } from '@advanced-rest-client/core';

const formatterOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', };
const formatter = new Intl.DateTimeFormat(undefined, formatterOptions);

function prepareRequestTable(request: ProjectRequest): Record<string, unknown> {
  const { info } = request;
  const expects = request.getExpects();
  return {
    key: request.key,
    name: info.name,
    method: expects.method,
    url: expects.url,
    // description: info.description,
    created: formatter.format(request.created),
    updated: formatter.format(request.updated),
  };
}

/**
 * Prints the list of requests to the output.
 */
export function printRequestTable(folders: ProjectRequest[]): void {
  const table = new Table({
    title: 'Project requests',
    columns: [
      { name: 'key', title: 'Key', alignment: 'left',  },
      { name: 'name', title: 'Name', alignment: 'left', },
      { name: 'method', title: 'Method', alignment: 'left', },
      { name: 'url', title: 'URL', alignment: 'left', },
      { name: 'created', title: 'Created', alignment: 'right', },
      { name: 'updated', title: 'Updated', alignment: 'right', },
    ],
  });
  folders.forEach((item) => {
    const row = prepareRequestTable(item);
    table.addRow(row);
  });
  table.printTable();
}

/**
 * Prints the list of request keys to the output.
 */
export function printRequestKeys(requests: ProjectRequest[]): void {
  if (!requests.length) {
    printTable([{ key: '' }]);
  } else {
    const items = requests.map((item) => ({ key: item.key }));
    printTable(items);
  }
}
