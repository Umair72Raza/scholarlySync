import { Worker } from 'bullmq';
import { createSubmissionWorker } from './submission.worker';
import { createNotificationWorker } from './notification.worker';
import { createBroadcastWorker } from './broadcast.worker';

let activeWorkers: Worker[] = [];

export const startAllWorkers = (): void => {
  const submission = createSubmissionWorker();
  const notification = createNotificationWorker();
  const broadcast = createBroadcastWorker();

  activeWorkers = [submission, notification, broadcast];

  activeWorkers.forEach((worker) => {
    worker.on('completed', (job) =>
      console.log(`✅  [${worker.name}] Job ${job.id} completed`),
    );
    worker.on('failed', (job, err) =>
      console.error(`❌  [${worker.name}] Job ${job?.id} failed: ${err.message}`),
    );
    worker.on('error', (err) =>
      console.error(`❌  [${worker.name}] Worker error: ${err.message}`),
    );
  });

  console.log('🔧  BullMQ workers started: [submission | notification | broadcast]');
};

export const stopAllWorkers = async (): Promise<void> => {
  await Promise.all(activeWorkers.map((w) => w.close()));
  console.log('🔧  All BullMQ workers stopped');
};
