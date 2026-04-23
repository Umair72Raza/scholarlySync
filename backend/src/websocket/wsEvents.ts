export const WS_EVENTS = {
  // Submission lifecycle
  SUBMISSION_QUEUED:     'SUBMISSION_QUEUED',
  SUBMISSION_PROCESSING: 'SUBMISSION_PROCESSING',
  SUBMISSION_VERIFIED:   'SUBMISSION_VERIFIED',
  SUBMISSION_FAILED:     'SUBMISSION_FAILED',

  // Content
  NEW_MATERIAL:          'NEW_MATERIAL',

  // Notifications
  NEW_NOTIFICATION:      'NEW_NOTIFICATION',
  BULK_ALERT:            'BULK_ALERT',

  // System
  CONNECTED:             'CONNECTED',
} as const;

export type WsEvent = (typeof WS_EVENTS)[keyof typeof WS_EVENTS];
