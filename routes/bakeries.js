const express = require("express");
const db = require("../db/db");

const router = express.Router();

router.get("/", (req, res) => {
  try {
    const bakeries = db
      .prepare("SELECT * FROM bakeries ORDER BY bakeries.id_bakery")
      .all();
    res.json({ data: bakeries });
  } catch (err) {
    console.error("[bakeries]  GET / ", err);
    res
      .status(500)
      .json({ error: { message: "INTERNAL SERVER ERROR", code: "INTERNAL" } });
  }
});

module.exports = router;
