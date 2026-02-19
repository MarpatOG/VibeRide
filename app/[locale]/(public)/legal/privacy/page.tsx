import {Locale} from '@/lib/locale';

export default async function PrivacyPage({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;
  const isRu = locale === 'ru';
  return (
    <section className="container-narrow">
      <h1>{isRu ? 'Политика конфиденциальности' : 'Privacy Policy'}</h1>
      <p className="text-muted">
        {isRu
          ? 'Это краткая страница с юридической информацией. Полный текст будет добавлен позже.'
          : 'This is a short legal placeholder. Full policy will be added later.'}
      </p>
    </section>
  );
}
