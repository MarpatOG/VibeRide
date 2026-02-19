import BlockRenderer from '@/components/blocks/BlockRenderer';
import {TrainersProvider} from '@/components/blocks/trainers/trainers-context';
import {getContentPage} from '@/lib/content/pages';
import {Locale} from '@/lib/locale';

export default async function TrainersPage({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;
  const content = getContentPage('trainers', locale);

  return (
    <TrainersProvider>
      <BlockRenderer blocks={content.blocks} locale={locale} />
    </TrainersProvider>
  );
}
