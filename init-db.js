// =============================================
// Инициализация базы данных SQLite
// Запуск: node init-db.js
// =============================================

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, 'bulka.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

console.log('🥖 Инициализация БД «Булка»...\n');

// Удаляем старую БД
if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
    console.log('🗑️  Старая БД удалена');
}

// Создаём новую
const db = new Database(DB_PATH);
console.log('✅ БД создана:', DB_PATH);

// Читаем схему
const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');

// Применяем
db.exec(schema);
console.log('✅ Схема применена');

// Проверяем таблицы
const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name
`).all();

console.log('\n📋 Созданные таблицы:');
tables.forEach(t => console.log('  •', t.name));

// Считаем данные
const counts = {
    categories: db.prepare('SELECT COUNT(*) as c FROM categories').get().c,
    products: db.prepare('SELECT COUNT(*) as c FROM products').get().c,
    users: db.prepare('SELECT COUNT(*) as c FROM users').get().c,
};

console.log('\n📊 Данные:');
console.log('  • Категорий:', counts.categories);
console.log('  • Товаров:', counts.products);
console.log('  • Пользователей:', counts.users);

console.log('\n🎉 Готово! БД «Булка» создана.');
console.log('📍 Файл:', DB_PATH);

db.close();