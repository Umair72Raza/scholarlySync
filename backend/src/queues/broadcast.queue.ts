import { Queue } from 'bullmq';
import { redis } from '../config/redis';

export interface BroadcastJobData {
  courseId: string;
  message: string;
  sentBy: string; // userId of the teacher/admin
}

export const broadcastQueue = new Queue<BroadcastJobData>('broadcast-queue', {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 3000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 25 },
  },
});

broadcastQueue.on('error', (err) => {
  console.error('❌  [broadcast-queue] Error:', err.message);
});
