// Load and validate env FIRST — crashes with clear errors if misconfigured
import './config/env';
import './types'; // Registers global Express augmentation

import http from 'http';
import app from './app';
import { env } from './config/env';
import { redis } from './config/redis';
import prisma from './config/prisma';
import { attachWebSocketServer } from './websocket/wsServer';
import { startAllWorkers, stopAllWorkers } from './workers';

const PORT = parseInt(env.PORT, 10);

async function bootstrap(): Promise<void> {
  // ─── Database ────────────────────────────────────────
  try {
    await prisma.$connect();
    console.log('✅  PostgreSQL connected (Supabase)');
  } catch (err) {
    console.error('❌  Database connection failed:', err);
    process.exit(1);
  }

  // ─── HTTP Server ─────────────────────────────────────
  const server = http.createServer(app);

  // ─── WebSocket Server ─────────────────────────────────
  attachWebSocketServer(server);

  // ─── BullMQ Workers ──────────────────────────────────
  startAllWorkers();

  // ─── Listen ──────────────────────────────────────────
  server.listen(PORT, () => {
    console.log(`\n🚀  ScholarlySync API  →  http://localhost:${PORT}`);
    console.log(`📡  WebSocket Server   →  ws://localhost:${PORT}/ws`);
    console.log(`🌍  Environment        →  ${env.NODE_ENV}`);
    console.log(`📁  Uploads directory  →  ${env.UPLOAD_DIR}/\n`);
  });

  // ─── Graceful Shutdown ────────────────────────────────
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n⚠️   ${signal} received — shutting down gracefully...`);
    server.close(async () => {
      await stopAllWorkers();
      await prisma.$disconnect();
      await redis.quit();
      console.log('✅  Shutdown complete.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // ─── Unhandled Errors ────────────────────────────────
  process.on('unhandledRejection', (reason) => {
    console.error('❌  Unhandled Promise Rejection:', reason);
  });
  process.on('uncaughtException', (err) => {
    console.error('❌  Uncaught Exception:', err);
    process.exit(1);
  });
}

bootstrap();
