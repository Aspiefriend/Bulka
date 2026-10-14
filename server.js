require("dotenv").config();
const path = require("path");

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());

const authRoutes = require("./routes/auth");
const categoriesRoutes = require("./routes/categories");
const productsRoutes = require("./routes/products");
const cartRoutes = require("./routes/cart");
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/cart", cartRoutes);

// Root
app.get("/", (req, res) => {
  res.json({
    name: "Bulka API",
    version: "1.0.0",
    endpoints: [
      "POST /api/auth/register",
      "POST /api/auth/login",
      "GET /api/auth/me",
      "GET /api/categories",
      "GET /api/products",
      "GET /api/products/:id",
    ],
  });
});

// 404 for API
app.use((req, res) => {
  res.status(404).json({
    error: { message: "Not found", code: "NOT_FOUND" },
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("[server] error:", err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || "Internal server error",
      code: err.code || "INTERNAL",
    },
  });
});

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
