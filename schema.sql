-- =============================================
-- Булка — схема базы данных
-- SQLite
-- =============================================

PRAGMA foreign_keys = ON;

-- =============================================
-- 1. Пользователи
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id_user INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    is_admin INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 2. Адреса доставки
-- =============================================
CREATE TABLE IF NOT EXISTS addresses (
    id_address INTEGER PRIMARY KEY AUTOINCREMENT,
    id_user INTEGER NOT NULL,
    label TEXT NOT NULL,
    address TEXT NOT NULL,
    FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE
);

-- =============================================
-- 3. Категории
-- =============================================
CREATE TABLE IF NOT EXISTS categories (
    id_category INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    emoji TEXT
);

-- =============================================
-- 4. Товары
-- =============================================
CREATE TABLE IF NOT EXISTS products (
    id_product INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    emoji TEXT,
    id_category INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_category) REFERENCES categories(id_category) ON DELETE SET NULL
);

-- =============================================
-- 5. Заказы
-- =============================================
CREATE TABLE IF NOT EXISTS orders (
    id_order INTEGER PRIMARY KEY AUTOINCREMENT,
    id_user INTEGER NOT NULL,
    status TEXT DEFAULT 'Принят',
    total INTEGER NOT NULL,
    address TEXT,
    delivery_method TEXT DEFAULT 'Доставка',
    payment_method TEXT DEFAULT 'Карта',
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE
);

-- =============================================
-- 6. Позиции заказов
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
-- 7. Отзывы
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
-- 8. Избранное
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
-- 9. Уведомления
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
    id_notification INTEGER PRIMARY KEY AUTOINCREMENT,
    id_user INTEGER NOT NULL,
    text TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
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

-- =============================================
-- Тестовые данные: Категории
-- =============================================
INSERT INTO categories (name, emoji) VALUES
    ('Хлеб', '🍞'),
    ('Выпечка', '🥐'),
    ('Пироги', '🥧'),
    ('Сладкое', '🍰'),
    ('Напитки', '☕');

-- =============================================
-- Тестовые данные: Товары (22)
-- =============================================
INSERT INTO products (name, description, price, emoji, id_category) VALUES
    ('Хлеб бородинский', 'Ржаной, с кориандром', 89, '🍞', 1),
    ('Батон нарезной', 'Пшеничный, мягкий', 65, '🥖', 1),
    ('Булочка пшеничная', 'Мягкая, с корочкой', 45, '🥯', 1),
    ('Лаваш тонкий', 'Армянский, свежий', 70, '🫓', 1),
    ('Круассан классик', 'Слоёный, на масле', 120, '🥐', 2),
    ('Круассан с миндалём', 'С миндальным кремом', 150, '🥐', 2),
    ('Синнабон', 'С корицей и глазурью', 180, '🍩', 2),
    ('Маффин шоколадный', 'С кусочками шоколада', 140, '🧁', 2),
    ('Самса с курицей', 'Слоёная, сочная', 130, '🥟', 2),
    ('Пирог с яблоками', 'Домашний, с корицей', 450, '🥧', 3),
    ('Пирог с вишней', 'Сочный, с кислинкой', 490, '🍒', 3),
    ('Пирог с мясом', 'Сытный, с бульоном', 520, '🥩', 3),
    ('Пирог с капустой', 'Классический, с яйцом', 380, '🥬', 3),
    ('Торт «Медовик»', 'Домашний, 6 коржей', 1200, '🎂', 4),
    ('Чизкейк Нью-Йорк', 'Классический, с ягодами', 950, '🍰', 4),
    ('Эклер', 'С заварным кремом', 120, '🥮', 4),
    ('Печенье овсяное', 'С изюмом, 6 шт', 110, '🍪', 4),
    ('Тирамису', 'С маскарпоне и кофе', 320, '🍮', 4),
    ('Капучино', 'С пышной пенкой', 190, '☕', 5),
    ('Латте', 'С мягким молоком', 210, '🥛', 5),
    ('Чай с чабрецом', 'Ароматный, с мёдом', 120, '🍵', 5),
    ('Какао', 'Тёплое, с маршмеллоу', 150, '🍫', 5);

-- =============================================
-- Тестовые пользователи
-- =============================================
INSERT INTO users (email, password, name, is_admin) VALUES
    ('admin@bulka.ru', 'temp_password', 'Админ', 1),
    ('ivan@mail.ru', 'temp_password', 'Иван', 0);