import { AsyncLocalStorage } from 'async_hooks';

interface RequestStore {
  /** User id of the signed-in caller, set by the auth guard once the token is verified. */
  userId?: string;
}

const storage = new AsyncLocalStorage<RequestStore>();

/**
 * Per-request context that follows the request through async code, so the database layer
 * can stamp createdBy / updatedBy / deletedBy without every repository passing the actor.
 */
export const requestContext = {
  /** Express middleware: give each request its own store. */
  middleware(_req: unknown, _res: unknown, next: () => void) {
    storage.run({}, next);
  },

  setUser(userId: string) {
    const store = storage.getStore();
    if (store) store.userId = userId;
  },

  /** The acting user's id, or null outside a signed-in request (public forms, seed, jobs). */
  userId(): string | null {
    return storage.getStore()?.userId ?? null;
  },
};
