import Card from '@/components/ui/Card';
import {Locale} from '@/lib/locale';

export default function HowItWorksStepsBlock({
  title,
  steps
}: {
  title: string;
  steps: Array<{title: string; body: string; icon?: string}>;
  locale?: Locale;
}) {
  return (
    <section className="container-wide">
      <h2>{title}</h2>
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {steps.map((step, index) => (
          <Card key={step.title} className="glow-card">
            <div className="mb-3 text-xs font-semibold text-text-muted">
              0{index + 1}
            </div>
            <h4 className="text-lg font-semibold">{step.title}</h4>
            <p className="mt-2 text-sm text-text-muted">{step.body}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

