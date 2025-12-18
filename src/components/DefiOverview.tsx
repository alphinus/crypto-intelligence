'use client';

import { useState } from 'react';
import {
  Layers,
  TrendingUp,
  TrendingDown,
  Coins,
  Percent,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { formatTvl, type Protocol, type Chain, type YieldPool } from '@/lib/defillama';

interface DefiOverviewProps {
  totalTvl: number;
  totalTvlChange24h: number;
  topProtocols: Protocol[];
  topChains: Chain[];
  topYields: YieldPool[];
  stablecoins: {
    total: number;
    change24h: number;
  };
}

function ChangeIndicator({ change }: { change: number | null }) {
  if (change === null) return <span className="text-gray-500">-</span>;

  const isPositive = change >= 0;
  return (
    <span
      className={`flex items-center gap-0.5 text-xs ${
        isPositive ? 'text-green-400' : 'text-red-400'
      }`}
    >
      {isPositive ? (
        <TrendingUp className="w-3 h-3" />
      ) : (
        <TrendingDown className="w-3 h-3" />
      )}
      {Math.abs(change).toFixed(2)}%
    </span>
  );
}

function ProtocolRow({ protocol }: { protocol: Protocol }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
      <div className="flex items-center gap-2 min-w-0">
        {protocol.logo && (
          <img
            src={protocol.logo}
            alt={protocol.name}
            className="w-6 h-6 rounded-full bg-gray-800"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
        <div className="min-w-0">
          <div className="font-medium text-white text-sm truncate">
            {protocol.name}
          </div>
          <div className="text-xs text-gray-500">{protocol.category}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-medium text-white text-sm">
          {formatTvl(protocol.tvl)}
        </div>
        <ChangeIndicator change={protocol.change_1d} />
      </div>
    </div>
  );
}

function ChainRow({ chain }: { chain: Chain }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
      <div className="font-medium text-white text-sm">{chain.name}</div>
      <div className="text-right">
        <div className="font-medium text-white text-sm">
          {formatTvl(chain.tvl)}
        </div>
      </div>
    </div>
  );
}

function YieldRow({ pool }: { pool: YieldPool }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
      <div className="min-w-0">
        <div className="font-medium text-white text-sm truncate">
          {pool.symbol}
        </div>
        <div className="text-xs text-gray-500">
          {pool.project} • {pool.chain}
        </div>
      </div>
      <div className="text-right">
        <div className="font-medium text-green-400 text-sm">
          {pool.apy.toFixed(2)}%
        </div>
        <div className="text-xs text-gray-500">{formatTvl(pool.tvlUsd)}</div>
      </div>
    </div>
  );
}

export function DefiOverview({
  totalTvl,
  totalTvlChange24h,
  topProtocols,
  topChains,
  topYields,
  stablecoins,
}: DefiOverviewProps) {
  const [showAllProtocols, setShowAllProtocols] = useState(false);
  const [activeSection, setActiveSection] = useState<'protocols' | 'chains' | 'yields'>('protocols');

  const displayedProtocols = showAllProtocols
    ? topProtocols
    : topProtocols.slice(0, 8);

  return (
    <div className="space-y-4">
      {/* TVL Overview */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold text-white">DeFi TVL</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold text-white">
              {formatTvl(totalTvl)}
            </div>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-gray-500">24h:</span>
              <ChangeIndicator change={totalTvlChange24h} />
            </div>
          </div>
          <div>
            <div className="text-lg font-semibold text-white">
              {formatTvl(stablecoins.total)}
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Coins className="w-3 h-3" />
              Stablecoins
            </div>
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1 p-1 bg-gray-900 rounded-lg">
        <button
          onClick={() => setActiveSection('protocols')}
          className={`flex-1 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
            activeSection === 'protocols'
              ? 'bg-gray-800 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Protocols
        </button>
        <button
          onClick={() => setActiveSection('chains')}
          className={`flex-1 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
            activeSection === 'chains'
              ? 'bg-gray-800 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Chains
        </button>
        <button
          onClick={() => setActiveSection('yields')}
          className={`flex-1 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
            activeSection === 'yields'
              ? 'bg-gray-800 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Percent className="w-3 h-3 inline mr-1" />
          Yields
        </button>
      </div>

      {/* Content */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        {activeSection === 'protocols' && (
          <>
            <h4 className="text-sm font-medium text-gray-400 mb-3">
              Top Protocols by TVL
            </h4>
            <div className="space-y-1">
              {displayedProtocols.map((protocol) => (
                <ProtocolRow key={protocol.id} protocol={protocol} />
              ))}
            </div>
            {topProtocols.length > 8 && (
              <button
                onClick={() => setShowAllProtocols(!showAllProtocols)}
                className="w-full mt-3 py-2 text-xs text-gray-400 hover:text-white flex items-center justify-center gap-1"
              >
                {showAllProtocols ? (
                  <>
                    Weniger anzeigen <ChevronUp className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    Alle {topProtocols.length} anzeigen{' '}
                    <ChevronDown className="w-3 h-3" />
                  </>
                )}
              </button>
            )}
          </>
        )}

        {activeSection === 'chains' && (
          <>
            <h4 className="text-sm font-medium text-gray-400 mb-3">
              Top Chains by TVL
            </h4>
            <div className="space-y-1">
              {topChains.map((chain) => (
                <ChainRow key={chain.name} chain={chain} />
              ))}
            </div>
          </>
        )}

        {activeSection === 'yields' && (
          <>
            <h4 className="text-sm font-medium text-gray-400 mb-3">
              Top Yield Opportunities
            </h4>
            <div className="space-y-1">
              {topYields.map((pool) => (
                <YieldRow key={pool.pool} pool={pool} />
              ))}
            </div>
            <a
              href="https://defillama.com/yields"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 mt-3 py-2 text-xs text-purple-400 hover:text-purple-300"
            >
              Mehr auf DefiLlama <ExternalLink className="w-3 h-3" />
            </a>
          </>
        )}
      </div>
    </div>
  );
}
