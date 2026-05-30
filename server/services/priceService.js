import axios from 'axios';

const SUPPORTED_COINS = ['bitcoin', 'ethereum', 'solana'];

const FALLBACK_PRICES = { bitcoin: 70000, ethereum: 3500, solana: 150 };
let cache = { prices: FALLBACK_PRICES, timestamp: 0 };
let pendingPromise = null;
const CACHE_TTL = 120_000;

const client = axios.create({
  timeout: 10000,
  headers: {
    'User-Agent': 'CryptoPortfolio/1.0',
    'Accept': 'application/json',
  },
});

export async function getPrices() {
  const now = Date.now();
  if (cache.prices && now - cache.timestamp < CACHE_TTL) {
    return cache.prices;
  }

  if (pendingPromise) {
    return pendingPromise;
  }

  pendingPromise = fetchPrices();

  try {
    const prices = await pendingPromise;
    return prices;
  } finally {
    pendingPromise = null;
  }
}

async function fetchPrices() {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${SUPPORTED_COINS.join(',')}&vs_currencies=usd`;

  try {
    const { data } = await client.get(url);

    const prices = {};
    for (const coin of SUPPORTED_COINS) {
      prices[coin] = data[coin]?.usd ?? null;
    }

    cache = { prices, timestamp: Date.now() };
    return prices;
  } catch (err) {
    console.error('CoinGecko fetch error:', err.message);
    if (err.response) {
      console.error('Status:', err.response.status, 'Data:', JSON.stringify(err.response.data).slice(0, 200));
    }

    if (cache.prices) {
      console.log('Returning stale cached prices');
      return cache.prices;
    }

    throw err;
  }
}

export async function getPrice(coin) {
  const prices = await getPrices();
  return prices[coin] ?? null;
}
