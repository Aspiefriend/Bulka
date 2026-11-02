const express = require("express");
const db = require("../db/db");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.use(authMiddleware);

router.get("/", (req, res) => {
  try {
    const id_user = req.user.id_user;

    const favorites = db
      .prepare(
        `
      SELECT p.id_product, p.name, p.description, p.price, p.icon, 
             c.name AS category_name, c.icon AS category_icon
      FROM favorites f
      JOIN products p ON p.id_product = f.id_product
      LEFT JOIN categories c ON p.id_category = c.id_category
      WHERE f.id_user = ?
    `,
      )
      .all(id_user);

    res.json({ data: favorites });
  } catch (err) {
    console.error("[favorites] GET /", err);
    res
      .status(500)
      .json({ error: { message: "Internal server error", code: "INTERNAL" } });
  }
});

router.post("/merge", (req, res) => {
  try {
    const id_user = req.user.id_user;
    const { productIds } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.json({ data: [], warning: null });
    }

    // Вставляем только те ID, которые реально существуют в таблице products
    const mergeItem = db.prepare(`
      INSERT INTO favorites (id_user, id_product)
      SELECT ?, id_product FROM products WHERE id_product = ?
      ON CONFLICT (id_user, id_product) DO NOTHING
    `);

    const mergeFavorites = db.transaction((ids) => {
      for (const id of ids) {
        mergeItem.run(id_user, id);
      }
    });

    mergeFavorites(productIds);

    const getFavorites = db.prepare(`
      SELECT p.id_product, p.name, p.description, p.price, p.icon, 
             c.name AS category_name, c.icon AS category_icon
      FROM favorites f
      JOIN products p ON p.id_product = f.id_product
      LEFT JOIN categories c ON p.id_category = c.id_category
      WHERE f.id_user = ?
    `);

    const updatedFavorites = getFavorites.all(id_user);

    const mergedIds = updatedFavorites.map((p) => p.id_product);
    const missingItems = productIds.filter((id) => !mergedIds.includes(id));

    let warning = null;
    if (missingItems.length > 0) {
      warning = "Некоторые товары из избранного больше недоступны.";
    }

    res.json({ data: updatedFavorites, warning });
  } catch (err) {
    console.error("[favorites] POST /merge", err);
    res
      .status(500)
      .json({ error: { message: "Internal server error", code: "INTERNAL" } });
  }
});

router.post("/:productId", (req, res) => {
  try {
    const id_user = req.user.id_user;
    const { productId } = req.params;

    const product = db
      .prepare("SELECT id_product FROM products WHERE id_product = ?")
      .get(productId);
    if (!product) {
      return res
        .status(404)
        .json({ error: { message: "Product not found", code: "NOT_FOUND" } });
    }
    db.prepare(
      "INSERT OR IGNORE INTO favorites (id_user, id_product) VALUES (?, ?)",
    ).run(id_user, productId);

    res.status(201).json({ data: { message: "Added to favorites" } });
  } catch (err) {
    console.error("[favorites] POST /", err);
    res
      .status(500)
      .json({ error: { message: "Internal server error", code: "INTERNAL" } });
  }
});

router.delete("/:productId", (req, res) => {
  try {
    const id_user = req.user.id_user;
    const { productId } = req.params;

    db.prepare(
      "DELETE FROM favorites WHERE id_user = ? AND id_product = ?",
    ).run(id_user, productId);

    res.json({ data: { message: "Removed from favorites" } });
  } catch (err) {
    console.error("[favorites] DELETE /", err);
    res
      .status(500)
      .json({ error: { message: "Internal server error", code: "INTERNAL" } });
  }
});

module.exports = router;
