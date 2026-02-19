import ProfileLayoutShell from '@/components/profile/ProfileLayoutShell';
import {defaultLocale, isLocale} from '@/lib/locale';

export default async function ProfileLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const resolved = await params;
  const locale = isLocale(resolved.locale) ? resolved.locale : defaultLocale;
  return <ProfileLayoutShell locale={locale}>{children}</ProfileLayoutShell>;
}
