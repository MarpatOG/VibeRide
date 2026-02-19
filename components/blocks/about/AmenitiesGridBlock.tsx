import Card from '@/components/ui/Card';
import {Locale} from '@/lib/locale';

export default function AmenitiesGridBlock({
  title,
  items
}: {
  title: string;
  items: Array<{title: string; body?: string; icon?: string}>;
  locale?: Locale;
}) {
  return (
    <section className="container-wide">
      <h2>{title}</h2>
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {items.map((item) => (
          <Card key={item.title}>
            <h4 className="text-lg font-semibold">{item.title}</h4>
            {item.body && <p className="mt-2 text-sm text-text-muted">{item.body}</p>}
          </Card>
        ))}
      </div>
    </section>
  );
}

