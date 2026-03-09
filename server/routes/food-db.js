import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { readStore, writeStore } from '../lib/json-store.js';
import { FoodItemSchema } from '../schemas/index.js';

const router = Router();

router.get('/', async (req, res) => {
  const db = await readStore('foodDb');
  if (req.query.q) {
    const q = req.query.q.toLowerCase();
    return res.json(db.filter(item => item.name.toLowerCase().includes(q)));
  }
  res.json(db);
});

router.post('/', async (req, res) => {
  const result = FoodItemSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.flatten() });
  const db = await readStore('foodDb');
  const entry = { id: uuidv4(), lastUsed: new Date().toISOString().slice(0, 10), ...result.data };
  db.push(entry);
  await writeStore('foodDb', db);
  res.status(201).json(entry);
});

// Proxy для Open Food Facts
router.get('/search-external', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'q is required' });
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=10`;
    const response = await fetch(url);
    const data = await response.json();
    const products = (data.products || []).map(p => ({
      name: p.product_name || p.product_name_en || 'Unknown',
      barcode: p.code,
      per100g: {
        calories: Math.round(p.nutriments?.['energy-kcal_100g'] || 0),
        protein: Math.round(p.nutriments?.proteins_100g || 0),
        fat: Math.round(p.nutriments?.fat_100g || 0),
        carbs: Math.round(p.nutriments?.carbohydrates_100g || 0),
      },
      source: 'openfoodfacts',
    }));
    res.json(products);
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch from Open Food Facts' });
  }
});

export default router;
