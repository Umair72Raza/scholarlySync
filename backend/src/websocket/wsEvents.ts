export const WS_EVENTS = {
  // Submission lifecycle
  SUBMISSION_QUEUED:     'SUBMISSION_QUEUED',
  SUBMISSION_PROCESSING: 'SUBMISSION_PROCESSING',
  SUBMISSION_VERIFIED:   'SUBMISSION_VERIFIED',
  SUBMISSION_GRADED:     'SUBMISSION_GRADED',
  SUBMISSION_FAILED:     'SUBMISSION_FAILED',

  // Teacher Alerts
  NEW_SUBMISSION:        'NEW_SUBMISSION',

  // Content
  NEW_MATERIAL:          'NEW_MATERIAL',

  // Notifications
  NEW_NOTIFICATION:      'NEW_NOTIFICATION',
  BULK_ALERT:            'BULK_ALERT',

  // System
  CONNECTED:             'CONNECTED',
} as const;

export type WsEvent = (typeof WS_EVENTS)[keyof typeof WS_EVENTS];
