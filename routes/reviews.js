const express = require("express");
const db = require("../db/db");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.get("/:productId", (req, res) => {
  try {
    const reviews = db
      .prepare(
        `
      SELECT r.id_review, r.rating, r.text, r.created_at, u.name AS user_name
      FROM reviews r
      JOIN users u ON u.id_user = r.id_user
      WHERE r.id_product = ?
      ORDER BY r.created_at DESC
    `,
      )
      .all(req.params.productId);

    res.json({ data: reviews });
  } catch (err) {
    console.error("[reviews] GET /", err);
    res
      .status(500)
      .json({ error: { message: "Internal server error", code: "INTERNAL" } });
  }
});

router.post("/", authMiddleware, (req, res) => {
  try {
    const { productId, rating, text } = req.body;
    const id_user = req.user.id_user;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        error: {
          message: "Rating must be between 1 and 5",
          code: "VALIDATION",
        },
      });
    }

    const hasBought = db
      .prepare(
        `
      SELECT 1 FROM order_items oi
      JOIN orders o ON o.id_order = oi.id_order
      WHERE o.id_user = ? AND oi.id_product = ? AND o.status IN ('new','accepted', 'delivering', 'done')
      LIMIT 1
    `,
      )
      .get(id_user, productId);

    if (!hasBought) {
      return res.status(403).json({
        error: {
          message: "You can only review products you have bought",
          code: "NOT_BOUGHT",
        },
      });
    }

    const existing = db
      .prepare("SELECT * FROM reviews WHERE id_user = ? AND id_product = ?")
      .get(id_user, productId);

    if (existing) {
      db.prepare(
        "UPDATE reviews SET rating = ?, text = ? WHERE id_user = ? AND id_product = ?",
      ).run(rating, text, id_user, productId);
      return res.json({ data: { message: "Review updated" } });
    }

    db.prepare(
      "INSERT INTO reviews (id_user, id_product, rating, text) VALUES (?, ?, ?, ?)",
    ).run(id_user, productId, rating, text);

    res.status(201).json({ data: { message: "Review created" } });
  } catch (err) {
    console.error("[reviews] POST /", err);
    res
      .status(500)
      .json({ error: { message: "Internal server error", code: "INTERNAL" } });
  }
});

module.exports = router;
