'use client';

import {useState} from 'react';
import {faqs} from '@/lib/constants/catalog';
import {t} from '@/lib/utils/localized';
import {Locale} from '@/lib/locale';
import clsx from 'clsx';

export default function FaqAccordionBlock({
  categories,
  locale
}: {
  categories?: string[];
  locale: Locale;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const list = categories?.length
    ? faqs.filter((item) => !item.category || categories.includes(item.category))
    : faqs;

  return (
    <section className="container-wide pt-2 md:pt-3">
      <div className="surface divide-y divide-border">
        {list.map((item) => {
          const open = openId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setOpenId(open ? null : item.id)}
              className="w-full text-left"
            >
              <div className="flex items-center justify-between p-5">
                <div className="text-sm font-semibold">{t(item.question, locale)}</div>
                <span className="text-lg">{open ? '−' : '+'}</span>
              </div>
              <div
                className={clsx(
                  'px-5 pb-5 text-sm text-text-muted transition',
                  open ? 'block' : 'hidden'
                )}
              >
                {t(item.answer, locale)}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

