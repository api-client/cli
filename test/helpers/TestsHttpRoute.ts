import { ParameterizedContext } from 'koa';
import { BaseRoute } from '@api-client/net-store';
import { TestStore } from './TestStore.js';

/**
 * This route is only initialized when running tests.
 */
export class TestsHttpRoute extends BaseRoute {

  get testStore(): TestStore {
    return this.store as TestStore;
  }

  async setup(): Promise<void> {
    const { router } = this;

    router.delete('/test/reset/users', this.handleDataResetUsers.bind(this));
    router.delete('/test/reset/sessions', this.handleDataResetSessions.bind(this));
    router.delete('/test/reset/spaces', this.handleDataResetSpaces.bind(this));
    router.delete('/test/reset/projects', this.handleDataResetProjects.bind(this));
    router.delete('/test/reset/revisions', this.handleDataResetRevisions.bind(this));
    router.delete('/test/reset/bin', this.handleDataResetBin.bind(this));
    router.post('/test/generate/spaces', this.handleDataGenerateSpaces.bind(this));
    router.post('/test/generate/projects/:space', this.handleDataGenerateSpaceProjects.bind(this));
    router.post('/test/generate/revisions/pr/:project', this.handleDataGenerateProjectRevisions.bind(this));
  }

  protected async handleDataResetUsers(ctx: ParameterizedContext): Promise<void> {
    try {
      await this.testStore.clearUsers();
      ctx.status = 204;
    } catch (cause) {
      this.errorResponse(ctx, cause);
    }
  }

  protected async handleDataResetSessions(ctx: ParameterizedContext): Promise<void> {
    try {
      await this.testStore.clearSessions();
      ctx.status = 204;
    } catch (cause) {
      this.errorResponse(ctx, cause);
    }
  }

  protected async handleDataResetSpaces(ctx: ParameterizedContext): Promise<void> {
    try {
      await this.testStore.clearSpaces();
      ctx.status = 204;
    } catch (cause) {
      this.errorResponse(ctx, cause);
    }
  }

  protected async handleDataResetProjects(ctx: ParameterizedContext): Promise<void> {
    try {
      await this.testStore.clearProjects();
      ctx.status = 204;
    } catch (cause) {
      this.errorResponse(ctx, cause);
    }
  }

  protected async handleDataResetRevisions(ctx: ParameterizedContext): Promise<void> {
    try {
      await this.testStore.clearRevisions();
      ctx.status = 204;
    } catch (cause) {
      this.errorResponse(ctx, cause);
    }
  }

  protected async handleDataResetBin(ctx: ParameterizedContext): Promise<void> {
    try {
      await this.testStore.clearBin();
      ctx.status = 204;
    } catch (cause) {
      this.errorResponse(ctx, cause);
    }
  }

  protected async handleDataGenerateSpaces(ctx: ParameterizedContext): Promise<void> {
    const { size='25', owner } = ctx.query;
    const sizeParam = Number(size);
    let ownerParam = owner;
    if (!ownerParam) {
      const { user } = ctx.state;
      if (user) {
        ownerParam = user.key;
      }
    }
    try {
      const generated = await this.testStore.generateSpaces(sizeParam, ownerParam as string | undefined);
      ctx.status = 200;
      ctx.type = 'json';
      ctx.body = generated;
    } catch (cause) {
      this.errorResponse(ctx, cause);
    }
  }

  protected async handleDataGenerateSpaceProjects(ctx: ParameterizedContext): Promise<void> {
    const { size='25' } = ctx.query;
    const sizeParam = Number(size);
    const { space } = ctx.params;
    try {
      const generated = await this.testStore.generateProjects(space, sizeParam);
      ctx.status = 200;
      ctx.type = 'json';
      ctx.body = generated;
    } catch (cause) {
      this.errorResponse(ctx, cause);
    }
  }

  protected async handleDataGenerateProjectRevisions(ctx: ParameterizedContext): Promise<void> {
    const { size='25' } = ctx.query;
    const sizeParam = Number(size);
    const { project } = ctx.params;
    try {
      const generated = await this.testStore.generateRevisions(project, sizeParam);
      ctx.status = 200;
      ctx.type = 'json';
      ctx.body = generated;
    } catch (cause) {
      this.errorResponse(ctx, cause);
    }
  }
}
