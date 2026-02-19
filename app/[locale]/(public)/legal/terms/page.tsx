import {Locale} from '@/lib/locale';

export default async function TermsPage({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;
  const isRu = locale === 'ru';
  return (
    <section className="container-narrow">
      <h1>{isRu ? 'Пользовательское соглашение' : 'Terms of Service'}</h1>
      <p className="text-muted">
        {isRu
          ? 'Краткое описание условий использования. Полный текст появится в ближайшее время.'
          : 'Short terms overview. Full terms will be provided soon.'}
      </p>
    </section>
  );
}
