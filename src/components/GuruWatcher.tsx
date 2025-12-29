'use client';

import { useState, useEffect } from 'react';
import { Users, TrendingUp, TrendingDown, Minus, RefreshCw, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

interface InfluencerSentiment {
  handle: string;
  name: string;
  tier: string;
  recentSentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number;
  lastPost: string | null;
  postCount: number;
}

interface GuruConsensus {
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  consensus: 'bullish' | 'bearish' | 'mixed' | 'neutral';
  percentage: number;
}

interface TwitterData {
  success: boolean;
  influencers: InfluencerSentiment[];
  overall: {
    sentiment: 'bullish' | 'bearish' | 'neutral';
    sentimentScore: number;
    totalPosts: number;
  };
  trendingTopics: string[];
  consensus: GuruConsensus;
}

export function GuruWatcher() {
  const [data, setData] = useState<TwitterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/twitter');
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setError('Fehler beim Laden');
      }
    } catch (err) {
      setError('Netzwerkfehler');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'bearish':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/20';
      case 'bearish':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/20';
      default:
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-500/20';
    }
  };

  const getConsensusColor = (consensus: string) => {
    switch (consensus) {
      case 'bullish':
        return 'text-green-600 dark:text-green-400';
      case 'bearish':
        return 'text-red-600 dark:text-red-400';
      case 'mixed':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const getTierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      analyst: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
      trader: 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400',
      media: 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400',
    };
    return colors[tier] || 'bg-gray-100 dark:bg-gray-500/20 text-gray-500 dark:text-gray-400';
  };

  if (loading && !data) {
    return (
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-2 text-gray-400">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm">Lade Guru Sentiment...</span>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-red-500 dark:text-red-400 text-sm">{error}</span>
          <button onClick={fetchData} className="text-blue-500 dark:text-blue-400 text-sm hover:underline">
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden mt-6 shadow-sm dark:shadow-none">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <span className="font-medium text-gray-900 dark:text-white">Guru Watcher</span>

          {data && (
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSentimentColor(data.consensus.consensus)}`}>
              {data.consensus.consensus.toUpperCase()}
            </span>
          )}

          {data && (
            <span className="text-xs text-gray-500">
              {data.consensus.bullishCount} Bullish / {data.consensus.bearishCount} Bearish
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {loading && <RefreshCw className="w-4 h-4 text-gray-500 animate-spin" />}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && data && (
        <div className="px-4 pb-4">
          {/* Consensus Bar */}
          <div className="mb-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Guru Consensus</span>
              <span className={`text-sm font-bold ${getConsensusColor(data.consensus.consensus)}`}>
                {data.consensus.percentage.toFixed(0)}% Bullish
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-green-500"
                style={{ width: `${data.consensus.percentage}%` }}
              />
              <div
                className="h-full bg-red-500"
                style={{
                  width: `${(data.consensus.bearishCount / (data.consensus.bullishCount + data.consensus.bearishCount + data.consensus.neutralCount)) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Trending Topics */}
          {data.trendingTopics.length > 0 && (
            <div className="mb-4">
              <span className="text-xs text-gray-500 block mb-2">Trending bei Gurus:</span>
              <div className="flex flex-wrap gap-1">
                {data.trendingTopics.slice(0, 8).map((topic) => (
                  <span
                    key={topic}
                    className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-300"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Influencer Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.influencers.map((influencer) => (
              <div
                key={influencer.handle}
                className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  {getSentimentIcon(influencer.recentSentiment)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {influencer.name}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${getTierBadge(influencer.tier)}`}>
                        {influencer.tier}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500">@{influencer.handle}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${influencer.sentimentScore > 0 ? 'text-green-600 dark:text-green-400' :
                      influencer.sentimentScore < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'
                    }`}>
                    {influencer.sentimentScore > 0 ? '+' : ''}{influencer.sentimentScore}
                  </span>
                  <a
                    href={`https://twitter.com/${influencer.handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-gray-400"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Last Update */}
          <div className="mt-3 text-[10px] text-gray-600 text-right">
            {data.overall.totalPosts} Posts analysiert
          </div>
        </div>
      )}
    </div>
  );
}
