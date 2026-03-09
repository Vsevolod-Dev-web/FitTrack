export function passwordAuth(req, res, next) {
  if (!process.env.APP_PASSWORD) return next();
  const token = req.headers['x-app-token'];
  if (token !== process.env.APP_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}
