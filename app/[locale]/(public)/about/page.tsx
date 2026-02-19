import BlockRenderer from '@/components/blocks/BlockRenderer';
import {getContentPage} from '@/lib/content/pages';
import {Locale} from '@/lib/locale';

export default async function AboutPage({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;
  const content = getContentPage('about', locale);
  return <BlockRenderer blocks={content.blocks} locale={locale} />;
}
