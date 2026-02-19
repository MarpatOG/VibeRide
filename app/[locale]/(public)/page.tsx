import BlockRenderer from '@/components/blocks/BlockRenderer';
import {getContentPage} from '@/lib/content/pages';
import {Locale} from '@/lib/locale';

export default async function LandingPage({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;
  const content = getContentPage('landing', locale);
  return <BlockRenderer blocks={content.blocks} locale={locale} />;
}
