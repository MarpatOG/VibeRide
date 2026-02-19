import BlockRenderer from '@/components/blocks/BlockRenderer';
import {getContentPage} from '@/lib/content/pages';
import {Locale} from '@/lib/locale';

export default async function PricingPage({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;
  const content = getContentPage('pricing', locale);
  return <BlockRenderer blocks={content.blocks} locale={locale} />;
}
