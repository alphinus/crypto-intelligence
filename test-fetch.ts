import { fetchKlines } from './src/lib/binance-klines';

async function test() {
  console.log('Testing fetchKlines...');
  try {
    const data = await fetchKlines('BTCUSDT', '1d', 10);
    console.log('Result length:', data.length);
    if (data.length > 0) {
      console.log('First candle:', data[0]);
    } else {
      console.log('No data returned');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
