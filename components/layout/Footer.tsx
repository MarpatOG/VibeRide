import {getContentPage} from '@/lib/content/pages';
import {Locale} from '@/lib/locale';
import BlockRenderer from '@/components/blocks/BlockRenderer';

export default function Footer({locale}: {locale: Locale}) {
  const content = getContentPage('footer', locale);

  return (
    <footer className="bg-black text-white">
      <BlockRenderer blocks={content.blocks} locale={locale} />
    </footer>
  );
}

