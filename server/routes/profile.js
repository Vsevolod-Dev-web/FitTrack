import { Router } from 'express';
import { readStore, writeStore } from '../lib/json-store.js';
import { ProfileSchema } from '../schemas/index.js';

const router = Router();

router.get('/', async (_req, res) => {
  const data = await readStore('profile');
  res.json(data);
});

router.put('/', async (req, res) => {
  const result = ProfileSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.flatten() });
  await writeStore('profile', result.data);
  res.json(result.data);
});

export default router;
