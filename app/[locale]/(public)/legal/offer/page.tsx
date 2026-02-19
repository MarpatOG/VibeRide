import {Locale} from '@/lib/locale';

export default async function OfferPage({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;
  const isRu = locale === 'ru';
  return (
    <section className="container-narrow">
      <h1>{isRu ? 'Публичная оферта' : 'Public Offer'}</h1>
      <p className="text-muted">
        {isRu
          ? 'Здесь будет размещён полный текст оферты и условий оплаты.'
          : 'Full offer and payment terms will be published here.'}
      </p>
    </section>
  );
}
