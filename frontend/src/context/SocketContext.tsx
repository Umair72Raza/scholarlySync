import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/authStore';

type SocketCallback = (payload: any) => void;

interface SocketContextType {
  isConnected: boolean;
  on: (event: string, callback: SocketCallback) => void;
  off: (event: string, callback: SocketCallback) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

/** Hook to access the raw socket control */
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};

/** 
 * Clean, declarative hook for subscribing to WebSocket events.
 * Automatically handles cleanup on unmount.
 */
export const useSocketEvent = (event: string, callback: SocketCallback) => {
  const { on, off } = useSocket();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handler = (payload: any) => callbackRef.current(payload);
    on(event, handler);
    return () => off(event, handler);
  }, [event, on, off]);
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const listeners = useRef<Map<string, Set<SocketCallback>>>(new Map());
  const { user } = useAuthStore();

  const on = (event: string, callback: SocketCallback) => {
    if (!listeners.current.has(event)) {
      listeners.current.set(event, new Set());
    }
    listeners.current.get(event)?.add(callback);
  };

  const off = (event: string, callback: SocketCallback) => {
    listeners.current.get(event)?.delete(callback);
  };

  useEffect(() => {
    if (!user) {
      socketRef.current?.close();
      socketRef.current = null;
      setIsConnected(false);
      return;
    }

    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;
    
    const connect = () => {
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        console.log('📡  WS connected');
      };

      socket.onmessage = (event) => {
        try {
          const { event: eventName, payload } = JSON.parse(event.data);
          listeners.current.get(eventName)?.forEach(cb => cb(payload));
        } catch (err) {
          console.error('📡  WS message parse error:', err);
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        if (user) {
          console.log('📡  WS disconnected — retrying in 3s...');
          setTimeout(connect, 3000);
        }
      };
    };

    connect();

    return () => {
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ isConnected, on, off }}>
      {children}
    </SocketContext.Provider>
  );
};
