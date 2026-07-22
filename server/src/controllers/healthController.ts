import type { Request, Response } from 'express';
import mongoose from 'mongoose';

import { HTTP_STATUS } from '../constants/http.js';
import { sendSuccess } from '../utils/apiResponse.js';

export async function getHealth(_req: Request, res: Response): Promise<Response> {
  const dbState = mongoose.connection.readyState;
  const dbStatus =
    dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';

  return sendSuccess(
    res,
    {
      status: 'ok',
      uptimeSeconds: Math.floor(process.uptime()),
      database: dbStatus,
      timestamp: new Date().toISOString(),
    },
    'Service healthy',
    HTTP_STATUS.OK,
  );
}
