'use client';

import Input from '@/components/ui/Input';
import {Locale} from '@/lib/locale';

export default function FaqSearchBlock({
  placeholder
}: {
  placeholder: string;
  locale?: Locale;
}) {
  return (
    <section className="container-wide">
      <Input placeholder={placeholder} />
    </section>
  );
}

