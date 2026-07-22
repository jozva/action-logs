import type { ExecuteActionInput } from '../validators/actionValidators.js';
import type {
  BulkUploadBody,
  ListLogsQuery,
} from '../validators/logValidators.js';

declare global {
  namespace Express {
    interface Request {
      validatedQuery?: ListLogsQuery;
      validatedParams?: {
        id?: string;
      };
      validatedBody?: BulkUploadBody | ExecuteActionInput;
    }
  }
}

export {};
