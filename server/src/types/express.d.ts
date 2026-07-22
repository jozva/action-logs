import type { AuthenticatedUser } from './auth.js';
import type { ListLogsQuery } from '../validators/logValidators.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      validatedQuery?: ListLogsQuery;
      validatedParams?: {
        id?: string;
      };
      validatedBody?: unknown;
    }
  }
}

export {};
