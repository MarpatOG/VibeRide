import {HistoryEvent as DbHistoryEvent, Membership as DbMembership, Session as DbSession, Trainer as DbTrainer, User as DbUser} from '@prisma/client';
import {HistoryEvent, Membership, UserProfile} from '@/lib/types/profile';
import {Session} from '@/lib/types/session';
import {Trainer} from '@/lib/types/trainer';

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

export function toTrainerPayload(item: DbTrainer): Trainer {
  return {
    id: item.id,
    name: item.name,
    lastName: item.lastName,
    photoUrl: item.photoUrl,
    tags: normalizeTags(item.tagsJson),
    bio: {
      ru: item.bioRu,
      en: item.bioEn
    }
  };
}

export function toSessionPayload(item: DbSession): Session {
  return {
    id: item.id,
    hallId: item.hallId,
    startsAt: item.startsAt,
    durationMin: item.durationMin,
    title: {ru: item.titleRu, en: item.titleEn},
    subtitle: {ru: item.subtitleRu, en: item.subtitleEn},
    description: {ru: item.descriptionRu, en: item.descriptionEn},
    isThematic: item.isThematic,
    trainerId: item.trainerId ?? '',
    trainerDetached: item.trainerDetached,
    capacity: item.capacity,
    bookedCount: item.bookedCount,
    level: item.level
  };
}

export function toUserProfilePayload(user: DbUser): UserProfile {
  return {
    firstName: user.name,
    lastName: user.lastName ?? '',
    email: user.email
  };
}

export function toMembershipPayload(item: DbMembership | null): Membership {
  if (!item) {
    return {
      remainingSessions: 0,
      validUntil: undefined,
      active: false
    };
  }
  return {
    remainingSessions: item.remainingSessions,
    validUntil: item.validUntil ?? undefined,
    active: item.active
  };
}

export function toHistoryPayload(item: DbHistoryEvent): HistoryEvent {
  return {
    id: item.id,
    type: item.type,
    occurredAt: item.occurredAt,
    title: item.titleEn,
    note: item.noteEn ?? undefined
  };
}

export function toLocalizedHistoryPayload(item: DbHistoryEvent, locale: 'ru' | 'en'): HistoryEvent {
  return {
    id: item.id,
    type: item.type,
    occurredAt: item.occurredAt,
    title: locale === 'ru' ? item.titleRu : item.titleEn,
    note: locale === 'ru' ? (item.noteRu ?? undefined) : (item.noteEn ?? undefined)
  };
}
