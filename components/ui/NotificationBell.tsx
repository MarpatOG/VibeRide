'use client';

import {useState} from 'react';
import {notifications} from '@/lib/constants/catalog';
import {useLocale} from '@/lib/locale-client';
import {Locale} from '@/lib/locale';
import clsx from 'clsx';
import {t} from '@/lib/utils/localized';

export default function NotificationBell() {
  const locale = useLocale() as Locale;
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter((item) => !item.isRead).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-full p-2 text-text hover:bg-bg-tertiary"
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        )}
      </button>
      <div
        className={clsx(
          'absolute right-0 top-12 z-40 w-[280px] rounded-2xl border border-border bg-bg-elevated p-4 shadow-xl transition',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        <div className="mb-3 text-sm font-semibold">{locale === 'ru' ? 'Уведомления' : 'Notifications'}</div>
        <div className="flex flex-col gap-3">
          {notifications.map((item) => (
            <div
              key={item.id}
              className={clsx(
                'rounded-xl border border-transparent bg-bg-tertiary p-3 text-xs',
                !item.isRead && 'border-[var(--accent)]'
              )}
            >
              <div className="text-sm font-semibold">{t(item.title, locale)}</div>
              <div className="text-text-muted">{t(item.body, locale)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

