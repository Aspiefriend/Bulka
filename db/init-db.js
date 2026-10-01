const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, 'bulka.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
const SEED_PATH = path.join(__dirname, 'seed.sql');

const RESET = process.argv.includes('--reset');
const DB_EXISTS = fs.existsSync(DB_PATH);

if (RESET && DB_EXISTS) {
  fs.unlinkSync(DB_PATH);
  console.log('[db] old database removed (--reset)');
}

const isNew = RESET || !DB_EXISTS;

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

db.exec(fs.readFileSync(SCHEMA_PATH, 'utf8'));
console.log('[db] schema applied');

if (isNew) {
  db.exec(fs.readFileSync(SEED_PATH, 'utf8'));
  console.log('[db] seed applied');
}

const counts = {
  categories: db.prepare('SELECT COUNT(*) AS c FROM categories').get().c,
  products: db.prepare('SELECT COUNT(*) AS c FROM products').get().c,
  users: db.prepare('SELECT COUNT(*) AS c FROM users').get().c,
};

console.log('[db] categories:', counts.categories);
console.log('[db] products:', counts.products);
console.log('[db] users:', counts.users);

db.close();
console.log('[db] done:', DB_PATH);