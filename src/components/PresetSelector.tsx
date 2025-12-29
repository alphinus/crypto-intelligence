'use client';

import { useState } from 'react';
import { INDICATOR_PRESETS, type IndicatorPreset, recommendPreset } from '@/lib/groq';

interface PresetSelectorProps {
  selectedPreset: IndicatorPreset;
  onPresetChange: (preset: IndicatorPreset) => void;
  currentTimeframe?: string;
  autoSwitch: boolean;
  onAutoSwitchChange: (enabled: boolean) => void;
}

export default function PresetSelector({
  selectedPreset,
  onPresetChange,
  currentTimeframe,
  autoSwitch,
  onAutoSwitchChange,
}: PresetSelectorProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Empfohlenes Preset basierend auf Timeframe
  const recommendedPresetId = currentTimeframe ? recommendPreset(currentTimeframe) : null;

  // Preset Icons
  const presetIcons: Record<string, string> = {
    scalper: '~',
    daytrader: '#',
    swing: '~',
    position: '^',
  };

  return (
    <div className="bg-white dark:bg-[#1a1a2e] rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Indikator-Preset</span>
          {recommendedPresetId && recommendedPresetId !== selectedPreset.id && (
            <span className="text-xs text-yellow-500/80 px-2 py-0.5 bg-yellow-500/10 rounded">
              Empfohlen: {INDICATOR_PRESETS.find(p => p.id === recommendedPresetId)?.name}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          {showDetails ? 'Weniger' : 'Details'}
        </button>
      </div>

      {/* Preset Buttons */}
      <div className="p-3">
        <div className="flex flex-wrap gap-2">
          {INDICATOR_PRESETS.map((preset) => {
            const isSelected = selectedPreset.id === preset.id;
            const isRecommended = recommendedPresetId === preset.id;

            return (
              <button
                key={preset.id}
                onClick={() => onPresetChange(preset)}
                className={`
                  px-3 py-2 rounded-lg text-sm font-medium transition-all
                  flex items-center gap-2
                  ${isSelected
                    ? 'bg-blue-600 text-white'
                    : isRecommended
                      ? 'bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/20 dark:hover:bg-yellow-500/30'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-300'
                  }
                `}
              >
                <span className="text-base">{presetIcons[preset.id] || '?'}</span>
                <span>{preset.name}</span>
              </button>
            );
          })}
        </div>

        {/* Auto-Switch Toggle */}
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-gray-500">Auto-Switch mit Timeframe</span>
          <button
            onClick={() => onAutoSwitchChange(!autoSwitch)}
            className={`
              w-12 h-6 rounded-full transition-all relative
              ${autoSwitch ? 'bg-blue-600' : 'bg-gray-700'}
            `}
          >
            <span
              className={`
                absolute top-1 w-4 h-4 rounded-full bg-white transition-all
                ${autoSwitch ? 'left-7' : 'left-1'}
              `}
            />
          </button>
        </div>
      </div>

      {/* Active Preset Info */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-gray-900 dark:text-white font-medium">{selectedPreset.name}</span>
            <span className="text-gray-500 text-sm ml-2">
              Optimal: {selectedPreset.targetTimeframes.join(', ')}
            </span>
          </div>
          <span className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
            {selectedPreset.tradingStyle}
          </span>
        </div>
        <p className="text-gray-500 text-sm mt-1">{selectedPreset.description}</p>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 space-y-4">
          {/* Active Indicators */}
          <div>
            <h4 className="text-gray-400 text-xs uppercase tracking-wider mb-2">
              Aktive Indikatoren
            </h4>
            <div className="flex flex-wrap gap-2">
              {selectedPreset.indicators.ema.enabled && (
                <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                  EMA ({selectedPreset.indicators.ema.periods.join(', ')})
                </span>
              )}
              {selectedPreset.indicators.rsi.enabled && (
                <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                  RSI ({selectedPreset.indicators.rsi.period})
                </span>
              )}
              {selectedPreset.indicators.macd.enabled && (
                <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">
                  MACD ({selectedPreset.indicators.macd.fast}/{selectedPreset.indicators.macd.slow})
                </span>
              )}
              {selectedPreset.indicators.bollingerBands.enabled && (
                <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">
                  BB ({selectedPreset.indicators.bollingerBands.period})
                </span>
              )}
              {selectedPreset.indicators.vwap.enabled && (
                <span className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded">
                  VWAP
                </span>
              )}
              {selectedPreset.indicators.atr.enabled && (
                <span className="text-xs px-2 py-1 bg-orange-500/20 text-orange-400 rounded">
                  ATR ({selectedPreset.indicators.atr.period})
                </span>
              )}
              {selectedPreset.indicators.stochRSI.enabled && (
                <span className="text-xs px-2 py-1 bg-pink-500/20 text-pink-400 rounded">
                  StochRSI
                </span>
              )}
              {selectedPreset.indicators.adx.enabled && (
                <span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded">
                  ADX ({selectedPreset.indicators.adx.period})
                </span>
              )}
              {selectedPreset.indicators.obv.enabled && (
                <span className="text-xs px-2 py-1 bg-teal-500/20 text-teal-400 rounded">
                  OBV
                </span>
              )}
              {(selectedPreset.indicators.divergence.rsi || selectedPreset.indicators.divergence.macd) && (
                <span className="text-xs px-2 py-1 bg-violet-500/20 text-violet-400 rounded">
                  Divergenz ({[
                    selectedPreset.indicators.divergence.rsi ? 'RSI' : null,
                    selectedPreset.indicators.divergence.macd ? 'MACD' : null,
                  ].filter(Boolean).join(', ')})
                </span>
              )}
            </div>
          </div>

          {/* Score Weights */}
          <div>
            <h4 className="text-gray-400 text-xs uppercase tracking-wider mb-2">
              Score-Gewichtung
            </h4>
            <div className="space-y-2">
              <WeightBar label="Trend" value={selectedPreset.scoreWeights.trendAlignment} color="blue" />
              <WeightBar label="Momentum" value={selectedPreset.scoreWeights.momentum} color="green" />
              <WeightBar label="Volume" value={selectedPreset.scoreWeights.volumeConfirmation} color="yellow" />
              <WeightBar label="Divergenz" value={selectedPreset.scoreWeights.divergenceBonus} color="purple" />
              <WeightBar label="Stärke" value={selectedPreset.scoreWeights.trendStrength} color="red" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Weight Bar Component
function WeightBar({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-gray-500 text-xs w-20">{label}</span>
      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color] || 'bg-gray-500'} transition-all`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-gray-400 text-xs w-8 text-right">{value}%</span>
    </div>
  );
}
