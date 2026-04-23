import { Worker, Job } from 'bullmq';
import path from 'path';
import fs from 'fs';
import { createBullMQConnection } from '../config/redis';
import { SubmissionModel } from '../models/submission.model';
import { NotificationModel } from '../models/notification.model';
import { broadcast } from '../websocket/wsServer';
import { WS_EVENTS } from '../websocket/wsEvents';
import { SubmissionJobData } from '../queues/submission.queue';

const processSubmission = async (job: Job<SubmissionJobData>): Promise<void> => {
  const { submissionId, userId, fileName, fileUrl, fileSize } = job.data;
  console.log(`📥  [submission-worker] Processing job ${job.id} — submission ${submissionId}`);

  // Step 1: Mark as PROCESSING (30%)
  await SubmissionModel.updateStatus(submissionId, 'PROCESSING');
  broadcast(userId, { event: WS_EVENTS.SUBMISSION_PROCESSING, payload: { submissionId } });
  await job.updateProgress(30);

  // Step 2: Verify file exists on disk (60%)
  const absolutePath = path.join(process.cwd(), fileUrl);
  if (!fs.existsSync(absolutePath)) {
    const reason = 'File not found on server';
    await SubmissionModel.updateStatus(submissionId, 'FAILED', reason);
    broadcast(userId, { event: WS_EVENTS.SUBMISSION_FAILED, payload: { submissionId, reason } });
    throw new Error(`[submission-worker] ${reason}: ${absolutePath}`);
  }
  await job.updateProgress(60);

  // Step 3: Verify file size matches metadata (90%)
  const stats = fs.statSync(absolutePath);
  if (stats.size !== fileSize) {
    const reason = `File size mismatch: expected ${fileSize}B, got ${stats.size}B`;
    await SubmissionModel.updateStatus(submissionId, 'FAILED', reason);
    broadcast(userId, { event: WS_EVENTS.SUBMISSION_FAILED, payload: { submissionId, reason } });
    throw new Error(`[submission-worker] ${reason}`);
  }
  await job.updateProgress(90);

  // Step 4: Mark VERIFIED and notify (100%)
  await SubmissionModel.updateStatus(submissionId, 'VERIFIED');

  await NotificationModel.create({
    message: `Your submission "${fileName}" has been verified successfully. ✅`,
    type: 'SUBMISSION_VERIFIED',
    user: { connect: { id: userId } },
  });

  broadcast(userId, {
    event: WS_EVENTS.SUBMISSION_VERIFIED,
    payload: { submissionId, fileName },
  });

  await job.updateProgress(100);
  console.log(`✅  [submission-worker] Submission ${submissionId} verified`);
};

export const createSubmissionWorker = (): Worker<SubmissionJobData> =>
  new Worker<SubmissionJobData>('submission-queue', processSubmission, {
    connection: createBullMQConnection(),
    concurrency: 10, // process 10 submissions simultaneously
  });
