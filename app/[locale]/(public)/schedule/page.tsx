import BlockRenderer from '@/components/blocks/BlockRenderer';
import {ScheduleProvider} from '@/components/blocks/schedule/schedule-context';
import {getContentPage} from '@/lib/content/pages';
import {Locale} from '@/lib/locale';

export default async function SchedulePage({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;
  const content = getContentPage('schedule', locale);

  return (
    <ScheduleProvider>
      <BlockRenderer blocks={content.blocks} locale={locale} />
    </ScheduleProvider>
  );
}
