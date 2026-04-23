import { Worker, Job } from 'bullmq';
import prisma from '../config/prisma';
import { createBullMQConnection } from '../config/redis';
import { NotificationModel } from '../models/notification.model';
import { broadcast } from '../websocket/wsServer';
import { WS_EVENTS } from '../websocket/wsEvents';
import { BroadcastJobData } from '../queues/broadcast.queue';

const processBroadcast = async (job: Job<BroadcastJobData>): Promise<void> => {
  const { courseId, message } = job.data;
  console.log(`📢  [broadcast-worker] Job ${job.id} → course ${courseId}`);

  // Collect unique student IDs in the course via their submissions
  const assignments = await prisma.assignment.findMany({
    where: { courseId },
    select: { submissions: { select: { userId: true } } },
  });

  const userIds = [
    ...new Set(assignments.flatMap((a) => a.submissions.map((s) => s.userId))),
  ];

  if (userIds.length === 0) {
    console.warn(`⚠️   [broadcast-worker] No students found for course ${courseId}`);
    return;
  }

  // Fan-out: persist notification + push WS for each student
  await Promise.all(
    userIds.map(async (userId) => {
      await NotificationModel.create({
        message,
        type: 'BULK_ALERT',
        user: { connect: { id: userId } },
      });
      broadcast(userId, { event: WS_EVENTS.BULK_ALERT, payload: { message, courseId } });
    }),
  );

  console.log(`✅  [broadcast-worker] Broadcast sent to ${userIds.length} students in course ${courseId}`);
};

export const createBroadcastWorker = (): Worker<BroadcastJobData> =>
  new Worker<BroadcastJobData>('broadcast-queue', processBroadcast, {
    connection: createBullMQConnection(),
    concurrency: 5,
  });
