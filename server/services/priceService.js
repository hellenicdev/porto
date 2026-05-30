import axios from 'axios';

const SUPPORTED_COINS = ['bitcoin', 'ethereum', 'solana'];
let cache = { prices: null, timestamp: 0 };
const CACHE_TTL = 30_000;

export async function getPrices() {
  const now = Date.now();
  if (cache.prices && now - cache.timestamp < CACHE_TTL) {
    return cache.prices;
  }

  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${SUPPORTED_COINS.join(',')}&vs_currencies=usd`;

  const { data } = await axios.get(url, { timeout: 10000 });

  const prices = {};
  for (const coin of SUPPORTED_COINS) {
    prices[coin] = data[coin]?.usd ?? null;
  }

  cache = { prices, timestamp: now };
  return prices;
}

export async function getPrice(coin) {
  const prices = await getPrices();
  return prices[coin] ?? null;
}
