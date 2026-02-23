'use client';

import {createContext, useContext, useEffect, useMemo, useState} from 'react';
import {useSession} from 'next-auth/react';

export type ClientBookingRecord = {
  sessionId: string;
  bookedAt: string;
  bikeNumber?: number;
};

type ClientBookingsContextValue = {
  bookings: ClientBookingRecord[];
  isBooked: (sessionId: string) => boolean;
  getBooking: (sessionId: string) => ClientBookingRecord | null;
  bookSession: (payload: {sessionId: string; bikeNumber?: number}) => Promise<{
    ok: boolean;
    reason?: string;
    remainingSessions?: number;
  }>;
  cancelSession: (sessionId: string) => boolean;
};

const ClientBookingsContext = createContext<ClientBookingsContextValue | null>(null);

function isBookingArray(value: unknown): value is ClientBookingRecord[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (item) =>
      item &&
      typeof item === 'object' &&
      typeof (item as ClientBookingRecord).sessionId === 'string' &&
      typeof (item as ClientBookingRecord).bookedAt === 'string'
  );
}

export function ClientBookingsProvider({children}: {children: React.ReactNode}) {
  const {status} = useSession();
  const [bookings, setBookings] = useState<ClientBookingRecord[]>([]);

  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated') {
      setBookings([]);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch('/api/bookings', {cache: 'no-store'});
        if (!response.ok) {
          const details = await response.text().catch(() => '');
          console.error(
            `Unable to load bookings from DB API. HTTP ${response.status}${details ? `: ${details}` : ''}`
          );
          if (!cancelled) setBookings([]);
          return;
        }
        const parsed = (await response.json()) as ClientBookingRecord[];
        if (!cancelled && isBookingArray(parsed)) {
          setBookings(parsed);
        }
      } catch (error) {
        console.error('Unable to load bookings from DB API.', error);
        if (!cancelled) setBookings([]);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [status]);

  const value = useMemo<ClientBookingsContextValue>(
    () => ({
      bookings,
      isBooked: (sessionId) => bookings.some((item) => item.sessionId === sessionId),
      getBooking: (sessionId) => bookings.find((item) => item.sessionId === sessionId) ?? null,
      bookSession: async ({sessionId, bikeNumber}) => {
        if (status !== 'authenticated') {
          return {ok: false, reason: 'unauthorized'};
        }
        if (bookings.some((item) => item.sessionId === sessionId)) {
          return {ok: false, reason: 'already-booked'};
        }
        try {
          const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({sessionId, bikeNumber})
          });
          const payload = (await response.json().catch(() => null)) as
            | {sessionId?: string; bookedAt?: string; bikeNumber?: number; remainingSessions?: number; reason?: string}
            | null;
          if (!response.ok || !payload?.sessionId || !payload.bookedAt) {
            return {ok: false, reason: payload?.reason ?? `http-${response.status}`};
          }

          const record: ClientBookingRecord = {
            sessionId: payload.sessionId,
            bookedAt: payload.bookedAt,
            bikeNumber: payload.bikeNumber
          };
          setBookings((prev) => {
            const alreadyExists = prev.some((item) => item.sessionId === record.sessionId);
            return alreadyExists ? prev : [...prev, record];
          });
          return {ok: true, remainingSessions: payload.remainingSessions};
        } catch (error) {
          console.error('Unable to persist booking to DB.', error);
          return {ok: false, reason: 'network-error'};
        }
      },
      cancelSession: (sessionId) => {
        if (status !== 'authenticated') return false;
        const exists = bookings.some((item) => item.sessionId === sessionId);
        if (!exists) return false;
        const previous = bookings;
        setBookings((prev) => prev.filter((item) => item.sessionId !== sessionId));
        void fetch(`/api/bookings?sessionId=${encodeURIComponent(sessionId)}`, {
          method: 'DELETE'
        })
          .then(async (response) => {
            if (response.ok) return;
            setBookings(previous);
          })
          .catch((error) => {
            console.error('Unable to cancel booking in DB.', error);
            setBookings(previous);
          });
        return true;
      }
    }),
    [bookings, status]
  );

  return <ClientBookingsContext.Provider value={value}>{children}</ClientBookingsContext.Provider>;
}

export function useClientBookings() {
  const context = useContext(ClientBookingsContext);
  if (!context) {
    throw new Error('useClientBookings must be used within ClientBookingsProvider');
  }
  return context;
}
