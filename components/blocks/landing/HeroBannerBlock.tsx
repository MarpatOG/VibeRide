import {Link} from '@/lib/navigation';
import Button from '@/components/ui/Button';
import {Locale} from '@/lib/locale';

export default function HeroBannerBlock({
  heading,
  subheading,
  ctaPrimary,
  ctaSecondary,
  heroImageDesktopUrl,
  heroImageMobileUrl,
  locale
}: {
  heading: string;
  subheading: string;
  ctaPrimary: {label: string; href: string};
  ctaSecondary?: {label: string; href: string};
  heroImageDesktopUrl: string;
  heroImageMobileUrl: string;
  focalPoint?: 'left' | 'center' | 'right';
  locale?: Locale;
}) {
  return (
    <section className="relative overflow-hidden py-0">
      <div className="relative aspect-square w-full md:aspect-auto md:h-[72vh] md:min-h-[620px] xl:h-[76vh] xl:min-h-[700px]">
        <picture>
          <source media="(max-width: 768px)" srcSet={heroImageMobileUrl} />
          <img
            src={heroImageDesktopUrl}
            alt="VibeRide"
            className="h-full w-full object-cover"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />
        <div className="absolute inset-0 pb-8 pt-24 sm:pt-28 md:pt-[24vh] md:pb-0">
          <div className="h-full w-full text-white">
            <div className="h-full px-6 sm:px-8 md:px-0">
              <div className="mx-0 flex h-full max-w-3xl flex-col justify-between text-left md:ml-[calc(54vw-200px)] md:h-auto md:max-w-[520px] md:justify-start lg:ml-[calc(56vw-200px)] xl:ml-[calc(58vw-200px)]">
                <div>
                  <h1 className="text-[32px] leading-[1.06] text-white md:text-[clamp(36px,4vw,56px)]">{heading}</h1>
                  <p className="mt-3 max-w-[26ch] text-[15px] leading-[1.35] text-white/80 md:mt-4 md:max-w-2xl md:text-base md:leading-[1.6]">
                    {subheading}
                  </p>
                </div>
                <div className="flex flex-wrap justify-start gap-3 md:mt-6">
                  <Link href={ctaPrimary.href} locale={locale}>
                    <Button>{ctaPrimary.label}</Button>
                  </Link>
                  {ctaSecondary && (
                    <Link href={ctaSecondary.href} locale={locale}>
                      <Button variant="secondary" className="border-white/40 text-white hover:bg-white/10">
                        {ctaSecondary.label}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


