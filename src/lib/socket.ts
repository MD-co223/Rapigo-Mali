'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './store';

interface UseSocketReturn {
  /** Whether the socket is currently connected */
  isConnected: boolean;
  /** Register a callback for incoming 'notification' events */
  onNotification: (cb: (data: unknown) => void) => void;
  /** Send a notification to a specific user (admin/merchant use case) */
  sendNotification: (userId: string, data: unknown) => void;
}

/**
 * React hook that manages a Socket.io connection to the notification service.
 *
 * - Connects via the gateway pattern: `io('/?XTransformPort=3005')`
 * - On mount, joins the current user's room using `useAuthStore`
 * - Automatically disconnects on unmount
 */
export function useSocket(): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const notificationCallbacksRef = useRef<Set<(data: unknown) => void>>(new Set());

  useEffect(() => {
    // Connect to the notification service via the gateway pattern
    const socket = io('/?XTransformPort=3005', {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[useSocket] Connected to notification service');
      setIsConnected(true);

      // Join the current user's room
      const user = useAuthStore.getState().user;
      if (user?.id) {
        socket.emit('join', { userId: user.id });
        console.log(`[useSocket] Joined room user_${user.id}`);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`[useSocket] Disconnected: ${reason}`);
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[useSocket] Connection error:', err.message);
      setIsConnected(false);
    });

    // Listen for notification events and dispatch to all registered callbacks
    socket.on('notification', (data: unknown) => {
      notificationCallbacksRef.current.forEach((cb) => cb(data));
    });

    // Subscribe to auth store changes to re-join on login
    const unsubscribe = useAuthStore.subscribe((state) => {
      if (state.user?.id && socket.connected) {
        socket.emit('join', { userId: state.user.id });
        console.log(`[useSocket] Re-joined room user_${state.user.id}`);
      }
    });

    return () => {
      unsubscribe();
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('notification');
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, []);

  const onNotification = useCallback((cb: (data: unknown) => void) => {
    notificationCallbacksRef.current.add(cb);
    // Return an unsubscribe function
    return () => {
      notificationCallbacksRef.current.delete(cb);
    };
  }, []);

  const sendNotification = useCallback((userId: string, data: unknown) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('notification', { userId, data });
    } else {
      console.warn('[useSocket] Cannot send notification: socket not connected');
    }
  }, []);

  return { isConnected, onNotification, sendNotification };
}

export default useSocket;