-- =============================================
-- Булка — схема базы данных
-- SQLite
-- =============================================
-- Соглашения:
--   - price, total — целые числа, в рублях
--   - status, delivery_method, payment_method — английские коды,
--     тексты для UI формируются на фронте
--   - icon — имя иконки Lucide (например 'bread', 'croissant')
-- =============================================

PRAGMA foreign_keys = ON;
-- =============================================
-- Пользователи
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id_user INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    is_admin INTEGER NOT NULL DEFAULT 0 ,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- =============================================
-- Адреса
-- =============================================
CREATE TABLE IF NOT EXISTS addresses (
    id_address INTEGER PRIMARY KEY AUTOINCREMENT,
    id_user INTEGER NOT NULL,
    label TEXT NOT NULL,
    address TEXT NOT NULL,
    FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE
);

-- =============================================
-- Категории товаров
-- =============================================
CREATE TABLE IF NOT EXISTS categories (
    id_category INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT
);

-- =============================================
-- Товары
-- =============================================
CREATE TABLE IF NOT EXISTS products (
    id_product INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,  -- цена в рублях
    icon TEXT,
    id_category INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_category) REFERENCES categories(id_category) ON DELETE SET NULL
);

-- =============================================
-- Заказы
-- =============================================
CREATE TABLE IF NOT EXISTS orders (
    id_order INTEGER PRIMARY KEY AUTOINCREMENT,
    id_user INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'accepted', 'cooking', 'delivering', 'done', 'cancelled')),
    total INTEGER NOT NULL,
    address TEXT,
    delivery_method TEXT NOT NULL DEFAULT 'delivery'
    CHECK(delivery_method IN('delivery','pickup')),
    payment_method TEXT NOT NULL DEFAULT 'card'
    CHECK(payment_method IN('card','online','cash')),
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE
);

-- =============================================
-- Состав заказа
-- =============================================
CREATE TABLE IF NOT EXISTS order_items (
    id_order_item INTEGER PRIMARY KEY AUTOINCREMENT,
    id_order INTEGER NOT NULL,
    id_product INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price INTEGER NOT NULL,
    FOREIGN KEY (id_order) REFERENCES orders(id_order) ON DELETE CASCADE,
    FOREIGN KEY (id_product) REFERENCES products(id_product) ON DELETE CASCADE
);

-- =============================================
-- Отзывы
-- =============================================
CREATE TABLE IF NOT EXISTS reviews (
    id_review INTEGER PRIMARY KEY AUTOINCREMENT,
    id_user INTEGER NOT NULL,
    id_product INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE,
    FOREIGN KEY (id_product) REFERENCES products(id_product) ON DELETE CASCADE,
    UNIQUE (id_user, id_product)
);

-- =============================================
-- Избранное
-- =============================================
CREATE TABLE IF NOT EXISTS favorites (
    id_favorite INTEGER PRIMARY KEY AUTOINCREMENT,
    id_user INTEGER NOT NULL,
    id_product INTEGER NOT NULL,
    FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE,
    FOREIGN KEY (id_product) REFERENCES products(id_product) ON DELETE CASCADE,
    UNIQUE (id_user, id_product)
);

-- =============================================
-- Уведомления
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
    id_notification INTEGER PRIMARY KEY AUTOINCREMENT,
    id_user INTEGER NOT NULL,
    text TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE
);
-- =============================================
-- Индексы
-- =============================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(id_category);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(id_user);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(id_order);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(id_product);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(id_user);




