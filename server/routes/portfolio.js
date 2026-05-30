import { Router } from 'express';
import auth from '../middleware/auth.js';
import User from '../models/User.js';
import { buildPortfolio } from '../services/portfolioService.js';

const router = Router();

router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const portfolio = await buildPortfolio(req.userId);

    res.json({
      cashBalance: user.cashBalance,
      totalValue: Math.round((user.cashBalance + portfolio.totalCoinValue) * 100) / 100,
      holdings: portfolio.coinEntries,
    });
  } catch (err) {
    console.error('GET /api/portfolio error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

export default router;
