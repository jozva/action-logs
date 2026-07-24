import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { toast } from 'sonner';
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
  const handlersRef = useRef(options);
  const { token, user } = useAuthStore();
  const { enabled = true } = options;

  useEffect(() => {
    handlersRef.current = options;
  }, [options]);

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
      auth: {
        token,
      },
    });

 

    socket.on('unauthorized', (data: { message?: string }) => {
      const message = data?.message ?? 'WebSocket unauthorized';
      logger.warn('');
      toast.error(message);
      socket.disconnect();
    });

    socket.on('connect_error', (error: unknown) => {
      logger.error('WebSocket connection error:', error);
      const message =
        error instanceof Error ? error.message : '';
      toast.error(message);
    });

    socket.on('logs:created', (data: unknown) => {
      logger.info('Real-time log update received:', data);
      handlersRef.current.onLogsCreated?.(
        data as Parameters<NonNullable<typeof handlersRef.current.onLogsCreated>>[0],
      );
    });

    socket.on('logs:updated', (data: unknown) => {
      logger.info('Real-time log update received:', data);
      handlersRef.current.onLogsUpdated?.(
        data as Parameters<NonNullable<typeof handlersRef.current.onLogsUpdated>>[0],
      );
    });

    socket.on('logs:deleted', (data: unknown) => {
      logger.info('Real-time log deleted:', data);
      handlersRef.current.onLogsDeleted?.(
        data as Parameters<NonNullable<typeof handlersRef.current.onLogsDeleted>>[0],
      );
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
  }, [enabled, token, user]);

  return socketRef.current;
}
