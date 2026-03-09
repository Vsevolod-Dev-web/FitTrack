import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { readStore, writeStore } from '../lib/json-store.js';
import { TrainingLogSchema } from '../schemas/index.js';

const router = Router();

router.get('/', async (_req, res) => {
  const logs = await readStore('trainingLogs');
  res.json(logs);
});

router.post('/', async (req, res) => {
  const result = TrainingLogSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.flatten() });
  const logs = await readStore('trainingLogs');
  const entry = { id: uuidv4(), ...result.data };
  logs.push(entry);
  await writeStore('trainingLogs', logs);
  res.status(201).json(entry);
});

router.delete('/:id', async (req, res) => {
  const logs = await readStore('trainingLogs');
  const filtered = logs.filter(l => l.id !== req.params.id);
  if (filtered.length === logs.length) return res.status(404).json({ error: 'Not found' });
  await writeStore('trainingLogs', filtered);
  res.json({ ok: true });
});

export default router;
