import { Queue } from 'bullmq';
import { redis } from '../config/redis';

export interface SubmissionJobData {
  submissionId: string;
  userId: string;
  assignmentId: string;
  fileUrl: string;   // relative path: "uploads/uuid.pdf"
  fileName: string;  // original filename
  fileSize: number;  // bytes
}

export const submissionQueue = new Queue<SubmissionJobData>('submission-queue', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
  // Throttle: max 100 jobs per second — absorbs 500+ concurrent submission bursts
  limiter: {
    max: 100,
    duration: 1000,
  },
});

submissionQueue.on('error', (err) => {
  console.error('❌  [submission-queue] Error:', err.message);
});
