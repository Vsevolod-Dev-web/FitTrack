export function localOnly(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const allowed = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
  if (!allowed.includes(ip)) {
    return res.status(403).json({ error: 'Local access only' });
  }
  next();
}
