import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../data');

const ALLOWED_FILES = {
  profile:       'profile.json',
  bodyLogs:      'body-logs.json',
  nutritionLogs: 'nutrition-logs.json',
  trainingLogs:  'training-logs.json',
  foodDb:        'food-db.json',
};

export function filePath(key) {
  if (!ALLOWED_FILES[key]) throw new Error(`Unknown store key: ${key}`);
  return path.join(DATA_DIR, ALLOWED_FILES[key]);
}

export async function readStore(key) {
  const fp = filePath(key);
  try {
    const raw = await fs.readFile(fp, 'utf8');
    return JSON.parse(raw);
  } catch {
    return key === 'profile' ? {} : [];
  }
}

export async function writeStore(key, data) {
  const fp = filePath(key);
  await fs.writeFile(fp, JSON.stringify(data, null, 2), 'utf8');
}
