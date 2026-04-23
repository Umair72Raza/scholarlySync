import { Worker, Job } from 'bullmq';
import { createBullMQConnection } from '../config/redis';
import { NotificationModel } from '../models/notification.model';
import { broadcast } from '../websocket/wsServer';
import { WS_EVENTS } from '../websocket/wsEvents';
import { NotificationJobData } from '../queues/notification.queue';

const processNotification = async (job: Job<NotificationJobData>): Promise<void> => {
  const { userId, message, type, assignmentId } = job.data;
  console.log(`🔔  [notification-worker] Job ${job.id} → user ${userId}: [${type}]`);

  // Persist to DB
  await NotificationModel.create({
    message,
    type,
    user: { connect: { id: userId } },
    ...(assignmentId && { scheduledAt: new Date() }),
  });

  // Push real-time via WebSocket (no-op if user is offline)
  broadcast(userId, {
    event: WS_EVENTS.NEW_NOTIFICATION,
    payload: { message, type },
  });

  console.log(`✅  [notification-worker] Notification delivered to user ${userId}`);
};

export const createNotificationWorker = (): Worker<NotificationJobData> =>
  new Worker<NotificationJobData>('notification-queue', processNotification, {
    connection: createBullMQConnection(),
    concurrency: 20,
  });
