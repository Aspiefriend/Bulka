const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/db');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('[auth] JWT_SECRET is not set in .env');
  process.exit(1);
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Валидация
    if (!email || !password || !name) {
      return res.status(400).json({
        error: { message: 'Email, password and name are required', code: 'VALIDATION' },
      });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        error: { message: 'Invalid email format', code: 'VALIDATION' },
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: { message: 'Password must be at least 6 characters', code: 'VALIDATION' },
      });
    }

    // Проверка на существующего
    const existing = db
      .prepare('SELECT id_user FROM users WHERE email = ?')
      .get(email);

    if (existing) {
      return res.status(400).json({
        error: { message: 'User with this email already exists', code: 'EMAIL_TAKEN' },
      });
    }

    // Хеш пароля
    const hash = await bcrypt.hash(password, 10);

    // Вставка
    const result = db
      .prepare('INSERT INTO users (email, password, name, is_admin) VALUES (?, ?, ?, 0)')
      .run(email, hash, name);

    const userId = result.lastInsertRowid;

    // Токен
    const token = jwt.sign(
      { id_user: userId, email, is_admin: 0 },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      data: {
        token,
        user: { id_user: userId, email, name, is_admin: 0 },
      },
    });
  } catch (err) {
    console.error('[auth] register error:', err);
    res.status(500).json({
      error: { message: 'Internal server error', code: 'INTERNAL' },
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: { message: 'Email and password are required', code: 'VALIDATION' },
      });
    }

    const user = db
      .prepare('SELECT id_user, email, password, name, is_admin FROM users WHERE email = ?')
      .get(email);

    if (!user) {
      return res.status(401).json({
        error: { message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' },
      });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({
        error: { message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' },
      });
    }

    const token = jwt.sign(
      { id_user: user.id_user, email: user.email, is_admin: user.is_admin },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      data: {
        token,
        user: {
          id_user: user.id_user,
          email: user.email,
          name: user.name,
          is_admin: user.is_admin,
        },
      },
    });
  } catch (err) {
    console.error('[auth] login error:', err);
    res.status(500).json({
      error: { message: 'Internal server error', code: 'INTERNAL' },
    });
  }
});

// GET /api/auth/me — защищённый роут (проверка токена в middleware)
const authMiddleware = require('../middleware/auth');

router.get('/me', authMiddleware, (req, res) => {
  try {
    const user = db
      .prepare('SELECT id_user, email, name, is_admin, created_at FROM users WHERE id_user = ?')
      .get(req.user.id_user);

    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found', code: 'NOT_FOUND' },
      });
    }

    res.json({ data: user });
  } catch (err) {
    console.error('[auth] me error:', err);
    res.status(500).json({
      error: { message: 'Internal server error', code: 'INTERNAL' },
    });
  }
});

module.exports = router;