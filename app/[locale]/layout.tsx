import {notFound} from 'next/navigation';
import {defaultLocale, isLocale} from '@/lib/locale';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import {ToastProvider, ToastViewport} from '@/components/ui/Toast';
import {SessionPoolProvider} from '@/components/providers/SessionPoolProvider';
import {TrainerPoolProvider} from '@/components/providers/TrainerPoolProvider';
import {ClientBookingsProvider} from '@/components/providers/ClientBookingsProvider';

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const resolvedParams = await params;
  const locale = isLocale(resolvedParams.locale) ? resolvedParams.locale : defaultLocale;
  if (!isLocale(resolvedParams.locale)) {
    notFound();
  }

  return (
    <ToastProvider>
      <SessionPoolProvider>
        <ClientBookingsProvider>
          <TrainerPoolProvider>
            <div className="min-h-screen bg-bg text-text">
              <Header />
              <main className="pb-24">{children}</main>
              <Footer locale={locale} />
              <ToastViewport />
            </div>
          </TrainerPoolProvider>
        </ClientBookingsProvider>
      </SessionPoolProvider>
    </ToastProvider>
  );
}
