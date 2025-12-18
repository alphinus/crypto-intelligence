'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, TrendingUp, TrendingDown, Minus, RefreshCw, ExternalLink, ChevronDown, ChevronUp, Anchor } from 'lucide-react';

interface ChannelSentiment {
  handle: string;
  name: string;
  tier: string;
  recentSentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number;
  messageCount: number;
  lastMessage: string | null;
}

interface WhaleAlert {
  type: 'buy' | 'sell' | 'transfer';
  amount: string;
  asset: string;
  timestamp: Date;
}

interface TelegramData {
  success: boolean;
  channels: ChannelSentiment[];
  overall: {
    sentiment: 'bullish' | 'bearish' | 'neutral';
    sentimentScore: number;
    totalMessages: number;
  };
  whaleAlerts: WhaleAlert[];
}

export function TelegramSentiment() {
  const [data, setData] = useState<TelegramData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'channels' | 'whales'>('channels');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/telegram');
      const json = await res.json();
      if (json.success) {
        // Parse dates from JSON
        json.whaleAlerts = json.whaleAlerts.map((alert: WhaleAlert & { timestamp: string }) => ({
          ...alert,
          timestamp: new Date(alert.timestamp),
        }));
        setData(json);
      } else {
        setError('Fehler beim Laden');
      }
    } catch {
      setError('Netzwerkfehler');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
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
        return 'text-green-400 bg-green-500/20';
      case 'bearish':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-yellow-400 bg-yellow-500/20';
    }
  };

  const getTierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      news: 'bg-blue-500/20 text-blue-400',
      onchain: 'bg-purple-500/20 text-purple-400',
      defi: 'bg-cyan-500/20 text-cyan-400',
      trading: 'bg-orange-500/20 text-orange-400',
    };
    return colors[tier] || 'bg-gray-500/20 text-gray-400';
  };

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'buy':
        return 'text-green-400 bg-green-500/20';
      case 'sell':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-blue-400 bg-blue-500/20';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'gerade eben';
    if (diffMins < 60) return `vor ${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `vor ${diffHours}h`;
    return `vor ${Math.floor(diffHours / 24)}d`;
  };

  if (loading && !data) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 mt-4">
        <div className="flex items-center gap-2 text-gray-400">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm">Lade Telegram Sentiment...</span>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 mt-4">
        <div className="flex items-center justify-between">
          <span className="text-red-400 text-sm">{error}</span>
          <button onClick={fetchData} className="text-blue-400 text-sm hover:underline">
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden mt-4">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <MessageCircle className="w-5 h-5 text-blue-400" />
          <span className="font-medium text-white">Telegram Sentiment</span>

          {data && (
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSentimentColor(data.overall.sentiment)}`}>
              {data.overall.sentiment.toUpperCase()}
            </span>
          )}

          {data && (
            <span className="text-xs text-gray-500">
              Score: {data.overall.sentimentScore > 0 ? '+' : ''}{data.overall.sentimentScore}
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
          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('channels')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'channels'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Channels ({data.channels.length})
            </button>
            <button
              onClick={() => setActiveTab('whales')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'whales'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              <Anchor className="w-3 h-3" />
              Whale Alerts ({data.whaleAlerts.length})
            </button>
          </div>

          {/* Channels Tab */}
          {activeTab === 'channels' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {data.channels.map((channel) => (
                <div
                  key={channel.handle}
                  className="bg-gray-800/50 rounded-lg p-2 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    {getSentimentIcon(channel.recentSentiment)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">
                          {channel.name}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${getTierBadge(channel.tier)}`}>
                          {channel.tier}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500">
                        {channel.messageCount} Nachrichten
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${
                      channel.sentimentScore > 0 ? 'text-green-400' :
                      channel.sentimentScore < 0 ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {channel.sentimentScore > 0 ? '+' : ''}{channel.sentimentScore}
                    </span>
                    <a
                      href={`https://t.me/${channel.handle}`}
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
          )}

          {/* Whale Alerts Tab */}
          {activeTab === 'whales' && (
            <div className="space-y-2">
              {data.whaleAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  className="bg-gray-800/50 rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-medium uppercase ${getAlertTypeColor(alert.type)}`}>
                      {alert.type}
                    </span>
                    <div>
                      <span className="text-sm font-bold text-white">
                        {alert.amount} {alert.asset}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        {alert.type === 'buy' ? 'gekauft' :
                         alert.type === 'sell' ? 'verkauft' : 'transferiert'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-500">
                    {formatTimeAgo(alert.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="mt-3 pt-3 border-t border-gray-700/50 flex items-center justify-between text-[10px] text-gray-500">
            <span>{data.overall.totalMessages} Nachrichten analysiert</span>
            <span>Aktualisiert alle 5 Min</span>
          </div>
        </div>
      )}
    </div>
  );
}
