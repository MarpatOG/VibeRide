'use client';

import {FormEvent, useState} from 'react';
import {useRouter} from 'next/navigation';
import {getSession, signIn} from 'next-auth/react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {Link} from '@/lib/navigation';
import {useLocale} from '@/lib/locale-client';
import {Locale} from '@/lib/locale';

export default function LoginPage() {
  const locale = useLocale() as Locale;
  const isRu = locale === 'ru';
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorText, setErrorText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorText('');
    setIsSubmitting(true);
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      });
      if (!result || result.error) {
        setErrorText(isRu ? 'Неверный email или пароль.' : 'Invalid email or password.');
        return;
      }

      const session = await getSession();
      const role = session?.user?.role ?? 'client';
      const target = role === 'admin' ? '/admin' : role === 'trainer' ? '/trainer' : '/profile';
      router.push(target);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="container-narrow">
      <div className="surface p-8">
        <h1>{isRu ? 'Вход' : 'Sign in'}</h1>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" required />
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={isRu ? 'Пароль' : 'Password'}
            required
          />
          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (isRu ? 'Вход...' : 'Signing in...') : isRu ? 'Войти' : 'Sign in'}
          </Button>
          {errorText ? (
            <div className="rounded-md border border-state-danger/50 bg-state-danger/10 px-3 py-2 text-sm text-state-danger">
              {errorText}
            </div>
          ) : null}
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
