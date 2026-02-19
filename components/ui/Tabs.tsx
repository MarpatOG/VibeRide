'use client';

import {useState} from 'react';
import clsx from 'clsx';

export type TabItem = {
  key: string;
  label: string;
};

type TabsProps = {
  items: TabItem[];
  defaultKey?: string;
  onChange?: (key: string) => void;
};

export default function Tabs({items, defaultKey, onChange}: TabsProps) {
  const [active, setActive] = useState(defaultKey ?? items[0]?.key);

  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => {
            setActive(item.key);
            onChange?.(item.key);
          }}
          className={clsx(
            'h-11 rounded-full border px-5 text-sm font-semibold transition',
            active === item.key
              ? 'border-transparent bg-btn-primary text-white'
              : 'border-border text-text hover:bg-bg-tertiary'
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
