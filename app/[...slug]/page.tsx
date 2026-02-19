import {notFound, redirect} from 'next/navigation';
import {isLocale} from '@/lib/locale';

export default async function LegacyRedirect({params}: {params: Promise<{slug: string[]}>}) {
  const {slug} = await params;
  const segments = slug ?? [];
  const [first] = segments;
  if (first && isLocale(first)) {
    const cleanPath = segments.slice(1).join('/');
    redirect(cleanPath ? `/${cleanPath}` : '/');
  }
  notFound();
}
