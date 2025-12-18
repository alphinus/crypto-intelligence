import { NextResponse } from 'next/server';
import { fetchTelegramSentiment } from '@/lib/telegram-sentiment';

export async function GET() {
  try {
    const data = await fetchTelegramSentiment();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Telegram API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Telegram data' },
      { status: 500 }
    );
  }
}
