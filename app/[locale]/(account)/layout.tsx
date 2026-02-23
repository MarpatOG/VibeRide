import {redirect} from 'next/navigation';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth-options';

export default async function AccountLayout({children}: {children: React.ReactNode}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }

  return children;
}
