const BASE = '/api';

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  getProfile: () => request('GET', '/profile'),
  putProfile: (data) => request('PUT', '/profile', data),

  getBodyLogs: () => request('GET', '/body-logs'),
  postBodyLog: (data) => request('POST', '/body-logs', data),
  deleteBodyLog: (id) => request('DELETE', `/body-logs/${id}`),

  getNutritionLogs: (date) => request('GET', `/nutrition-logs${date ? `?date=${date}` : ''}`),
  postNutritionLog: (data) => { const { id: _, ...body } = data; return request('POST', '/nutrition-logs', body); },
  putNutritionLog:  (id, data) => { const { id: _, ...body } = data; return request('PUT', `/nutrition-logs/${id}`, body); },
  deleteNutritionLog: (id) => request('DELETE', `/nutrition-logs/${id}`),

  getTrainingLogs: () => request('GET', '/training-logs'),
  postTrainingLog: (data) => request('POST', '/training-logs', data),
  deleteTrainingLog: (id) => request('DELETE', `/training-logs/${id}`),

  getFoodDb: (q) => request('GET', `/food-db${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  postFoodDb: (data) => request('POST', '/food-db', data),
  searchFoodExternal: (q) => request('GET', `/food-db/search-external?q=${encodeURIComponent(q)}`),
};
