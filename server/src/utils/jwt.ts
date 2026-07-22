import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';
import type { ActorRole } from '../constants/logs.js';
import { UnauthorizedError } from '../errors/AppError.js';

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: ActorRole;
  name: string;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    if (typeof decoded === 'string') {
      throw new UnauthorizedError('Invalid authentication token');
    }

    const { sub, email, role, name } = decoded as AuthTokenPayload;
    if (!sub || !email || !role || !name) {
      throw new UnauthorizedError('Invalid authentication token payload');
    }

    return { sub, email, role, name };
  } catch {
    throw new UnauthorizedError('Invalid or expired authentication token');
  }
}
