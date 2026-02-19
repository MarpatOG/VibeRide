import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {Locale} from '@/lib/locale';

export default function ContactsBlock({
  title,
  address,
  phone,
  email,
  hours,
  socials,
  mapEmbedUrl,
  showContactForm,
  locale
}: {
  title: string;
  address: string;
  phone: string;
  email?: string;
  hours?: string;
  socials?: Array<{type: 'instagram' | 'telegram' | 'vk' | 'youtube' | 'tiktok'; url: string}>;
  mapEmbedUrl?: string;
  showContactForm: boolean;
  locale: Locale;
}) {
  return (
    <section className="container-wide">
      <h2>{title}</h2>
      <div className="mt-6 grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="surface p-6">
            <div className="text-sm text-text-muted">{locale === 'ru' ? 'Адрес' : 'Address'}</div>
            <div className="text-base font-semibold">{address}</div>
            <div className="mt-4 text-sm text-text-muted">{locale === 'ru' ? 'Телефон' : 'Phone'}</div>
            <div className="text-base font-semibold">{phone}</div>
            {email && (
              <>
                <div className="mt-4 text-sm text-text-muted">Email</div>
                <div className="text-base font-semibold">{email}</div>
              </>
            )}
            {hours && (
              <>
                <div className="mt-4 text-sm text-text-muted">{locale === 'ru' ? 'Часы' : 'Hours'}</div>
                <div className="text-base font-semibold">{hours}</div>
              </>
            )}
            {socials && (
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                {socials.map((social) => (
                  <a key={social.type} href={social.url} className="underline">
                    {social.type}
                  </a>
                ))}
              </div>
            )}
          </div>
          {mapEmbedUrl && (
            <div className="surface overflow-hidden">
              <iframe
                title="map"
                src={mapEmbedUrl}
                className="h-64 w-full border-0"
                loading="lazy"
              />
            </div>
          )}
        </div>
        {showContactForm && (
          <div className="surface p-6">
            <h4 className="text-lg font-semibold">{locale === 'ru' ? 'Связаться' : 'Get in touch'}</h4>
            <div className="mt-4 space-y-3">
              <Input placeholder={locale === 'ru' ? 'Имя' : 'Name'} />
              <Input placeholder="Email" type="email" />
              <Input placeholder={locale === 'ru' ? 'Сообщение' : 'Message'} />
              <Button className="w-full">{locale === 'ru' ? 'Отправить' : 'Send'}</Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

