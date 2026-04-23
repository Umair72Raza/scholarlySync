import Redis from 'ioredis';
import { env } from './env';

// BullMQ requires maxRetriesPerRequest: null
// IORedis auto-detects TLS from rediss:// protocol in the URL
const createRedisConnection = (): Redis => {
  const isTLS = env.REDIS_URL.startsWith('rediss://');

  const client = new Redis(env.REDIS_URL, {
    keepAlive: 30000, // 30 seconds
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: false,
    ...(isTLS && {
      tls: { rejectUnauthorized: false },
    }),
    retryStrategy: (times) => {
      if (times > 20) return null;
      return Math.min(times * 500, 5000);
    },
  });

  // Keep-alive heartbeat: Upstash closes idle connections. 
  // We send a PING every 30s to keep it awake.
  const heartbeat = setInterval(() => {
    if (client.status === 'ready') {
      client.ping().catch(() => {}); 
    }
  }, 30000);

  client.on('error', (err) => {
    if (!err.message.includes('ECONNRESET')) {
      console.error('❌  Redis error:', err.message);
    }
  });

  client.on('close', () => clearInterval(heartbeat));

  return client;
};

// 1. Shared connection for general cache & producers (Queues)
export const redis = createRedisConnection();
redis.on('ready', () => console.log('✅  Redis shared connection ready'));

// 2. Factory for Workers (Workers MUST have dedicated connections)
export const createBullMQConnection = (): Redis => createRedisConnection();

