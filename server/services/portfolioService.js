import Trade from '../models/Trade.js';
import { getPrices } from './priceService.js';

export async function buildPortfolio(userId) {
  const trades = await Trade.find({ userId }).lean();

  const holdings = {};

  for (const t of trades) {
    if (!holdings[t.coin]) {
      holdings[t.coin] = { qty: 0, totalBuyCost: 0, totalBuyQty: 0 };
    }
    if (t.type === 'BUY') {
      holdings[t.coin].qty += t.quantity;
      holdings[t.coin].totalBuyCost += t.quantity * t.price;
      holdings[t.coin].totalBuyQty += t.quantity;
    } else {
      holdings[t.coin].qty -= t.quantity;
    }
  }

  const prices = await getPrices();
  const coinEntries = [];
  let totalCoinValue = 0;

  for (const [coin, h] of Object.entries(holdings)) {
    const qty = Math.round(h.qty * 1e8) / 1e8;
    if (qty <= 0) continue;

    const livePrice = prices[coin] ?? 0;
    const value = Math.round(qty * livePrice * 100) / 100;
    const avgBuyPrice = h.totalBuyQty > 0
      ? Math.round((h.totalBuyCost / h.totalBuyQty) * 100) / 100
      : 0;
    const pnl = Math.round((livePrice - avgBuyPrice) * qty * 100) / 100;

    coinEntries.push({
      coin,
      quantity: qty,
      value,
      avgBuyPrice,
      pnl,
    });

    totalCoinValue += value;
  }

  return { coinEntries, totalCoinValue };
}
