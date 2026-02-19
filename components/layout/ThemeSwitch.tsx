'use client';

import {useEffect, useState} from 'react';
import clsx from 'clsx';

const themes = ['light', 'dark'] as const;

type Theme = (typeof themes)[number];

export default function ThemeSwitch({className}: {className?: string}) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const stored = window.localStorage.getItem('viberide-theme') as Theme | null;
    const initial = stored && themes.includes(stored) ? stored : 'light';
    setTheme(initial);
    document.documentElement.setAttribute('data-theme', initial);
  }, []);

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    window.localStorage.setItem('viberide-theme', next);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={clsx('rounded-full p-2 text-text hover:bg-bg-tertiary', className)}
      aria-label="Toggle theme"
    >
      {theme === 'light' ? '🌞' : '🌙'}
    </button>
  );
}

