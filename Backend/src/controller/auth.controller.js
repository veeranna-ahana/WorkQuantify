const jwt    = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { query } = require('../config/db');

const SALT_ROUNDS = 10;

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// Body: { email, password }
// ─────────────────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const users = await query(
      'SELECT id, name, email, password, role FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = users[0];

    // ── bcrypt compare (works for both hashed and legacy plain-text passwords) ──
    // If the stored value doesn't look like a bcrypt hash, fall back to plain
    // comparison so existing accounts keep working until they reset passwords.
    let passwordValid = false;
    const looksHashed = user.password && user.password.startsWith('$2');

    if (looksHashed) {
      passwordValid = await bcrypt.compare(password, user.password);
    } else {
      // Legacy plain-text fallback — migrate on successful login
      passwordValid = user.password === password;
      if (passwordValid) {
        // Silently upgrade to hashed on next successful plain-text login
        const hashed = await bcrypt.hash(password, SALT_ROUNDS);
        await query('UPDATE users SET password = ? WHERE id = ?', [hashed, user.id]);
      }
    }

    if (!passwordValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const payload = {
      id:    user.id,
      email: user.email,
      name:  user.name,
      role:  user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev_secret', {
      expiresIn: '8h',
    });

    return res.status(200).json({
      token,
      user: {
        id:    user.id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
    });
  } catch (err) {
    return next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// Body: { name, email, password, role, daily_capacity }
// ADMIN only — protected at route level with adminOnly middleware
// ─────────────────────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, daily_capacity } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'name, email, password and role are required.' });
    }

    // Check duplicate email
    const existing = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'A user with this email already exists.' });
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await query(
      'INSERT INTO users (name, email, password, role, daily_capacity) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashed, role, daily_capacity || 8]
    );

    return res.status(201).json({
      id:    result.insertId,
      name,
      email,
      role,
      daily_capacity: daily_capacity || 8,
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = { login, register };
