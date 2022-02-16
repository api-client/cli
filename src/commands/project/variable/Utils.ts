import { Table } from 'console-table-printer';
import { Property } from '@advanced-rest-client/core';

function prepareVariableTable(property: Property): Record<string, unknown> {
  const { name, value='', type='string', enabled=true, } = property;
  
  return {
    name,
    value,
    type,
    enabled,
  };
}

export function printVariablesTable(variables: Property[]): void {
  const table = new Table({
    title: 'Environment variables',
    columns: [
      { name: 'name', title: 'Name', alignment: 'left', },
      { name: 'value', title: 'Value', alignment: 'left', },
      { name: 'type', title: 'Type', alignment: 'left', },
      { name: 'enabled', title: 'Enabled', alignment: 'right', },
    ],
  });
  variables.forEach((item) => {
    const row = prepareVariableTable(item);
    table.addRow(row);
  });
  table.printTable();
}
