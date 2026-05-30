import { Router } from 'express';
import { getPrices } from '../services/priceService.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const prices = await getPrices();
    res.json(prices);
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch prices' });
  }
});

export default router;
