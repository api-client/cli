import { 
  Workspace, IUserSpaces, IAccessControl, IWorkspace, IHttpProject, 
  HttpProject, IHttpProjectListItem, IRevisionInfo, HttpProjectKind,
} from '@api-client/core';
import { DataMock } from '@pawel-up/data-mock';
import { PutBatch } from 'abstract-leveldown';
import { ArcLevelUp } from '@api-client/net-store';

export class TestStore extends ArcLevelUp {
  mock = new DataMock();

  async clearUsers(): Promise<void> {
    const { users } = this;
    if (users) {
      await users.clear();
    }
  }

  async clearSessions(): Promise<void> {
    const { sessions } = this;
    if (sessions) {
      await sessions.clear();
    }
  }

  async clearSpaces(): Promise<void> {
    const { spaces, userSpaces } = this;
    if (spaces) {
      await spaces.clear();
    }
    if (userSpaces) {
      await userSpaces.clear();
    }
  }

  async clearProjects(): Promise<void> {
    const { projectsIndex, projectsData } = this;
    if (projectsIndex) {
      await projectsIndex.clear();
    }
    if (projectsData) {
      await projectsData.clear();
    }
  }

  async clearRevisions(): Promise<void> {
    const { projectRevisions } = this;
    if (projectRevisions) {
      await projectRevisions.clear();
    }
  }

  async clearBin(): Promise<void> {
    const { trashBin } = this;
    if (trashBin) {
      await trashBin.clear();
    }
  }

  async generateSpaces(size=25, owner?: string): Promise<IWorkspace[]> {
    const { spaces, userSpaces } = this;
    if (!spaces || !userSpaces) {
      throw new Error('generateSpaces');
    }
    const data: PutBatch[] = [];
    const result: IWorkspace[] = [];
    const spacesMap:Record<string, IUserSpaces> = {};
    for (let i = 0; i < size; i++) {
      const name = this.mock.lorem.word();
      const workspace = Workspace.fromName(name, owner);
      result.push(workspace.toJSON());
      data.push({
        type: 'put',
        key: workspace.key,
        value: JSON.stringify(workspace),
      });
      const uid = owner || 'default';
      const access: IAccessControl = {
        key: workspace.key,
        level: 'owner',
      };
      if (spacesMap[uid]) {
        spacesMap[uid].spaces.push(access);
      } else {
        spacesMap[uid] = {
          user: uid,
          spaces: [access],
        };
      }
    }
    await spaces.batch(data);
    const accessData: PutBatch[] = [];
    Object.keys(spacesMap).forEach((uid) => {
      accessData.push({
        type: 'put',
        key: uid,
        value: JSON.stringify(spacesMap[uid]),
      });
    });
    await userSpaces.batch(accessData);
    return result;
  }

  async generateProjects(spaceKey: string, size=25): Promise<IHttpProject[]> {
    const { projectsIndex, projectsData } = this;
    if (!projectsIndex || !projectsData) {
      throw new Error(`Store not initialized.`);
    }
    const data: PutBatch[] = [];
    const index: PutBatch[] = [];
    const result: IHttpProject[] = [];
    for (let i = 0; i < size; i++) {
      const name = this.mock.lorem.word();
      const project = HttpProject.fromName(name);
      const finalKey = `~${spaceKey}~${project.key}~`;
      result.push(project.toJSON());
      data.push({
        type: 'put',
        key: finalKey,
        value: JSON.stringify(project),
      });
      const item: IHttpProjectListItem = {
        key: project.key,
        name: project.info.name || 'Unnamed project',
        updated: Date.now(),
      };
      index.push({
        type: 'put',
        key: finalKey,
        value: JSON.stringify(item),
      });
    }
    await projectsIndex.batch(index);
    await projectsData.batch(data);

    return result;
  }

  async generateRevisions(projectKey: string, size=25): Promise<void> {
    const { projectRevisions } = this;
    if (!projectRevisions) {
      throw new Error(`Store not initialized.`);
    }
    const data: PutBatch[] = [];
    const result: IRevisionInfo[] = [];
    let created = Date.now();
    for (let i = 0; i < size; i++) {
      created += this.mock.types.number({ min: 1, max: 10000 });
      const id = `~project~${projectKey}~${created}~`;
      const patch: any = {
        op: 'replace',
        path: '/info/name',
        value: this.mock.lorem.word(),
      };
      const info: IRevisionInfo = {
        id,
        key: projectKey,
        kind: HttpProjectKind,
        created,
        deleted: false,
        patch,
      };
      result.push(info);
      data.push({
        type: 'put',
        key: id,
        value: JSON.stringify(info),
      });
    }
    await projectRevisions.batch(data);
  }
}
