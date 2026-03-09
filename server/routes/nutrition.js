import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { readStore, writeStore } from '../lib/json-store.js';
import { NutritionLogSchema } from '../schemas/index.js';

const router = Router();

router.get('/', async (req, res) => {
  const logs = await readStore('nutritionLogs');
  if (req.query.date) {
    return res.json(logs.filter(l => l.date === req.query.date));
  }
  res.json(logs);
});

router.post('/', async (req, res) => {
  const result = NutritionLogSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.flatten() });
  const logs = await readStore('nutritionLogs');
  const entry = { id: uuidv4(), ...result.data };
  logs.push(entry);
  await writeStore('nutritionLogs', logs);
  res.status(201).json(entry);
});

router.delete('/:id', async (req, res) => {
  const logs = await readStore('nutritionLogs');
  const filtered = logs.filter(l => l.id !== req.params.id);
  if (filtered.length === logs.length) return res.status(404).json({ error: 'Not found' });
  await writeStore('nutritionLogs', filtered);
  res.json({ ok: true });
});

router.put('/:id', async (req, res) => {
  const result = NutritionLogSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.flatten() });
  const logs = await readStore('nutritionLogs');
  const idx = logs.findIndex(l => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  logs[idx] = { id: req.params.id, ...result.data };
  await writeStore('nutritionLogs', logs);
  res.json(logs[idx]);
});

export default router;
