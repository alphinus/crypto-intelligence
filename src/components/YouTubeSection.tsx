'use client';

import { useState, useEffect } from 'react';
import { YouTubePlayer } from './YouTubePlayer';
import { Youtube, ChevronDown, ChevronUp, ExternalLink, RefreshCw } from 'lucide-react';

const DEFAULT_VIDEO_ID = 'yHOvjzS5a8s';
const STORAGE_KEY = 'crypto-youtube-url';

/**
 * Extract video ID from various YouTube URL formats
 */
function extractVideoId(url: string): string | null {
  if (!url) return null;

  // If it's already just a video ID (11 characters, alphanumeric + _ -)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  try {
    const urlObj = new URL(url);

    // youtube.com/watch?v=VIDEO_ID
    if (urlObj.hostname.includes('youtube.com')) {
      const videoId = urlObj.searchParams.get('v');
      if (videoId) return videoId;

      // youtube.com/embed/VIDEO_ID
      if (urlObj.pathname.startsWith('/embed/')) {
        return urlObj.pathname.split('/embed/')[1]?.split('?')[0] || null;
      }

      // youtube.com/live/VIDEO_ID
      if (urlObj.pathname.startsWith('/live/')) {
        return urlObj.pathname.split('/live/')[1]?.split('?')[0] || null;
      }
    }

    // youtu.be/VIDEO_ID
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1).split('?')[0] || null;
    }
  } catch {
    // Not a valid URL
  }

  return null;
}

export function YouTubeSection() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [videoId, setVideoId] = useState<string>(DEFAULT_VIDEO_ID);
  const [error, setError] = useState<string | null>(null);

  // Load saved URL from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const id = extractVideoId(saved);
      if (id) {
        setVideoId(id);
        setInputUrl(saved);
      }
    }
  }, []);

  const handleUrlSubmit = () => {
    setError(null);

    if (!inputUrl.trim()) {
      // Reset to default
      setVideoId(DEFAULT_VIDEO_ID);
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    const id = extractVideoId(inputUrl.trim());
    if (id) {
      setVideoId(id);
      localStorage.setItem(STORAGE_KEY, inputUrl.trim());
    } else {
      setError('Ungültige YouTube URL');
    }
  };

  const handleReset = () => {
    setInputUrl('');
    setVideoId(DEFAULT_VIDEO_ID);
    localStorage.removeItem(STORAGE_KEY);
    setError(null);
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden mt-6">
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Youtube className="w-5 h-5 text-red-500" />
          <span className="font-medium text-white">YouTube Player</span>
          {!isExpanded && videoId !== DEFAULT_VIDEO_ID && (
            <span className="text-xs text-gray-500 ml-2">Custom Video</span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4">
          {/* URL Input */}
          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                placeholder="YouTube URL eingeben (z.B. https://youtube.com/watch?v=...)"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleUrlSubmit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
              >
                Laden
              </button>
              <button
                onClick={handleReset}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                title="Zurücksetzen auf Default"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            {error && (
              <p className="text-red-400 text-xs mt-1">{error}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              Unterstützt: youtube.com, youtu.be, Livestreams
            </p>
          </div>

          {/* Video Player */}
          <YouTubePlayer videoId={videoId} />

          {/* External Link */}
          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-400 mt-2 w-fit"
          >
            <ExternalLink className="w-3 h-3" />
            Auf YouTube öffnen
          </a>
        </div>
      )}
    </div>
  );
}
