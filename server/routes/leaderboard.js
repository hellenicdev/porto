import { Router } from 'express';
import User from '../models/User.js';
import Trade from '../models/Trade.js';
import { getPrices } from '../services/priceService.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const users = await User.find().lean();
    const prices = await getPrices();
    const trades = await Trade.find().lean();

    const userHoldings = {};
    for (const t of trades) {
      const uid = t.userId.toString();
      if (!userHoldings[uid]) userHoldings[uid] = {};
      if (!userHoldings[uid][t.coin]) userHoldings[uid][t.coin] = 0;
      userHoldings[uid][t.coin] += t.type === 'BUY' ? t.quantity : -t.quantity;
    }

    const entries = users.map((u) => {
      const uid = u._id.toString();
      let coinValue = 0;
      for (const [coin, qty] of Object.entries(userHoldings[uid] || {})) {
        const clean = Math.round(qty * 1e8) / 1e8;
        if (clean > 0) {
          coinValue += clean * (prices[coin] || 0);
        }
      }
      return {
        username: u.username,
        totalValue: Math.round((u.cashBalance + coinValue) * 100) / 100,
      };
    });

    entries.sort((a, b) => b.totalValue - a.totalValue);

    res.json(entries.slice(0, 50));
  } catch (err) {
    console.error('GET /api/leaderboard error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

export default router;
