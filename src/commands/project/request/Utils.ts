import { printTable, Table } from 'console-table-printer';
import { ProjectRequest, Headers, ISafePayload } from '@api-client/core';
import { ObjectTable } from '../../../lib/ObjectTable.js';

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

interface RequestDescription {
  name: string;
  created: string;
  updated: string;
  url?: string;
  method?: string;
  headers?: string;
  body?: string;
  parent?: string;
  ["parent key"]?: string;
}

/**
 * Prints a table with a request information.
 * Targetted for a single request UI.
 */
export function printRequestInfo(request: ProjectRequest): void {
  const parent = request.getParent();
  const info: RequestDescription = {
    name: request.info.name || '',
    created: formatter.format(request.created),
    updated: formatter.format(request.updated),
  };
  if (request.expects.url) {
    info.url = request.expects.url;
  }
  if (request.expects.method) {
    info.method = request.expects.method;
  }
  if (request.expects.headers) {
    const headers = new Headers(request.expects.headers);
    const names: string[] = [];
    for (const key of headers.keys()) {
      names.push(key);
    }
    info.headers = names.join(', ');
  }
  if (request.expects.payload) {
    if (typeof request.expects.payload === 'string') {
      info.body = 'String value';
    } else {
      const payload = request.expects.payload as ISafePayload;
      switch (payload.type) {
        case 'buffer': info.body = 'Buffer value'; break;
        case 'arraybuffer': info.body = 'Buffer value'; break;
        case 'file':
        case 'blob': info.body = 'File value'; break;
        case 'formdata': info.body = 'FormData value'; break;
        case 'x-www-form-urlencoded': info.body = 'URL encoded value'; break;
        case 'string': info.body = 'String value'; break;
      }
    }
  }
  if (parent && parent !== request.getProject()) {
    info.parent = parent.info.name || '';
    info['parent key'] = parent.key;
  }
  const table = new ObjectTable(info);
  table.print();
}
