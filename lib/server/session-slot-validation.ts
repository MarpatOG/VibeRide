import {SlotValidationIssue} from '@/lib/schedule/slot-rules';

type SlotValidationHttpError = {
  status: number;
  body: {
    error: string;
    message: string;
    details?: Record<string, string | number>;
  };
};

export function toSlotValidationHttpError(issue: SlotValidationIssue): SlotValidationHttpError {
  if (issue.type === 'invalid_duration') {
    return {
      status: 400,
      body: {
        error: 'INVALID_DURATION',
        message: 'Session duration must be between 1 and 120 minutes.',
        details: {
          sessionId: issue.sessionId,
          durationMin: issue.durationMin
        }
      }
    };
  }

  if (issue.type === 'invalid_start') {
    return {
      status: 400,
      body: {
        error: 'INVALID_START_TIME',
        message: 'Session start time is invalid.',
        details: {
          sessionId: issue.sessionId
        }
      }
    };
  }

  return {
    status: 409,
    body: {
      error: 'SLOT_CONFLICT',
      message: 'The hall slot is already occupied.',
      details: {
        hallId: issue.hallId,
        sessionId: issue.sessionId,
        conflictingSessionId: issue.conflictingSessionId,
        slotStartAt: issue.slotStartAt
      }
    }
  };
}
