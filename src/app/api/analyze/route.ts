import { NextRequest, NextResponse } from 'next/server';
import { analyzeArticle, analyzeMultipleArticles } from '@/lib/groq';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Einzelner Artikel
    if (body.title && body.content) {
      const analysis = await analyzeArticle(body.title, body.content);
      return NextResponse.json({ success: true, analysis });
    }

    // Mehrere Artikel (Bulk)
    if (body.articles && Array.isArray(body.articles)) {
      const overview = await analyzeMultipleArticles(body.articles);
      return NextResponse.json({ success: true, overview });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Analysis failed' },
      { status: 500 }
    );
  }
}
