import {NextAuthOptions} from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import {db} from '@/lib/db';
import {verifyPassword} from '@/lib/server/password';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt'
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: {label: 'Email', type: 'email'},
        password: {label: 'Password', type: 'password'}
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? '')
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? '');

        if (!email || !password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: {email},
          select: {
            id: true,
            email: true,
            name: true,
            lastName: true,
            role: true,
            passwordHash: true
          }
        });

        if (!user || !verifyPassword(password, user.passwordHash)) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          lastName: user.lastName ?? undefined,
          role: user.role
        };
      }
    })
  ],
  callbacks: {
    async jwt({token, user}) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.lastName = user.lastName;
      }
      return token;
    },
    async session({session, token}) {
      if (session.user) {
        session.user.id = typeof token.id === 'string' ? token.id : '';
        session.user.role = token.role === 'admin' || token.role === 'trainer' ? token.role : 'client';
        session.user.lastName = typeof token.lastName === 'string' ? token.lastName : undefined;
      }
      return session;
    }
  }
};
