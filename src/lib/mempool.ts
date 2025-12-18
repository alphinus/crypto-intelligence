// Mempool.space API Client (100% kostenlos, kein API Key)

const BASE_URL = 'https://mempool.space/api';

export interface RecommendedFees {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}

export interface MempoolStats {
  count: number;
  vsize: number;
  total_fee: number;
  fee_histogram: number[][];
}

export interface DifficultyAdjustment {
  progressPercent: number;
  difficultyChange: number;
  estimatedRetargetDate: number;
  remainingBlocks: number;
  remainingTime: number;
  previousRetarget: number;
  previousTime: number;
  nextRetargetHeight: number;
  timeAvg: number;
  timeOffset: number;
}

export interface Block {
  id: string;
  height: number;
  version: number;
  timestamp: number;
  tx_count: number;
  size: number;
  weight: number;
  merkle_root: string;
  previousblockhash: string;
  mediantime: number;
  nonce: number;
  bits: number;
  difficulty: number;
}

export interface BitcoinOnChainData {
  fees: RecommendedFees | null;
  mempool: MempoolStats | null;
  difficulty: DifficultyAdjustment | null;
  latestBlock: Block | null;
  blockHeight: number;
}

async function fetchWithRetry<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error);
    return null;
  }
}

export async function fetchRecommendedFees(): Promise<RecommendedFees | null> {
  return fetchWithRetry<RecommendedFees>(`${BASE_URL}/v1/fees/recommended`);
}

export async function fetchMempoolStats(): Promise<MempoolStats | null> {
  return fetchWithRetry<MempoolStats>(`${BASE_URL}/mempool`);
}

export async function fetchDifficultyAdjustment(): Promise<DifficultyAdjustment | null> {
  return fetchWithRetry<DifficultyAdjustment>(`${BASE_URL}/v1/difficulty-adjustment`);
}

export async function fetchLatestBlocks(): Promise<Block[] | null> {
  return fetchWithRetry<Block[]>(`${BASE_URL}/v1/blocks`);
}

export async function fetchBlockHeight(): Promise<number> {
  const height = await fetchWithRetry<number>(`${BASE_URL}/blocks/tip/height`);
  return height || 0;
}

export async function fetchBitcoinOnChainData(): Promise<BitcoinOnChainData> {
  const [fees, mempool, difficulty, blocks, blockHeight] = await Promise.all([
    fetchRecommendedFees(),
    fetchMempoolStats(),
    fetchDifficultyAdjustment(),
    fetchLatestBlocks(),
    fetchBlockHeight(),
  ]);

  return {
    fees,
    mempool,
    difficulty,
    latestBlock: blocks && blocks.length > 0 ? blocks[0] : null,
    blockHeight,
  };
}

// Helper functions
export function formatFeeRate(satPerVb: number): string {
  return `${satPerVb} sat/vB`;
}

export function formatMempoolSize(vsize: number): string {
  const mb = vsize / 1_000_000;
  return `${mb.toFixed(2)} vMB`;
}

export function getMempoolCongestion(count: number): {
  level: 'low' | 'medium' | 'high';
  color: string;
  label: string;
} {
  if (count < 10000) {
    return { level: 'low', color: 'text-green-400', label: 'Low' };
  } else if (count < 50000) {
    return { level: 'medium', color: 'text-yellow-400', label: 'Medium' };
  } else {
    return { level: 'high', color: 'text-red-400', label: 'High' };
  }
}

export function formatTimeUntil(timestamp: number): string {
  const now = Date.now();
  const diff = timestamp - now;

  if (diff <= 0) return 'Soon';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  return `${hours}h`;
}

export function formatDifficultyChange(change: number): {
  text: string;
  color: string;
} {
  const prefix = change >= 0 ? '+' : '';
  const color = change >= 0 ? 'text-red-400' : 'text-green-400';
  return {
    text: `${prefix}${change.toFixed(2)}%`,
    color,
  };
}
