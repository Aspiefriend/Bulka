// =============================================
// Булка — Express-сервер
// Запуск: node server.js
// =============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;

// =============================================
// Middleware
// =============================================
app.use(cors());
app.use(express.json());

// =============================================
// Подключение к БД
// =============================================
const db = new Database(path.join(__dirname, 'bulka.db'));
db.pragma('foreign_keys = ON');
console.log('✅ БД подключена: bulka.db');

// =============================================
// Роуты
// =============================================

// Главная — проверка, что сервер работает
app.get('/', (req, res) => {
    res.json({
        message: '🥖 Булка API работает',
        version: '1.0.0',
        endpoints: [
            'GET /api/categories',
            'GET /api/products',
            'GET /api/products/:id'
        ]
    });
});

// Все категории
app.get('/api/categories', (req, res) => {
    try {
        const categories = db.prepare('SELECT * FROM categories').all();
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Все товары
app.get('/api/products', (req, res) => {
    try {
        const products = db.prepare(`
            SELECT 
                p.id_product,
                p.name,
                p.description,
                p.price,
                p.emoji,
                p.id_category,
                c.name AS category_name,
                c.emoji AS category_emoji
            FROM products p
            LEFT JOIN categories c ON p.id_category = c.id_category
            ORDER BY p.id_product
        `).all();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Один товар по ID
app.get('/api/products/:id', (req, res) => {
    try {
        const product = db.prepare(`
            SELECT 
                p.id_product,
                p.name,
                p.description,
                p.price,
                p.emoji,
                p.id_category,
                c.name AS category_name,
                c.emoji AS category_emoji
            FROM products p
            LEFT JOIN categories c ON p.id_category = c.id_category
            WHERE p.id_product = ?
        `).get(req.params.id);

        if (!product) {
            return res.status(404).json({ error: 'Товар не найден' });
        }
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =============================================
// Запуск
// =============================================
app.listen(PORT, () => {
    console.log('');
    console.log('🥖 ====================================');
    console.log('   Булка API запущен');
    console.log('   http://localhost:' + PORT);
    console.log('🥖 ====================================');
    console.log('');
    console.log('📋 Доступные эндпоинты:');
    console.log('   GET http://localhost:' + PORT + '/');
    console.log('   GET http://localhost:' + PORT + '/api/categories');
    console.log('   GET http://localhost:' + PORT + '/api/products');
    console.log('   GET http://localhost:' + PORT + '/api/products/1');
    console.log('');
});