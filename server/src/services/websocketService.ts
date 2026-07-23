import type { Server as SocketServer, Socket } from 'socket.io';
import { logger } from '../utils/logger.js';
import { UnauthorizedError } from '../errors/AppError.js';
import { UserModel } from '../models/User.js';
import { verifyAuthToken } from '../utils/jwt.js';

export type WebSocketEvent = 'logs:created' | 'logs:updated' | 'logs:deleted';

interface LogUpdatePayload {
  logId: string;
  [key: string]: unknown;
}

class WebSocketService {
  private io: SocketServer | null = null;
  private activeConnections = new Map<string, string[]>(); // userId -> socketIds

  initialize(io: SocketServer): void {
    this.io = io;
    logger.info('WebSocket service initialized');
  }

  setupConnections(): void {
    if (!this.io) {
      logger.error('WebSocket not initialized');
      return;
    }

    this.io.on('connection', async (socket: Socket) => {
      logger.info(`WebSocket client connected: ${socket.id}`);

      const authToken = socket.handshake.auth?.token as string | undefined;
      if (!authToken) {
        logger.warn(`WebSocket auth failed: missing token for socket ${socket.id}`);
        socket.emit('unauthorized', { message: 'Missing authentication token' });
        socket.disconnect(true);
        return;
      }

      try {
        const payload = verifyAuthToken(authToken);
        const user = await UserModel.findById(payload.sub).lean().exec();

        if (!user || user.status !== 'active') {
          throw new UnauthorizedError('Account is inactive or does not exist');
        }

        const userId = String(user._id);
        if (!this.activeConnections.has(userId)) {
          this.activeConnections.set(userId, []);
        }
        this.activeConnections.get(userId)?.push(socket.id);

        socket.data.userId = userId;
        socket.join(`user:${userId}`);
        socket.join('logs:all');
        socket.emit('authenticated', { success: true });
        logger.info(`User ${userId} authenticated on socket ${socket.id}`);
      } catch (error: unknown) {
        logger.warn(`WebSocket auth failed for socket ${socket.id}:`, error);
        socket.emit('unauthorized', { message: 'Invalid authentication token' });
        socket.disconnect(true);
        return;
      }

      socket.on('disconnect', () => {
        const userId = socket.data.userId as string | undefined;
        if (userId) {
          const sockets = this.activeConnections.get(userId);
          if (sockets) {
            const index = sockets.indexOf(socket.id);
            if (index > -1) {
              sockets.splice(index, 1);
            }
            if (sockets.length === 0) {
              this.activeConnections.delete(userId);
              logger.info(`User ${userId} disconnected`);
            }
          }
        }
        logger.info(`WebSocket client disconnected: ${socket.id}`);
      });

      socket.on('error', (error: unknown) => {
        logger.error(`WebSocket error on ${socket.id}:`, error);
      });
    });
  }

  broadcastLogEvent(event: WebSocketEvent, payload: LogUpdatePayload): void {
    if (!this.io) {
      logger.warn('WebSocket not initialized, cannot broadcast');
      return;
    }

    logger.info(`Broadcasting event: ${event}`, payload);
    this.io.to('logs:all').emit(event, payload);
  }

  emitToUser(userId: string, event: string, payload: unknown): void {
    if (!this.io) {
      logger.warn('WebSocket not initialized, cannot emit');
      return;
    }

    this.io.to(`user:${userId}`).emit(event, payload);
  }

  getActiveConnectionCount(): number {
    return this.activeConnections.size;
  }
}

export const websocketService = new WebSocketService();
