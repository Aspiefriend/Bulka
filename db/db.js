const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'bulka.db'));
db.pragma('foreign_keys = ON');
console.log('БД подключена: bulka.db');

module.exports = db; 