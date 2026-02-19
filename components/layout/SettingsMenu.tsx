'use client';

import {useMemo, useState} from 'react';
import clsx from 'clsx';
import ThemeSwitch from '@/components/layout/ThemeSwitch';
import {useLocale} from '@/lib/locale-client';
import {Locale} from '@/lib/locale';
import {notifications} from '@/lib/constants/catalog';
import {t} from '@/lib/utils/localized';

export default function SettingsMenu() {
  const locale = useLocale() as Locale;
  const [open, setOpen] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    []
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-full border border-border bg-bg-elevated p-2 text-text hover:bg-bg-tertiary"
        aria-label="Открыть настройки"
      >
        ⚙️
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      <div
        className={clsx(
          'absolute right-0 top-12 z-50 w-[320px] rounded-2xl border border-border bg-bg-elevated p-4 shadow-xl transition',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        <div className="mb-2 text-sm font-semibold">Настройки</div>

        <div className="mb-3 flex items-center justify-between rounded-xl bg-bg-tertiary p-3">
          <span className="text-sm">Тема</span>
          <ThemeSwitch />
        </div>

        <div className="rounded-xl bg-bg-tertiary p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold">Уведомления</span>
            <span className="text-xs text-text-muted">{unreadCount}</span>
          </div>
          <div className="flex max-h-[180px] flex-col gap-2 overflow-auto">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={clsx(
                  'rounded-lg border border-transparent bg-bg-elevated p-2 text-xs',
                  !item.isRead && 'border-[var(--accent)]'
                )}
              >
                <div className="font-semibold">{t(item.title, locale)}</div>
                <div className="text-text-muted">{t(item.body, locale)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

