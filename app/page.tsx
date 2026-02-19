import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import BlockRenderer from '@/components/blocks/BlockRenderer';
import {ToastProvider, ToastViewport} from '@/components/ui/Toast';
import {SessionPoolProvider} from '@/components/providers/SessionPoolProvider';
import {TrainerPoolProvider} from '@/components/providers/TrainerPoolProvider';
import {ClientBookingsProvider} from '@/components/providers/ClientBookingsProvider';
import {getContentPage} from '@/lib/content/pages';
import {defaultLocale} from '@/lib/locale';

export default function HomePage() {
  const content = getContentPage('landing', defaultLocale);

  return (
    <ToastProvider>
      <SessionPoolProvider>
        <ClientBookingsProvider>
          <TrainerPoolProvider>
            <div className="min-h-screen bg-bg text-text">
              <Header />
              <main className="pb-24">
                <BlockRenderer blocks={content.blocks} locale={defaultLocale} />
              </main>
              <Footer locale={defaultLocale} />
              <ToastViewport />
            </div>
          </TrainerPoolProvider>
        </ClientBookingsProvider>
      </SessionPoolProvider>
    </ToastProvider>
  );
}
