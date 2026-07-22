import type { Request, Response } from 'express';

import { sendSuccess } from '../utils/apiResponse.js';
import { resolveRequestRegionMeta } from '../utils/requestMeta.js';

export async function getDetectedRegion(
  req: Request,
  res: Response,
): Promise<Response> {
  const detected = await resolveRequestRegionMeta(req);
  return sendSuccess(res, detected, 'Region detected');
}
