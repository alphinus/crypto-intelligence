'use client';

import {
  Zap,
  Box,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Hash,
  Gauge,
} from 'lucide-react';
import {
  formatFeeRate,
  formatMempoolSize,
  getMempoolCongestion,
  formatTimeUntil,
  formatDifficultyChange,
  type BitcoinOnChainData,
} from '@/lib/mempool';

interface BitcoinOnChainProps {
  data: BitcoinOnChainData;
}

function FeeCard({
  label,
  fee,
  time,
  recommended,
}: {
  label: string;
  fee: number;
  time: string;
  recommended?: boolean;
}) {
  return (
    <div
      className={`p-3 rounded-lg ${
        recommended
          ? 'bg-orange-500/10 border border-orange-500/20'
          : 'bg-gray-800/50'
      }`}
    >
      <div className="flex items-center gap-1 mb-1">
        {recommended && <Zap className="w-3 h-3 text-orange-400" />}
        <span className={`text-xs ${recommended ? 'text-orange-400' : 'text-gray-400'}`}>
          {label}
        </span>
      </div>
      <div className={`text-lg font-bold ${recommended ? 'text-orange-400' : 'text-white'}`}>
        {fee} <span className="text-xs font-normal text-gray-500">sat/vB</span>
      </div>
      <div className="text-xs text-gray-500">{time}</div>
    </div>
  );
}

export function BitcoinOnChain({ data }: BitcoinOnChainProps) {
  const congestion = data.mempool
    ? getMempoolCongestion(data.mempool.count)
    : { level: 'low' as const, color: 'text-gray-400', label: 'Unknown' };

  const diffChange = data.difficulty
    ? formatDifficultyChange(data.difficulty.difficultyChange)
    : null;

  return (
    <div className="space-y-4">
      {/* Block Height */}
      <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-orange-400" />
            <span className="font-semibold text-white">Block Height</span>
          </div>
          <div className="text-2xl font-bold text-orange-400">
            {data.blockHeight.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Fee Estimation */}
      {data.fees && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold text-white">Transaction Fees</h3>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <FeeCard
              label="Fast"
              fee={data.fees.fastestFee}
              time="~10 min"
              recommended
            />
            <FeeCard
              label="Standard"
              fee={data.fees.halfHourFee}
              time="~30 min"
            />
            <FeeCard
              label="Slow"
              fee={data.fees.hourFee}
              time="~60 min"
            />
            <FeeCard
              label="Economy"
              fee={data.fees.economyFee}
              time="~1+ hours"
            />
          </div>
        </div>
      )}

      {/* Mempool Status */}
      {data.mempool && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-white">Mempool</h3>
            </div>
            <span className={`text-sm font-medium ${congestion.color}`}>
              {congestion.label} Congestion
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-400 mb-1">Pending TXs</div>
              <div className="text-lg font-bold text-white">
                {data.mempool.count.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Mempool Size</div>
              <div className="text-lg font-bold text-white">
                {formatMempoolSize(data.mempool.vsize)}
              </div>
            </div>
          </div>

          {/* Congestion Bar */}
          <div className="mt-3">
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  congestion.level === 'low'
                    ? 'bg-green-500'
                    : congestion.level === 'medium'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
                style={{
                  width: `${Math.min((data.mempool.count / 100000) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Difficulty Adjustment */}
      {data.difficulty && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Gauge className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold text-white">Difficulty Adjustment</h3>
          </div>

          <div className="space-y-3">
            {/* Progress */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-400">Progress</span>
                <span className="text-white">
                  {data.difficulty.progressPercent.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all"
                  style={{ width: `${data.difficulty.progressPercent}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-400 mb-1">Est. Change</div>
                <div className={`text-lg font-bold ${diffChange?.color}`}>
                  {diffChange?.text}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Remaining</div>
                <div className="text-lg font-bold text-white">
                  {data.difficulty.remainingBlocks} blocks
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              Next adjustment: {formatTimeUntil(data.difficulty.estimatedRetargetDate)}
            </div>
          </div>
        </div>
      )}

      {/* Latest Block Info */}
      {data.latestBlock && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Hash className="w-5 h-5 text-gray-400" />
            <h3 className="font-semibold text-white">Latest Block</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-gray-400">Transactions</div>
              <div className="font-medium text-white">
                {data.latestBlock.tx_count.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Size</div>
              <div className="font-medium text-white">
                {(data.latestBlock.size / 1_000_000).toFixed(2)} MB
              </div>
            </div>
          </div>

          <div className="mt-2 text-xs text-gray-500 truncate">
            Hash: {data.latestBlock.id.slice(0, 20)}...
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-xs text-gray-500 text-center">
        Daten von mempool.space
      </div>
    </div>
  );
}
