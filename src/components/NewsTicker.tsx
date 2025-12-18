'use client';

import { useRef, useState } from 'react';
import { ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface NewsHeadline {
  id: string;
  title: string;
  source: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  url: string;
  publishedAt: string;
}

interface NewsTickerProps {
  headlines: NewsHeadline[];
}

export function NewsTicker({ headlines }: NewsTickerProps) {
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  if (headlines.length === 0) {
    return null;
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return <TrendingUp className="w-3 h-3 text-green-400" />;
      case 'bearish':
        return <TrendingDown className="w-3 h-3 text-red-400" />;
      default:
        return <Minus className="w-3 h-3 text-gray-400" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return 'border-green-500/50';
      case 'bearish':
        return 'border-red-500/50';
      default:
        return 'border-gray-500/50';
    }
  };

  // Dupliziere Headlines für nahtlosen Loop
  const duplicatedHeadlines = [...headlines, ...headlines];

  return (
    <div className="relative bg-gray-900/80 border-b border-gray-800 overflow-hidden">
      <div className="flex items-center">
        {/* Label */}
        <div className="flex-shrink-0 px-4 py-2 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider z-10">
          News
        </div>

        {/* Ticker Container */}
        <div
          ref={containerRef}
          className="flex-1 overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            className={`flex gap-8 py-2 ticker-scroll ${isPaused ? 'paused' : ''}`}
            style={{
              animation: `ticker ${headlines.length * 8}s linear infinite`,
            }}
          >
            {duplicatedHeadlines.map((headline, index) => (
              <a
                key={`${headline.id}-${index}`}
                href={headline.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getSentimentColor(
                  headline.sentiment
                )} bg-gray-800/50 hover:bg-gray-700/50 transition-colors whitespace-nowrap group`}
              >
                {getSentimentIcon(headline.sentiment)}
                <span className="text-sm text-gray-200 max-w-[300px] truncate">
                  {headline.title}
                </span>
                <span className="text-xs text-gray-500">{headline.source}</span>
                <ExternalLink className="w-3 h-3 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .ticker-scroll {
          will-change: transform;
        }
        .ticker-scroll.paused {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
