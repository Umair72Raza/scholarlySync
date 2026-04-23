import { notificationQueue, NotificationJobData } from '../queues/notification.queue';

const HOUR_MS = 60 * 60 * 1000;

/**
 * Schedule drip reminders for an assignment.
 * Enqueues delayed BullMQ jobs for 24h and 2h before deadline.
 */
export const scheduleAssignmentReminders = async (
  userId: string,
  assignmentId: string,
  assignmentTitle: string,
  deadline: Date,
): Promise<void> => {
  const now = Date.now();
  const deadlineMs = deadline.getTime();

  const reminders = [
    { label: '24 hours', delay: deadlineMs - now - 24 * HOUR_MS },
    { label: '2 hours',  delay: deadlineMs - now - 2 * HOUR_MS },
  ];

  for (const { label, delay } of reminders) {
    if (delay <= 0) {
      console.warn(`⚠️   Skipping ${label} reminder for "${assignmentTitle}" — deadline already passed`);
      continue;
    }

    const jobData: NotificationJobData = {
      userId,
      message: `⏰ Reminder: "${assignmentTitle}" is due in ${label}!`,
      type: 'REMINDER',
      assignmentId,
    };

    await notificationQueue.add(
      `reminder-${label.replace(' ', '-')}-${assignmentId}-${userId}`,
      jobData,
      { delay },
    );

    console.log(
      `📅  Scheduled [${label}] reminder for assignment "${assignmentTitle}" (delay: ${Math.round(delay / 60000)} min)`,
    );
  }
};

/**
 * Send an immediate (priority) notification to a user.
 */
export const sendImmediateNotification = async (data: NotificationJobData): Promise<void> => {
  await notificationQueue.add(`immediate-${Date.now()}`, data, { priority: 1 });
};
