import NextAuth, {DefaultSession} from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string;
      role: 'client' | 'trainer' | 'admin';
      lastName?: string;
    };
  }

  interface User {
    id: string;
    role: 'client' | 'trainer' | 'admin';
    lastName?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: 'client' | 'trainer' | 'admin';
    lastName?: string;
  }
}
