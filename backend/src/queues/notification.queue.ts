import { Queue } from 'bullmq';
import { redis } from '../config/redis';

export interface NotificationJobData {
  userId: string;
  message: string;
  type: string; // "REMINDER" | "SUBMISSION_VERIFIED" | "NEW_MATERIAL" | etc.
  assignmentId?: string;
}

export const notificationQueue = new Queue<NotificationJobData>('notification-queue', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'fixed', delay: 5000 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 100 },
  },
});

notificationQueue.on('error', (err) => {
  console.error('❌  [notification-queue] Error:', err.message);
});
