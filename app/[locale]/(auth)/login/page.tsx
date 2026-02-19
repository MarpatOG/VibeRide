'use client';

import {FormEvent, useState} from 'react';
import {useRouter} from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {Link} from '@/lib/navigation';
import {useLocale} from '@/lib/locale-client';
import {Locale} from '@/lib/locale';
import {roleFromEmail, setMockSession} from '@/lib/mock-auth';

export default function LoginPage() {
  const locale = useLocale() as Locale;
  const isRu = locale === 'ru';
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    let role = roleFromEmail(email);
    let name = role === 'admin' ? 'Demo Admin' : role === 'trainer' ? 'Demo Trainer' : 'Demo Client';
    try {
      const response = await fetch(`/api/users?email=${encodeURIComponent(email)}`, {cache: 'no-store'});
      if (response.ok) {
        const user = (await response.json()) as {role: 'admin' | 'trainer' | 'client'; name: string; lastName?: string};
        role = user.role;
        name = user.lastName ? `${user.name} ${user.lastName}` : user.name;
      }
    } catch (error) {
      console.error('Unable to resolve user from DB API.', error);
    }
    setMockSession({
      email,
      role,
      name
    });
    const target = role === 'admin' ? '/admin' : role === 'trainer' ? '/trainer' : '/profile';
    router.push(target);
    router.refresh();
  };

  return (
    <section className="container-narrow">
      <div className="surface p-8">
        <h1>{isRu ? 'Вход' : 'Sign in'}</h1>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isRu ? 'Пароль' : 'Password'}
            required
          />
          <Button className="w-full" type="submit">
            {isRu ? 'Войти' : 'Sign in'}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm text-text-muted">
          {isRu ? 'Нет аккаунта?' : "Don't have an account?"}{' '}
          <Link href="/register" locale={locale} className="font-semibold text-[var(--accent)]">
            {isRu ? 'Зарегистрироваться' : 'Create one'}
          </Link>
        </div>
      </div>
    </section>
  );
}
