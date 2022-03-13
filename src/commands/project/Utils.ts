import { Environment, HttpProject, ProjectFolder, ProjectRequest, ProjectFolderKind, ProjectRequestKind, IHttpProjectListItem } from '@api-client/core';
import { Table } from 'console-table-printer';
import { ObjectTable } from '../../lib/ObjectTable.js';

const formatterOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', };
const formatter = new Intl.DateTimeFormat(undefined, formatterOptions);

interface ProjectDescription {
  key: string;
  name: string;
  version?: string;
  environments?: string;
  folders?: string;
  requests?: string;
  schemas?: string;
  license?: string;
  provider?: string;
}

export function printProjectInfo(project: HttpProject): void {
  const folders = project.listFolders();
  const requests = project.listRequests();
  const { environments, license, provider, definitions } = project;
  
  const info: ProjectDescription = {
    key: project.key,
    name: project.info.name || '',
  };

  if (project.info.version) {
    info.version = project.info.version;
  }

  const maxWidth = process.stdout.columns || 80;
  const maxValueWidth = maxWidth - 17;

  if (Array.isArray(environments) && environments.length) {
    const envs: Environment[] = [];
    environments.forEach((key) => {
      const env = definitions.environments.find(i => i.key === key);
      if (env) {
        envs.push(env);
      }
    });
    info.environments = envs.map(e => e.info.name || '').join(', ');
    if (info.environments.length > maxValueWidth) {
      info.environments = `${info.environments.substring(0, maxValueWidth)}... (${envs.length})`;
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

  if (Array.isArray(definitions.schemas) && definitions.schemas.length) {
    info.schemas = definitions.schemas.map(e => e.name || '').join(', ');
    if (info.schemas.length > maxValueWidth) {
      info.schemas = `${info.schemas.substring(0, maxValueWidth)}... (${definitions.schemas.length})`;
    }
  } else {
    info.schemas = '(none)';
  }

  if (license && license.name) {
    info.license = license.name;
  }
  if (provider) {
    const { name, email, url } = provider;
    let data = '';
    if (name) {
      data += `${name} `;
    }
    if (email) {
      data += email;
    } else if (url) {
      data += url;
    }
    info.provider = data;
  }
  const table = new ObjectTable(info);
  table.print();
}

export function printProjectChildren(definitions: (ProjectFolder | ProjectRequest | Environment)[]): void {
  const table = new Table({
    columns: [
      { name: 'kind', title: 'Kind', alignment: 'left' },
      { name: 'key', title: 'Key', alignment: 'left' },
      { name: 'name', title: 'Name', alignment: 'right' },
    ],
  });
  definitions.forEach((object) => {
    if (object.kind === ProjectFolderKind) {
      const item = object as ProjectFolder;
      table.addRow({
        kind: item.kind,
        key: item.key,
        name: item.info.name,
      });
    } else if (object.kind === ProjectRequestKind) {
      const item = object as ProjectRequest;
      const { info } = item;
      const name = info ? info.name : '';
      table.addRow({
        kind: item.kind,
        key: item.key,
        name: name,
      });
    }
  });
  table.printTable();
}

export function printProjectsTable(projects: IHttpProjectListItem[]): void {
  const table = new Table({
    title: 'User space projects',
    columns: [
      { name: 'key', title: 'Key', alignment: 'left' },
      { name: 'name', title: 'Name', alignment: 'left' },
      { name: 'updated', title: 'Updated', alignment: 'right' },
    ],
  });
  projects.forEach((object) => {
    table.addRow({
      key: object.key,
      name: object.name,
      updated: formatter.format(object.updated),
    });
  });
  table.printTable();
}
