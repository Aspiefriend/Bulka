const express = require('express');
const db = require('../db/db');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY categories.id_category').all();
    res.json({ data: categories });
  } catch (err) {
    console.error('[categories] GET /', err);
    res.status(500).json({
      error: { message: 'Internal server error', code: 'INTERNAL' },
    });
  }
});

module.exports = router;
