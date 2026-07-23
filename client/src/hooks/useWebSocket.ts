import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { clientEnv } from '@/lib/env';
import { useAuthStore } from '@/stores/authStore';
import { logger } from '@/lib/logger';

interface WebSocketHookOptions {
  onLogsCreated?: (data: { logId: string; [key: string]: unknown }) => void;
  onLogsUpdated?: (data: { logId: string; [key: string]: unknown }) => void;
  onLogsDeleted?: (data: { logId: string; [key: string]: unknown }) => void;
  enabled?: boolean;
}

export function useWebSocket(options: WebSocketHookOptions) {
  const socketRef = useRef<Socket | null>(null);
  const { token, user } = useAuthStore();
  const {
    onLogsCreated,
    onLogsUpdated,
    onLogsDeleted,
    enabled = true,
  } = options;

  useEffect(() => {
    if (!enabled || !token || !user) {
      return;
    }

    const baseUrl = clientEnv.apiBaseUrl.replace('/api/v1', '');

    const socket = io(baseUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      logger.info('WebSocket connected');
      socket.emit('authenticate', user.id);
    });

    socket.on('authenticated', () => {
      logger.info('WebSocket authenticated');
    });

    socket.on('logs:created', (data: unknown) => {
      logger.info('Real-time log update received:', data);
      onLogsCreated?.(data as Parameters<NonNullable<typeof onLogsCreated>>[0]);
    });

    socket.on('logs:updated', (data: unknown) => {
      logger.info('Real-time log update received:', data);
      onLogsUpdated?.(data as Parameters<NonNullable<typeof onLogsUpdated>>[0]);
    });

    socket.on('logs:deleted', (data: unknown) => {
      logger.info('Real-time log deleted:', data);
      onLogsDeleted?.(data as Parameters<NonNullable<typeof onLogsDeleted>>[0]);
    });

    socket.on('disconnect', () => {
      logger.info('WebSocket disconnected');
    });

    socket.on('error', (error: unknown) => {
      logger.error('WebSocket error:', error);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [enabled, token, user, onLogsCreated, onLogsUpdated, onLogsDeleted]);

  return socketRef.current;
}
