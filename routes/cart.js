const express = require("express");
const db = require("../db/db");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.use(authMiddleware);
router.get("/", (req, res) => {
  try {
    const id_user = req.user.id_user;

    const cart_items = db
      .prepare(
        `
        SELECT
          c.id_cart_item,
          c.id_product,
          c.quantity,
          p.name,
          p.price,
          p.icon
        FROM cart_items c
        INNER JOIN products p ON c.id_product = p.id_product
        WHERE c.id_user = ?
        ORDER BY c.created_at
      `,
      )
      .all(id_user);

    res.json({ data: cart_items });
  } catch (err) {
    console.error("[cart] GET /", err);
    res.status(500).json({
      error: { message: "Internal server error", code: "INTERNAL" },
    });
  }
});

router.post("/", (req, res) => {
  try {
    const id_user = req.user.id_user;
    const { id_product } = req.body;

    if (!id_product) {
      return res.status(400).json({
        error: { message: "id_product is required", code: "VALIDATION" },
      });
    }

    const productId = Number(id_product);
    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({
        error: { message: "Invalid product id", code: "VALIDATION" },
      });
    }

    const product = db
      .prepare("SELECT id_product FROM products WHERE id_product = ?")
      .get(productId);

    if (!product) {
      return res.status(404).json({
        error: { message: "Product not found", code: "NOT_FOUND" },
      });
    }

    db.prepare(
      `
      INSERT INTO cart_items (id_user, id_product, quantity)
      VALUES (?, ?, 1)
      ON CONFLICT (id_user, id_product)
      DO UPDATE SET quantity = quantity + 1
    `,
    ).run(id_user, productId);

    const cartItem = db
      .prepare(
        `
        SELECT
          c.id_cart_item,
          c.id_product,
          c.quantity,
          p.name,
          p.price,
          p.icon
        FROM cart_items c
        INNER JOIN products p ON c.id_product = p.id_product
        WHERE c.id_user = ? AND c.id_product = ?
      `,
      )
      .get(id_user, productId);

    res.status(201).json({ data: cartItem });
  } catch (err) {
    console.error("[cart] POST /", err);
    res.status(500).json({
      error: { message: "Internal server error", code: "INTERNAL" },
    });
  }
});

router.patch("/:id_product", (req, res) => {
  try {
    const id_user = req.user.id_user;
    const productId = Number(req.params.id_product);

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({
        error: { message: "Invalid product id", code: "VALIDATION" },
      });
    }

    const { quantity } = req.body;
    if (quantity === undefined || quantity === null) {
      return res.status(400).json({
        error: { message: "Quantity is required", code: "VALIDATION" },
      });
    }

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({
        error: {
          message: "Quantity must be a positive integer",
          code: "VALIDATION",
        },
      });
    }

    const existing = db
      .prepare(
        "SELECT id_cart_item FROM cart_items WHERE id_user = ? AND id_product = ?",
      )
      .get(id_user, productId);

    if (!existing) {
      return res.status(404).json({
        error: { message: "Item not in cart", code: "NOT_FOUND" },
      });
    }

    db.prepare(
      "UPDATE cart_items SET quantity = ? WHERE id_user = ? AND id_product = ?",
    ).run(qty, id_user, productId);

    const cartItem = db
      .prepare(
        `
        SELECT
          c.id_cart_item,
          c.id_product,
          c.quantity,
          p.name,
          p.price,
          p.icon
        FROM cart_items c
        INNER JOIN products p ON c.id_product = p.id_product
        WHERE c.id_user = ? AND c.id_product = ?
      `,
      )
      .get(id_user, productId);

    res.json({ data: cartItem });
  } catch (err) {
    console.error("[cart] PATCH /:id_product", err);
    res.status(500).json({
      error: { message: "Internal server error", code: "INTERNAL" },
    });
  }
});

router.delete("/:id_product", (req, res) => {
  try {
    const id_user = req.user.id_user;
    const productId = Number(req.params.id_product);

    if (!Number.isInteger(productId) || productId <= 0) {
      return res
        .status(400)
        .json({ error: { message: "Invalid product id", code: "VALIDATION" } });
    }

    const existing = db
      .prepare(
        `SELECT c.id_cart_item
            FROM cart_items c
            WHERE c.id_user = ? AND c.id_product = ?
            `,
      )
      .get(id_user, productId);

    if (!existing) {
      return res
        .status(404)
        .json({ error: { message: "Item not in card", code: "NOT_FOUND" } });
    }

    db.prepare(
      `DELETE FROM cart_items
            WHERE id_user = ? AND id_product = ? `,
    ).run(id_user, productId);

    res.json({ data: { id_product: productId, removed: true } });
  } catch (err) {
    console.error("[cart] DELETE /:id_product", err);
    res
      .status(500)
      .json({ error: { message: "Internal server error", code: "INTERNAL" } });
  }
});

module.exports = router;
