import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload, WsMessage } from '../types';
import { WS_EVENTS } from './wsEvents';

// In-memory registry: userId → WebSocket connection
const clients = new Map<string, WebSocket>();

export const attachWebSocketServer = (server: http.Server): void => {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    // Authenticate via httpOnly cookie sent automatically by the browser
    const cookieHeader = req.headers.cookie;
    let token: string | null = null;
    if (cookieHeader) {
      const match = cookieHeader.match(/accessToken=([^;]+)/);
      if (match) token = match[1];
    }

    if (!token) {
      ws.close(1008, 'Authentication token required');
      return;
    }

    let userId: string;
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      userId = payload.sub;
    } catch {
      ws.close(1008, 'Invalid or expired token');
      return;
    }

    // Register client
    clients.set(userId, ws);
    console.log(`📡  WS connected  → userId: ${userId}  (total: ${clients.size})`);

    // Confirm connection
    ws.send(JSON.stringify({ event: WS_EVENTS.CONNECTED, payload: { userId } }));

    ws.on('close', () => {
      clients.delete(userId);
      console.log(`📡  WS disconnected → userId: ${userId}  (total: ${clients.size})`);
    });

    ws.on('error', (err) => {
      console.error(`📡  WS error for userId ${userId}:`, err.message);
      clients.delete(userId);
    });
  });

  console.log('✅  WebSocket server attached at /ws');
};

/** Send a message to a specific user (no-op if not connected) */
export const broadcast = (userId: string, message: WsMessage): void => {
  const ws = clients.get(userId);
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
};

/** Send a message to ALL connected clients */
export const broadcastAll = (message: WsMessage): void => {
  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
};

export const getConnectedClientCount = (): number => clients.size;
