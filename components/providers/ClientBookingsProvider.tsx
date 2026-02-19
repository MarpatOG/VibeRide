'use client';

import {createContext, useContext, useEffect, useMemo, useState} from 'react';

const DEMO_USER_ID = 'u-client';

export type ClientBookingRecord = {
  sessionId: string;
  bookedAt: string;
  bikeNumber?: number;
};

type ClientBookingsContextValue = {
  bookings: ClientBookingRecord[];
  isBooked: (sessionId: string) => boolean;
  getBooking: (sessionId: string) => ClientBookingRecord | null;
  bookSession: (payload: {sessionId: string; bikeNumber?: number}) => boolean;
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
  const [bookings, setBookings] = useState<ClientBookingRecord[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch(`/api/bookings?userId=${encodeURIComponent(DEMO_USER_ID)}`, {cache: 'no-store'});
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
  }, []);

  const value = useMemo<ClientBookingsContextValue>(
    () => ({
      bookings,
      isBooked: (sessionId) => bookings.some((item) => item.sessionId === sessionId),
      getBooking: (sessionId) => bookings.find((item) => item.sessionId === sessionId) ?? null,
      bookSession: ({sessionId, bikeNumber}) => {
        if (bookings.some((item) => item.sessionId === sessionId)) {
          return false;
        }
        const optimistic: ClientBookingRecord = {
          sessionId,
          bookedAt: new Date().toISOString(),
          bikeNumber
        };
        setBookings((prev) => [...prev, optimistic]);
        void fetch('/api/bookings', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({userId: DEMO_USER_ID, sessionId, bikeNumber})
        })
          .then(async (response) => {
            if (response.ok) return;
            setBookings((prev) => prev.filter((item) => item.sessionId !== sessionId));
          })
          .catch((error) => {
            console.error('Unable to persist booking to DB.', error);
            setBookings((prev) => prev.filter((item) => item.sessionId !== sessionId));
          });
        return true;
      },
      cancelSession: (sessionId) => {
        const exists = bookings.some((item) => item.sessionId === sessionId);
        if (!exists) return false;
        const previous = bookings;
        setBookings((prev) => prev.filter((item) => item.sessionId !== sessionId));
        void fetch(`/api/bookings?userId=${encodeURIComponent(DEMO_USER_ID)}&sessionId=${encodeURIComponent(sessionId)}`, {
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
    [bookings]
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
