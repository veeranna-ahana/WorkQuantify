const jwt = require('jsonwebtoken');

// ─────────────────────────────────────────────────────────────────────────────
// authMiddleware
// Verifies JWT and attaches decoded payload to req.user.
// Use on ALL protected routes.
// ─────────────────────────────────────────────────────────────────────────────
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token missing or malformed.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// adminOnly
// Must be used AFTER authMiddleware. Rejects any non-ADMIN role.
//
// Usage in routes:
//   router.post('/', authMiddleware, adminOnly, yourController);
// ─────────────────────────────────────────────────────────────────────────────
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }
  return next();
};

module.exports = { authMiddleware, adminOnly };
