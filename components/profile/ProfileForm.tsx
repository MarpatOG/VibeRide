'use client';

import {FormEvent, useState} from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import {Locale} from '@/lib/locale';
import {UserProfile} from '@/lib/types/profile';

type SaveState = 'idle' | 'saving' | 'success' | 'error';

export default function ProfileForm({
  locale,
  initialProfile
}: {
  locale: Locale;
  initialProfile: UserProfile;
}) {
  const [form, setForm] = useState<UserProfile>(initialProfile);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const isRu = locale === 'ru';

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage('');

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setSaveState('error');
      setErrorMessage(isRu ? 'Введите имя и фамилию.' : 'Please enter first and last name.');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setSaveState('error');
      setErrorMessage(isRu ? 'Укажите корректный email.' : 'Please enter a valid email.');
      return;
    }

    setSaveState('saving');
    window.setTimeout(() => {
      if (form.email.toLowerCase().includes('error')) {
        setSaveState('error');
        setErrorMessage(isRu ? 'Не удалось сохранить профиль. Повторите позже.' : 'Unable to save profile now.');
        return;
      }
      setSaveState('success');
    }, 550);
  };

  return (
    <Card>
      <h3>{isRu ? 'Профиль' : 'Profile'}</h3>
      <form className="mt-5 space-y-5" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-text-muted">{isRu ? 'Имя' : 'First name'}</span>
            <Input
              value={form.firstName}
              onChange={(event) => setForm((prev) => ({...prev, firstName: event.target.value}))}
              required
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-text-muted">{isRu ? 'Фамилия' : 'Last name'}</span>
            <Input
              value={form.lastName}
              onChange={(event) => setForm((prev) => ({...prev, lastName: event.target.value}))}
              required
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block text-text-muted">Email</span>
          <Input
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({...prev, email: event.target.value}))}
            required
          />
        </label>

        {saveState === 'error' ? (
          <div className="rounded-md border border-state-danger/50 bg-state-danger/10 px-3 py-2 text-sm text-state-danger">
            {errorMessage}
          </div>
        ) : null}
        {saveState === 'success' ? (
          <div className="rounded-md border border-state-success/50 bg-state-success/10 px-3 py-2 text-sm text-state-success">
            {isRu ? 'Профиль сохранен.' : 'Profile saved.'}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={saveState === 'saving'}>
            {saveState === 'saving' ? (isRu ? 'Сохранение...' : 'Saving...') : isRu ? 'Сохранить' : 'Save'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
