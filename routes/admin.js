const express = require("express");
const db = require("../db/db");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

function adminMiddleware(req, res, next) {
  const user = db
    .prepare("SELECT is_admin FROM users WHERE id_user = ?")
    .get(req.user.id_user);
  if (!user || user.is_admin !== 1) {
    return res
      .status(403)
      .json({ error: { message: "Access denied", code: "FORBIDDEN" } });
  }
  next();
}

router.use(authMiddleware);
router.use(adminMiddleware);

router.get("/orders", (req, res) => {
  try {
    let rangeStart = 0;
    let rangeEnd = 9;

    if (req.query.range) {
      const range = JSON.parse(req.query.range);
      rangeStart = range[0];
      rangeEnd = range[1];
    }

    const limit = rangeEnd - rangeStart + 1;
    const offset = rangeStart;

    const orders = db
      .prepare(
        `
      SELECT o.id_order AS id, o.status, o.total, o.created_at AS createdAt, 
             o.address, o.delivery_method, o.payment_method, 
             u.name AS user_name, u.email
      FROM orders o
      JOIN users u ON u.id_user = o.id_user
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `,
      )
      .all(limit, offset);

    const total = db
      .prepare("SELECT COUNT(*) as count FROM orders")
      .get().count;

    res.set(
      "Content-Range",
      `orders ${offset}-${offset + orders.length - 1}/${total}`,
    );
    res.json(orders);
  } catch (err) {
    console.error("[admin] GET /orders", err);
    res
      .status(500)
      .json({ error: { message: "Internal server error", code: "INTERNAL" } });
  }
});

router.get("/orders/:id", (req, res) => {
  try {
    const order = db
      .prepare(
        `
      SELECT o.id_order AS id, o.status, o.total, o.created_at AS createdAt, 
             o.address, o.delivery_method, o.payment_method,
             u.name AS user_name, u.email
      FROM orders o
      JOIN users u ON u.id_user = o.id_user
      WHERE o.id_order = ?
    `,
      )
      .get(req.params.id);

    if (!order) {
      return res
        .status(404)
        .json({ error: { message: "Order not found", code: "NOT_FOUND" } });
    }

    res.json(order);
  } catch (err) {
    res
      .status(500)
      .json({ error: { message: "Internal server error", code: "INTERNAL" } });
  }
});

router.put("/orders/:id", (req, res) => {
  try {
    const { status } = req.body;

    db.prepare("UPDATE orders SET status = ? WHERE id_order = ?").run(
      status,
      req.params.id,
    );

    const updated = db
      .prepare(
        "SELECT o.id_order AS id, o.status, o.total FROM orders o WHERE o.id_order = ?",
      )
      .get(req.params.id);
    res.json(updated);
  } catch (err) {
    res
      .status(500)
      .json({ error: { message: "Internal server error", code: "INTERNAL" } });
  }
});

router.get("/categories", (req, res) => {
  try {
    let rangeStart = 0;
    let rangeEnd = 9;

    if (req.query.range) {
      const range = JSON.parse(req.query.range);
      rangeStart = range[0];
      rangeEnd = range[1];
    }

    const limit = rangeEnd - rangeStart + 1;
    const offset = rangeStart;

    const categories = db
      .prepare(
        `
      SELECT id_category AS id, name, icon, is_active 
      FROM categories 
      LIMIT ? OFFSET ?
    `,
      )
      .all(limit, offset);

    const total = db
      .prepare("SELECT COUNT(*) as count FROM categories")
      .get().count;

    res.set(
      "Content-Range",
      `categories ${offset}-${offset + categories.length - 1}/${total}`,
    );
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/categories/:id", (req, res) => {
  try {
    const category = db
      .prepare(
        `
      SELECT id_category AS id, name, icon, is_active 
      FROM categories 
      WHERE id_category = ?
    `,
      )
      .get(req.params.id);

    if (!category) return res.status(404).json({ error: "Not found" });
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/categories/:id", (req, res) => {
  try {
    const { name, icon, is_active } = req.body;

    db.prepare(
      `
      UPDATE categories 
      SET name = ?, icon = ?, is_active = ? 
      WHERE id_category = ?
    `,
    ).run(name, icon || null, is_active ? 1 : 0, req.params.id);

    const updated = db
      .prepare(
        `
      SELECT id_category AS id, name, icon, is_active 
      FROM categories 
      WHERE id_category = ?
    `,
      )
      .get(req.params.id);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/categories", (req, res) => {
  try {
    const { name, icon, is_active } = req.body;

    const result = db
      .prepare(
        `
      INSERT INTO categories (name, icon, is_active) 
      VALUES (?, ?, ?)
    `,
      )
      .run(name, icon || null, is_active ? 1 : 0);

    const newCategory = db
      .prepare(
        `
      SELECT id_category AS id, name, icon, is_active 
      FROM categories 
      WHERE id_category = ?
    `,
      )
      .get(result.lastInsertRowid);

    res.status(201).json({ data: newCategory });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/products", (req, res) => {
  try {
    let rangeStart = 0;
    let rangeEnd = 9;

    if (req.query.range) {
      const range = JSON.parse(req.query.range);
      rangeStart = range[0];
      rangeEnd = range[1];
    }

    const limit = rangeEnd - rangeStart + 1;
    const offset = rangeStart;

    const products = db
      .prepare(
        `
      SELECT p.id_product AS id, p.name, p.price, p.description, p.icon, p.is_active, p.id_category,
             c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON c.id_category = p.id_category
      LIMIT ? OFFSET ?
    `,
      )
      .all(limit, offset);

    const total = db
      .prepare("SELECT COUNT(*) as count FROM products")
      .get().count;

    res.set(
      "Content-Range",
      `products ${offset}-${offset + products.length - 1}/${total}`,
    );
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/products/:id", (req, res) => {
  try {
    const product = db
      .prepare(
        `
      SELECT id_product AS id, name, price, description, icon, is_active, id_category 
      FROM products WHERE id_product = ?
    `,
      )
      .get(req.params.id);

    if (!product) return res.status(404).json({ error: "Not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/products/:id", (req, res) => {
  try {
    const { name, price, description, icon, is_active, id_category } = req.body;

    db.prepare(
      `
      UPDATE products 
      SET name = ?, price = ?, description = ?, icon = ?, is_active = ?, id_category = ? 
      WHERE id_product = ?
    `,
    ).run(
      name,
      price,
      description,
      icon || null,
      is_active ? 1 : 0,
      id_category || null,
      req.params.id,
    );

    const updated = db
      .prepare(
        "SELECT id_product AS id, name, price, description, icon, is_active, id_category FROM products WHERE id_product = ?",
      )
      .get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/products", (req, res) => {
  try {
    const { name, price, description, icon, is_active, id_category } = req.body;

    const result = db
      .prepare(
        `
      INSERT INTO products (name, price, description, icon, is_active, id_category) 
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      )
      .run(
        name,
        price,
        description || null,
        icon || null,
        is_active ? 1 : 0,
        id_category || null,
      );

    const newProduct = db
      .prepare(
        "SELECT id_product AS id, name, price, description, icon, is_active, id_category FROM products WHERE id_product = ?",
      )
      .get(result.lastInsertRowid);
    res.status(201).json({ data: newProduct });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/bakeries", (req, res) => {
  try {
    let rangeStart = 0;
    let rangeEnd = 9;

    if (req.query.range) {
      const range = JSON.parse(req.query.range);
      rangeStart = range[0];
      rangeEnd = range[1];
    }

    const limit = rangeEnd - rangeStart + 1;
    const offset = rangeStart;

    const bakeries = db
      .prepare(
        `
      SELECT id_bakery AS id, name, address, phone, work_hours, is_active
      FROM bakeries 
      LIMIT ? OFFSET ?
    `,
      )
      .all(limit, offset);

    const total = db
      .prepare("SELECT COUNT(*) as count FROM bakeries")
      .get().count;

    res.set(
      "Content-Range",
      `bakeries ${offset}-${offset + bakeries.length - 1}/${total}`,
    );
    res.json(bakeries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/bakeries/:id", (req, res) => {
  try {
    const bakery = db
      .prepare(
        `
      SELECT id_bakery AS id, name, address, phone, work_hours, is_active
      FROM bakeries WHERE id_bakery = ?
    `,
      )
      .get(req.params.id);

    if (!bakery) return res.status(404).json({ error: "Not found" });
    res.json(bakery);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/bakeries/:id", (req, res) => {
  try {
    const { name, address, phone, work_hours, is_active } = req.body;

    db.prepare(
      `
      UPDATE bakeries 
      SET name = ?, address = ?, phone = ?, work_hours = ?, is_active = ?
      WHERE id_bakery = ?
    `,
    ).run(
      name,
      address,
      phone || null,
      work_hours || null,
      is_active ? 1 : 0,
      req.params.id,
    );

    const updated = db
      .prepare(
        `
      SELECT id_bakery AS id, name, address, phone, work_hours, is_active
      FROM bakeries WHERE id_bakery = ?
    `,
      )
      .get(req.params.id);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/bakeries", (req, res) => {
  try {
    const { name, address, phone, work_hours, is_active } = req.body;

    const result = db
      .prepare(
        `
      INSERT INTO bakeries (name, address, phone, work_hours, is_active)
      VALUES (?, ?, ?, ?, ?)
    `,
      )
      .run(name, address, phone || null, work_hours || null, is_active ? 1 : 0);

    const newBakery = db
      .prepare(
        `
      SELECT id_bakery AS id, name, address, phone, work_hours, is_active
      FROM bakeries WHERE id_bakery = ?
    `,
      )
      .get(result.lastInsertRowid);

    res.status(201).json({ data: newBakery });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/users", (req, res) => {
  try {
    let rangeStart = 0;
    let rangeEnd = 9;

    if (req.query.range) {
      const range = JSON.parse(req.query.range);
      rangeStart = range[0];
      rangeEnd = range[1];
    }

    const limit = rangeEnd - rangeStart + 1;
    const offset = rangeStart;

    const users = db
      .prepare(
        `
      SELECT id_user AS id, email, name, is_admin, is_active, created_at
      FROM users 
      LIMIT ? OFFSET ?
    `,
      )
      .all(limit, offset);

    const total = db.prepare("SELECT COUNT(*) as count FROM users").get().count;

    res.set(
      "Content-Range",
      `users ${offset}-${offset + users.length - 1}/${total}`,
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/users/:id", (req, res) => {
  try {
    const user = db
      .prepare(
        `
      SELECT id_user AS id, email, name, is_admin, is_active 
      FROM users WHERE id_user = ?
    `,
      )
      .get(req.params.id);

    if (!user) return res.status(404).json({ error: "Not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/users/:id", (req, res) => {
  try {
    const { name, is_admin, is_active } = req.body;

    db.prepare(
      `
      UPDATE users 
      SET name = ?, is_admin = ?, is_active = ? 
      WHERE id_user = ?
    `,
    ).run(name, is_admin ? 1 : 0, is_active ? 1 : 0, req.params.id);

    const updated = db
      .prepare(
        `
      SELECT id_user AS id, email, name, is_admin, is_active 
      FROM users WHERE id_user = ?
    `,
      )
      .get(req.params.id);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
