// Bonding Curve Simulation - Pump.fun Style
// Dies ist eine SIMULATION zu Lernzwecken - keine echte Blockchain!

export interface BondingCurveConfig {
  initialPrice: number;      // Starting price in USD
  curveExponent: number;     // How steep the curve is (1.5 = moderate, 2 = steep)
  maxSupply: number;         // Maximum token supply
  graduationMarketCap: number; // Market cap at which token "graduates"
}

export interface MockToken {
  id: string;
  name: string;
  symbol: string;
  logo: string | null;
  description: string;
  twitter?: string;
  telegram?: string;
  website?: string;
  createdAt: Date;
  bondingCurve: BondingCurveConfig;
  currentSupply: number;     // Tokens in circulation
  reserveBalance: number;    // USD in reserve (from buys)
  trades: MockTrade[];
  holders: number;
  isGraduated: boolean;
}

export interface MockTrade {
  id: string;
  type: 'buy' | 'sell';
  amount: number;           // Token amount
  price: number;            // Price per token at trade
  total: number;            // Total USD
  timestamp: Date;
  priceImpact: number;      // Percentage
}

export interface MockWallet {
  balance: number;          // USD balance (play money)
  holdings: Record<string, number>; // token id -> amount
}

// Default bonding curve config (similar to pump.fun)
export const DEFAULT_CURVE_CONFIG: BondingCurveConfig = {
  initialPrice: 0.000001,   // $0.000001 initial price
  curveExponent: 1.5,       // Moderate curve
  maxSupply: 1_000_000_000, // 1 billion tokens
  graduationMarketCap: 69_000, // $69k graduation (like pump.fun)
};

// Calculate price at a given supply level using bonding curve formula
// Price = initialPrice * (supply / maxSupply)^exponent
export function calculatePriceAtSupply(
  supply: number,
  config: BondingCurveConfig
): number {
  if (supply <= 0) return config.initialPrice;
  const ratio = supply / config.maxSupply;
  return config.initialPrice * Math.pow(1 + ratio * 100, config.curveExponent);
}

// Calculate how much USD is needed to buy a certain amount of tokens
export function calculateBuyCost(
  tokenAmount: number,
  currentSupply: number,
  config: BondingCurveConfig
): { cost: number; avgPrice: number; priceImpact: number } {
  const startPrice = calculatePriceAtSupply(currentSupply, config);
  const endPrice = calculatePriceAtSupply(currentSupply + tokenAmount, config);

  // Integral approximation for cost
  const avgPrice = (startPrice + endPrice) / 2;
  const cost = avgPrice * tokenAmount;

  const priceImpact = ((endPrice - startPrice) / startPrice) * 100;

  return { cost, avgPrice, priceImpact };
}

// Calculate how much USD you get for selling tokens
export function calculateSellReturn(
  tokenAmount: number,
  currentSupply: number,
  config: BondingCurveConfig
): { returnUsd: number; avgPrice: number; priceImpact: number } {
  if (tokenAmount > currentSupply) {
    throw new Error('Cannot sell more than current supply');
  }

  const startPrice = calculatePriceAtSupply(currentSupply, config);
  const endPrice = calculatePriceAtSupply(currentSupply - tokenAmount, config);

  const avgPrice = (startPrice + endPrice) / 2;
  const returnUsd = avgPrice * tokenAmount;

  const priceImpact = ((startPrice - endPrice) / startPrice) * 100;

  return { returnUsd, avgPrice, priceImpact };
}

// Calculate current market cap
export function calculateMarketCap(
  currentSupply: number,
  config: BondingCurveConfig
): number {
  const currentPrice = calculatePriceAtSupply(currentSupply, config);
  return currentPrice * currentSupply;
}

// Generate price curve data for chart
export function generateCurveData(
  config: BondingCurveConfig,
  currentSupply: number,
  points: number = 100
): Array<{ supply: number; price: number; marketCap: number }> {
  const data: Array<{ supply: number; price: number; marketCap: number }> = [];

  for (let i = 0; i <= points; i++) {
    const supply = (config.maxSupply * i) / points;
    const price = calculatePriceAtSupply(supply, config);
    const marketCap = price * supply;
    data.push({ supply, price, marketCap });
  }

  return data;
}

// Create a new mock token
export function createMockToken(
  name: string,
  symbol: string,
  description: string,
  logo: string | null = null,
  socials?: { twitter?: string; telegram?: string; website?: string }
): MockToken {
  return {
    id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    symbol: symbol.toUpperCase(),
    logo,
    description,
    twitter: socials?.twitter,
    telegram: socials?.telegram,
    website: socials?.website,
    createdAt: new Date(),
    bondingCurve: { ...DEFAULT_CURVE_CONFIG },
    currentSupply: 0,
    reserveBalance: 0,
    trades: [],
    holders: 0,
    isGraduated: false,
  };
}

// Execute a buy trade
export function executeBuy(
  token: MockToken,
  usdAmount: number,
  wallet: MockWallet
): { success: boolean; trade?: MockTrade; error?: string } {
  if (usdAmount <= 0) {
    return { success: false, error: 'Amount must be positive' };
  }

  if (wallet.balance < usdAmount) {
    return { success: false, error: 'Insufficient balance' };
  }

  // Calculate how many tokens we get
  const currentPrice = calculatePriceAtSupply(token.currentSupply, token.bondingCurve);

  // Binary search to find token amount for given USD
  let tokenAmount = usdAmount / currentPrice;
  const { cost, avgPrice, priceImpact } = calculateBuyCost(
    tokenAmount,
    token.currentSupply,
    token.bondingCurve
  );

  // Adjust token amount based on actual cost
  tokenAmount = usdAmount / avgPrice;

  const trade: MockTrade = {
    id: `trade_${Date.now()}`,
    type: 'buy',
    amount: tokenAmount,
    price: avgPrice,
    total: usdAmount,
    timestamp: new Date(),
    priceImpact,
  };

  // Update token state
  token.currentSupply += tokenAmount;
  token.reserveBalance += usdAmount;
  token.trades.push(trade);

  // Update wallet
  wallet.balance -= usdAmount;
  wallet.holdings[token.id] = (wallet.holdings[token.id] || 0) + tokenAmount;

  // Check graduation
  const marketCap = calculateMarketCap(token.currentSupply, token.bondingCurve);
  if (marketCap >= token.bondingCurve.graduationMarketCap) {
    token.isGraduated = true;
  }

  return { success: true, trade };
}

// Execute a sell trade
export function executeSell(
  token: MockToken,
  tokenAmount: number,
  wallet: MockWallet
): { success: boolean; trade?: MockTrade; error?: string } {
  if (tokenAmount <= 0) {
    return { success: false, error: 'Amount must be positive' };
  }

  const holdings = wallet.holdings[token.id] || 0;
  if (holdings < tokenAmount) {
    return { success: false, error: 'Insufficient token balance' };
  }

  const { returnUsd, avgPrice, priceImpact } = calculateSellReturn(
    tokenAmount,
    token.currentSupply,
    token.bondingCurve
  );

  const trade: MockTrade = {
    id: `trade_${Date.now()}`,
    type: 'sell',
    amount: tokenAmount,
    price: avgPrice,
    total: returnUsd,
    timestamp: new Date(),
    priceImpact,
  };

  // Update token state
  token.currentSupply -= tokenAmount;
  token.reserveBalance -= returnUsd;
  token.trades.push(trade);

  // Update wallet
  wallet.balance += returnUsd;
  wallet.holdings[token.id] -= tokenAmount;

  return { success: true, trade };
}

// Create initial wallet with play money
export function createMockWallet(initialBalance: number = 10000): MockWallet {
  return {
    balance: initialBalance,
    holdings: {},
  };
}

// Format large numbers for display
export function formatTokenAmount(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(2)}B`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(2)}K`;
  return amount.toFixed(2);
}

export function formatUSD(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(2)}K`;
  if (amount >= 1) return `$${amount.toFixed(2)}`;
  if (amount >= 0.01) return `$${amount.toFixed(4)}`;
  return `$${amount.toFixed(8)}`;
}
