'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  MessageCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { SubredditData, RedditPost } from '@/lib/reddit';

interface RedditSentimentProps {
  subreddits: SubredditData[];
  overall: {
    sentiment: 'bullish' | 'bearish' | 'neutral';
    sentimentScore: number;
    trendingTopics: string[];
    totalPosts: number;
  };
}

function SentimentIcon({ sentiment }: { sentiment: string }) {
  switch (sentiment) {
    case 'bullish':
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    case 'bearish':
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    default:
      return <Minus className="w-4 h-4 text-yellow-500" />;
  }
}

function SentimentBar({ score }: { score: number }) {
  // Score von -100 bis +100, normalisieren auf 0-100 für die Bar
  const normalizedScore = (score + 100) / 2;
  const isPositive = score >= 0;

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${isPositive ? 'bg-green-500' : 'bg-red-500'
            }`}
          style={{ width: `${normalizedScore}%` }}
        />
      </div>
      <span
        className={`text-xs font-medium min-w-[40px] text-right ${isPositive ? 'text-green-400' : 'text-red-400'
          }`}
      >
        {score > 0 ? '+' : ''}
        {score}
      </span>
    </div>
  );
}

function PostCard({ post }: { post: RedditPost }) {
  return (
    <a
      href={post.permalink}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 text-xs text-gray-400">
          <ArrowUpCircle className="w-4 h-4 text-orange-500" />
          <span>{post.score}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-1">
            {post.title}
          </h4>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>r/{post.subreddit}</span>
            <span>•</span>
            <span>
              {formatDistanceToNow(new Date(post.created * 1000), {
                addSuffix: true,
                locale: de,
              })}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              {post.numComments}
            </span>
          </div>
        </div>
        <ExternalLink className="w-4 h-4 text-gray-600 flex-shrink-0" />
      </div>
    </a>
  );
}

function SubredditCard({ subreddit }: { subreddit: SubredditData }) {
  const [expanded, setExpanded] = useState(false);

  return (
  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <SentimentIcon sentiment={subreddit.sentiment || 'neutral'} />
          <span className="font-medium text-gray-900 dark:text-white">{subreddit.displayName}</span>
          <span className="text-xs text-gray-500">
            ({subreddit.posts.length} Posts)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-24 hidden sm:block">
            <SentimentBar score={subreddit.sentimentScore || 0} />
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="p-3 pt-0 space-y-2">
          {subreddit.trendingTopics && subreddit.trendingTopics.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {subreddit.trendingTopics.map((topic, i) => (
                <span
                  key={i}
                  className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}
          <div className="space-y-2">
            {subreddit.posts.slice(0, 5).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function RedditSentiment({ subreddits, overall }: RedditSentimentProps) {
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'bearish':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      default:
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    }
  };

  return (
    <div className="space-y-4">
      {/* Overall Sentiment */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Reddit Sentiment</h3>
          </div>
          <span
            className={`px-2 py-1 rounded border text-xs font-medium ${getSentimentColor(
              overall.sentiment
            )}`}
          >
            {overall.sentiment.toUpperCase()}
          </span>
        </div>

        <SentimentBar score={overall.sentimentScore} />

        <div className="mt-3 text-xs text-gray-500">
          Basierend auf {overall.totalPosts} Posts aus {subreddits.length} Subreddits
        </div>

        {overall.trendingTopics.length > 0 && (
          <div className="mt-3">
            <div className="text-xs text-gray-500 mb-2">Trending auf Reddit:</div>
            <div className="flex flex-wrap gap-1">
              {overall.trendingTopics.map((topic, i) => (
                <span
                  key={i}
                  className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Subreddit Cards */}
      <div className="space-y-2">
        {subreddits.map((subreddit) => (
          <SubredditCard key={subreddit.name} subreddit={subreddit} />
        ))}
      </div>
    </div>
  );
}
