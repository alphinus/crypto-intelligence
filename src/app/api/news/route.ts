import { NextResponse } from 'next/server';
import { fetchAllFeeds } from '@/lib/rss-parser';

export const revalidate = 300; // Cache für 5 Minuten

export async function GET() {
  try {
    const articles = await fetchAllFeeds();

    return NextResponse.json({
      success: true,
      count: articles.length,
      articles,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}
