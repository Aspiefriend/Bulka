const express = require("express");
const db = require("../db/db");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.use(authMiddleware);

const CART_SELECT = `
  SELECT
    ci.id_product,
    ci.quantity,
    p.price
  FROM cart_items ci
  JOIN products p ON p.id_product = ci.id_product
  WHERE ci.id_user = ?
`;

const ORDER_SELECT = `
  SELECT
    o.id_order,
    o.status,
    o.total,
    o.address,
    o.id_bakery,
    o.delivery_method,
    o.payment_method,
    o.comment,
    o.created_at,
    b.name AS bakery_name,
    b.address AS bakery_address,
    b.phone AS bakery_phone
  FROM orders o
  LEFT JOIN bakeries b ON b.id_bakery = o.id_bakery
`;

router.post("/", (req, res) => {
  try {
    const id_user = req.user.id_user;
    const { address, delivery_method, payment_method, comment, id_bakery } =
      req.body;

    if (!["delivery", "pickup"].includes(delivery_method)) {
      return res.status(400).json({
        error: { message: "Invalid delivery method", code: "VALIDATION" },
      });
    }

    if (!["online", "card", "cash"].includes(payment_method)) {
      return res.status(400).json({
        error: { message: "Invalid payment method", code: "VALIDATION" },
      });
    }

    let finalAddress;
    let finalBakeryId = null;

    if (delivery_method === "delivery") {
      if (!address || !address.trim()) {
        return res.status(400).json({
          error: { message: "Address is required", code: "VALIDATION" },
        });
      }
      finalAddress = address.trim();
    } else {
      if (!id_bakery) {
        return res.status(400).json({
          error: {
            message: "Bakery is required for pickup",
            code: "VALIDATION",
          },
        });
      }

      const bakery = db
        .prepare("SELECT * FROM bakeries WHERE id_bakery = ? AND is_active = 1")
        .get(id_bakery);

      if (!bakery) {
        return res.status(404).json({
          error: { message: "Bakery not found", code: "NOT_FOUND" },
        });
      }

      finalAddress = bakery.address;
      finalBakeryId = bakery.id_bakery;
    }

    const cartItems = db.prepare(CART_SELECT).all(id_user);

    if (cartItems.length === 0) {
      return res.status(400).json({
        error: { message: "Cart is empty", code: "CART_EMPTY" },
      });
    }

    const total = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const createOrder = db.transaction(() => {
      const orderResult = db
        .prepare(
          `
        INSERT INTO orders (
          id_user, status, total, address, id_bakery,
          delivery_method, payment_method, comment
        )
        VALUES (?, 'new', ?, ?, ?, ?, ?, ?)
      `,
        )
        .run(
          id_user,
          total,
          finalAddress,
          finalBakeryId,
          delivery_method,
          payment_method,
          comment ? comment.trim() : null,
        );

      const id_order = orderResult.lastInsertRowid;

      const insertItem = db.prepare(`
        INSERT INTO order_items (id_order, id_product, quantity, price)
        VALUES (?, ?, ?, ?)
      `);

      for (const item of cartItems) {
        insertItem.run(id_order, item.id_product, item.quantity, item.price);
      }

      db.prepare("DELETE FROM cart_items WHERE id_user = ?").run(id_user);

      return id_order;
    });

    const id_order = createOrder();

    const order = db
      .prepare(`${ORDER_SELECT} WHERE o.id_order = ?`)
      .get(id_order);

    res.status(201).json({ data: order });
  } catch (err) {
    console.error("[orders] POST /", err);
    res.status(500).json({
      error: { message: "Internal server error", code: "INTERNAL" },
    });
  }
});

router.get("/", (req, res) => {
  try {
    const id_user = req.user.id_user;
    const orders = db
      .prepare(
        `
    SELECT 
      o.id_order, o.status, o.total, o.delivery_method,
      o.payment_method, o.created_at,
      (SELECT COUNT(*) FROM order_items WHERE id_order = o.id_order) AS items_count
    FROM orders o
    WHERE o.id_user = ?
    ORDER BY o.created_at DESC
  `,
      )
      .all(id_user);

    res.json({ data: orders });
  } catch (err) {
    console.error("[orders] GET /", err);
    res
      .status(500)
      .json({ error: { message: "INTERNAL SERVER ERROR", code: "INTERNAL" } });
  }
});

router.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res
      .status(400)
      .json({ error: { message: "Invalid id", code: "VALIDATION" } });
  }

  const id_user = req.user.id_user;

  const order = db
    .prepare(
      `
    SELECT 
      o.*,
      b.name AS bakery_name, b.address AS bakery_address, b.phone AS bakery_phone
    FROM orders o
    LEFT JOIN bakeries b ON b.id_bakery = o.id_bakery
    WHERE o.id_order = ? AND o.id_user = ?
  `,
    )
    .get(id, id_user);

  if (!order) {
    return res
      .status(404)
      .json({ error: { message: "Order not found", code: "NOT_FOUND" } });
  }

  const items = db
    .prepare(
      `
    SELECT 
      oi.id_product, oi.quantity, oi.price,
      p.name, p.icon
    FROM order_items oi
    JOIN products p ON p.id_product = oi.id_product
    WHERE oi.id_order = ?
  `,
    )
    .all(id);

  res.json({ data: { ...order, items } });
});

router.patch("/:id/cancel", (req, res) => {
  const id = Number(req.params.id);
  const id_user = req.user.id_user;

  const order = db
    .prepare("SELECT * FROM orders WHERE id_order = ? AND id_user = ?")
    .get(id, id_user);

  if (!order) {
    return res
      .status(404)
      .json({ error: { message: "Order not found", code: "NOT_FOUND" } });
  }

  if (!["new", "accepted"].includes(order.status)) {
    return res.status(400).json({
      error: { message: "Cannot cancel this order", code: "INVALID_STATUS" },
    });
  }

  db.prepare("UPDATE orders SET status = ? WHERE id_order = ?").run(
    "cancelled",
    id,
  );

  const updated = db.prepare(`${ORDER_SELECT} WHERE o.id_order = ?`).get(id);
  res.json({ data: updated });
});

module.exports = router;
