const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'bulka.db');

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

console.log('[db] connected:', DB_PATH);

module.exports = db