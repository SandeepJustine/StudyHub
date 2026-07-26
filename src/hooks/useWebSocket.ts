'use client';

import { useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { socketClient } from '@/lib/realtime/socket-client';

export function useSocket() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user) {
      // In production, use a proper JWT token
      socketClient.connect(session.user.id);
    }

    return () => {
      socketClient.disconnect();
    };
  }, [session]);

  const subscribe = useCallback((event: string, callback: Function) => {
    socketClient.on(event, callback);
    return () => socketClient.off(event, callback);
  }, []);

  const emit = useCallback((event: string, data: any) => {
    socketClient.emit(event, data);
  }, []);

  return {
    subscribe,
    emit,
    isConnected: socketClient.isConnected(),
    joinRoom: (room: string) => socketClient.joinRoom(room),
    leaveRoom: (room: string) => socketClient.leaveRoom(room),
  };
}