require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === "production";

if (!isProd) {
  app.use(
    cors({
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    }),
  );
}

app.use(express.json());
app.use("/api", (req, res, next) => {
  res.set("X-Robots-Tag", "noindex, nofollow");
  next();
});

const authRoutes = require("./routes/auth");
const categoriesRoutes = require("./routes/categories");
const productsRoutes = require("./routes/products");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/orders");

const bakeriesRoutes = require("./routes/bakeries");
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/bakeries", bakeriesRoutes);
app.use("/api/orders", orderRoutes);

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

if (isProd) {
  const clientDist = path.join(__dirname, "client", "dist");

  app.use(express.static(clientDist));

  app.use((req, res, next) => {
    if (req.method !== "GET") return next();
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use((req, res) => {
  res.status(404).json({
    error: { message: "Not found", code: "NOT_FOUND" },
  });
});

app.use((err, req, res, _next) => {
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
