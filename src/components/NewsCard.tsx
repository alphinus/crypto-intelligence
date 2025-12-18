'use client';

import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { NewsArticle } from '@/types/news';

interface NewsCardProps {
  article: NewsArticle;
  onAnalyze?: (article: NewsArticle) => void;
}

export function NewsCard({ article, onAnalyze }: NewsCardProps) {
  const getSentimentIcon = () => {
    switch (article.sentiment) {
      case 'bullish':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'bearish':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSentimentBg = () => {
    switch (article.sentiment) {
      case 'bullish':
        return 'bg-green-500/10 border-green-500/20';
      case 'bearish':
        return 'bg-red-500/10 border-red-500/20';
      default:
        return 'bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
              {article.source}
            </span>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(article.pubDate), {
                addSuffix: true,
                locale: de,
              })}
            </span>
            {article.sentiment && (
              <span
                className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded border ${getSentimentBg()}`}
              >
                {getSentimentIcon()}
                {article.sentiment}
              </span>
            )}
          </div>

          <h3 className="font-semibold text-white mb-2 line-clamp-2">
            {article.title}
          </h3>

          {article.summary ? (
            <p className="text-sm text-gray-400 mb-3 line-clamp-2">
              {article.summary}
            </p>
          ) : (
            <p className="text-sm text-gray-400 mb-3 line-clamp-2">
              {article.description}
            </p>
          )}

          {article.entities && article.entities.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {article.entities.slice(0, 5).map((entity, i) => (
                <span
                  key={i}
                  className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded"
                >
                  {entity}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              Artikel lesen
              <ExternalLink className="w-3 h-3" />
            </a>
            {onAnalyze && !article.sentiment && (
              <button
                onClick={() => onAnalyze(article)}
                className="text-sm text-gray-400 hover:text-white"
              >
                Analysieren
              </button>
            )}
          </div>
        </div>

        {article.imageUrl && (
          <img
            src={article.imageUrl}
            alt=""
            className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
      </div>
    </div>
  );
}
