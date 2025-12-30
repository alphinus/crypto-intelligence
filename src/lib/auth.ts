/**
 * NextAuth.js Configuration
 *
 * SETUP REQUIRED:
 * 1. Run: npm install next-auth@beta
 * 2. Add environment variables to .env.local:
 *    - NEXTAUTH_URL=http://localhost:3000
 *    - NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
 *    - GOOGLE_CLIENT_ID=<from Google Cloud Console>
 *    - GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
 *    - TWITTER_CLIENT_ID=<from Twitter Developer Portal>
 *    - TWITTER_CLIENT_SECRET=<from Twitter Developer Portal>
 */

import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Twitter from 'next-auth/providers/twitter';

// Check if auth is configured
const hasGoogleAuth = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
const hasTwitterAuth = process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET;

// Build providers array based on available credentials
const providers = [];

if (hasGoogleAuth) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  );
}

if (hasTwitterAuth) {
  providers.push(
    Twitter({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
    })
  );
}

// Export whether auth is configured
export const isAuthConfigured = providers.length > 0 && !!process.env.NEXTAUTH_SECRET;

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers,
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          provider: account.provider,
        };
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        provider: token.provider as string,
      };
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
});
