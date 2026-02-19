export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export type UserProfile = {
  firstName: string;
  lastName: string;
  email: string;
};

export type BookingStatus = 'upcoming' | 'past';

export type Booking = {
  id: string;
  status: BookingStatus;
  title: string;
  format: string;
  level: SkillLevel;
  trainerName: string;
  startsAt: string;
  durationMin: number;
  studio?: string;
  bikeNumber?: number;
  freeCancelUntil: string;
};

export type Membership = {
  remainingSessions: number;
  validUntil?: string;
  active: boolean;
};

export type HistoryEventType = 'completed' | 'canceled' | 'session_debited' | 'membership_update';

export type HistoryEvent = {
  id: string;
  type: HistoryEventType;
  occurredAt: string;
  title: string;
  note?: string;
};

