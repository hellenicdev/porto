import { Router } from 'express';
import auth from '../middleware/auth.js';
import Trade from '../models/Trade.js';
import User from '../models/User.js';
import { getPrice } from '../services/priceService.js';
import { buildPortfolio } from '../services/portfolioService.js';

const router = Router();

router.post('/', auth, async (req, res) => {
  try {
    const { coin, type, quantity } = req.body;
    const userId = req.userId;

    if (!['bitcoin', 'ethereum', 'solana'].includes(coin)) {
      return res.status(400).json({ error: 'Unsupported coin' });
    }
    if (!['BUY', 'SELL'].includes(type)) {
      return res.status(400).json({ error: 'Type must be BUY or SELL' });
    }
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be positive' });
    }

    const price = await getPrice(coin);
    if (!price) {
      return res.status(502).json({ error: 'Could not fetch price' });
    }

    const cost = quantity * price;

    if (type === 'BUY') {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (user.cashBalance < cost) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      await User.findByIdAndUpdate(userId, { $inc: { cashBalance: -cost } });
      await Trade.create({ userId, coin, type, quantity, price });
    } else {
      const trades = await Trade.find({ userId, coin });
      let owned = 0;
      for (const t of trades) {
        owned += t.type === 'BUY' ? t.quantity : -t.quantity;
      }
      owned = Math.round(owned * 1e8) / 1e8;
      if (owned < quantity) {
        return res.status(400).json({ error: 'Insufficient coin balance' });
      }

      await User.findByIdAndUpdate(userId, { $inc: { cashBalance: cost } });
      await Trade.create({ userId, coin, type, quantity, price });
    }

    const user = await User.findById(userId);
    const portfolio = await buildPortfolio(userId);

    res.json({
      cashBalance: user.cashBalance,
      totalValue: Math.round((user.cashBalance + portfolio.totalCoinValue) * 100) / 100,
      holdings: portfolio.coinEntries,
    });
  } catch (err) {
    console.error('POST /api/trades error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const trades = await Trade.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(trades);
  } catch (err) {
    console.error('GET /api/trades error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

export default router;
