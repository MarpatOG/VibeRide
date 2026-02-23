'use client';

import {FormEvent, useState} from 'react';
import {useRouter} from 'next/navigation';
import {signIn} from 'next-auth/react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {useLocale} from '@/lib/locale-client';
import {Locale} from '@/lib/locale';

export default function RegisterPage() {
  const locale = useLocale() as Locale;
  const isRu = locale === 'ru';
  const router = useRouter();
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorText, setErrorText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorText('');
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          email,
          name: name.trim() || 'Demo',
          lastName: lastName.trim(),
          password,
          role: 'client',
          locale
        })
      });

      const payload = (await response.json().catch(() => null)) as
        | {ok?: boolean; reason?: string}
        | null;

      if (!response.ok) {
        if (payload?.reason === 'weak-password') {
          setErrorText(isRu ? 'Пароль должен быть не короче 6 символов.' : 'Password must be at least 6 characters.');
        } else if (payload?.reason === 'email-exists') {
          setErrorText(isRu ? 'Пользователь с таким email уже существует.' : 'A user with this email already exists.');
        } else {
          setErrorText(isRu ? 'Не удалось создать аккаунт.' : 'Unable to create account.');
        }
        return;
      }

      const signInResult = await signIn('credentials', {
        email,
        password,
        redirect: false
      });
      if (!signInResult || signInResult.error) {
        setErrorText(
          isRu
            ? 'Аккаунт создан, но вход не выполнен. Войдите вручную.'
            : 'Account created, but sign in failed.'
        );
        return;
      }

      router.push('/profile');
      router.refresh();
    } catch (error) {
      console.error('Unable to create user account.', error);
      setErrorText(isRu ? 'Не удалось создать аккаунт.' : 'Unable to create account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="container-narrow">
      <div className="surface p-8">
        <h1>{isRu ? 'Регистрация' : 'Create account'}</h1>
        <p className="mt-2 text-sm text-text-muted">
          {isRu ? 'Регистрация доступна только для клиентских аккаунтов.' : 'Registration is available for client accounts only.'}
        </p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder={isRu ? 'Имя' : 'Name'} required />
          <Input
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            placeholder={isRu ? 'Фамилия' : 'Last name'}
            required
          />
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" required />
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={isRu ? 'Пароль' : 'Password'}
            required
          />
          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (isRu ? 'Создание...' : 'Creating...') : isRu ? 'Создать' : 'Create'}
          </Button>
          {errorText ? (
            <div className="rounded-md border border-state-danger/50 bg-state-danger/10 px-3 py-2 text-sm text-state-danger">
              {errorText}
            </div>
          ) : null}
        </form>
      </div>
    </section>
  );
}
