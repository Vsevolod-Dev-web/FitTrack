import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { localOnly } from './middleware/local-only.js';
import bodyRouter from './routes/body.js';
import nutritionRouter from './routes/nutrition.js';
import trainingRouter from './routes/training.js';
import profileRouter from './routes/profile.js';
import foodDbRouter from './routes/food-db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'x-app-token'],
}));
app.use(express.json());
app.use('/api', localOnly);

app.use('/api/profile', profileRouter);
app.use('/api/body-logs', bodyRouter);
app.use('/api/nutrition-logs', nutritionRouter);
app.use('/api/training-logs', trainingRouter);
app.use('/api/food-db', foodDbRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
