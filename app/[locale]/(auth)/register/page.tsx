'use client';

import {FormEvent, useState} from 'react';
import {useRouter} from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {useLocale} from '@/lib/locale-client';
import {Locale} from '@/lib/locale';
import {setMockSession} from '@/lib/mock-auth';

export default function RegisterPage() {
  const locale = useLocale() as Locale;
  const isRu = locale === 'ru';
  const router = useRouter();
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          email,
          name: name.trim() || 'Demo',
          lastName: lastName.trim(),
          role: 'client',
          locale
        })
      });
    } catch (error) {
      console.error('Unable to create user in DB API.', error);
    }
    setMockSession({
      email,
      role: 'client',
      name: name.trim() || 'Demo',
      lastName: lastName.trim()
    });
    router.push('/profile');
    router.refresh();
  };

  return (
    <section className="container-narrow">
      <div className="surface p-8">
        <h1>{isRu ? 'Регистрация' : 'Create account'}</h1>
        <p className="mt-2 text-sm text-text-muted">
          {isRu ? 'Регистрация доступна только для клиентов.' : 'Registration is available for client accounts only.'}
        </p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={isRu ? 'Имя' : 'Name'} required />
          <Input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder={isRu ? 'Фамилия' : 'Last name'}
            required
          />
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isRu ? 'Пароль' : 'Password'}
            required
          />
          <Button className="w-full" type="submit">
            {isRu ? 'Создать' : 'Create'}
          </Button>
        </form>
      </div>
    </section>
  );
}
