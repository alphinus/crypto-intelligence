import { NextResponse } from 'next/server';

export async function GET() {
  // Check which environment variables are configured
  // We only return boolean status, never the actual values
  const status: Record<string, boolean> = {
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    TWITTER_CLIENT_ID: !!process.env.TWITTER_CLIENT_ID,
    TWITTER_CLIENT_SECRET: !!process.env.TWITTER_CLIENT_SECRET,
    GROQ_API_KEY: !!process.env.GROQ_API_KEY,
    COINGECKO_API_KEY: !!process.env.COINGECKO_API_KEY,
  };

  return NextResponse.json({
    success: true,
    status,
  });
}
