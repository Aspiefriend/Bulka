const express = require("express");
const db = require("../db/db");
const authMiddleware = require("../middleware/auth");
const crypto = require("crypto");

const router = express.Router();

const shopId = process.env.YOOKASSA_SHOP_ID;
const secretKey = process.env.YOOKASSA_SECRET_KEY;
// Адрес мок-сервиса (потом поменяем на api.yookassa.ru)
const YOOKASSA_API_URL = "http://localhost:3102/v3/payments";

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.body;
    const id_user = req.user.id_user;

    const order = db
      .prepare("SELECT * FROM orders WHERE id_order = ? AND id_user = ?")
      .get(orderId, id_user);

    if (!order) {
      return res
        .status(404)
        .json({ error: { message: "Order not found", code: "NOT_FOUND" } });
    }

    if (order.payment_method !== "online") {
      return res.status(400).json({
        error: {
          message: "Order does not require online payment",
          code: "INVALID_PAYMENT",
        },
      });
    }

    const idempotenceKey = crypto.randomUUID();
    const authHeader =
      "Basic " + Buffer.from(`${shopId}:${secretKey}`).toString("base64");

    const response = await fetch(YOOKASSA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotence-Key": idempotenceKey,
        Authorization: authHeader,
      },
      body: JSON.stringify({
        amount: {
          value: order.total.toFixed(2),
          currency: "RUB",
        },
        confirmation: {
          type: "redirect",
          return_url: "http://localhost:5173/orders/" + order.id_order,
        },
        capture: true,
        description: `Payment for order #${order.id_order}`,
        metadata: {
          orderId: order.id_order.toString(),
        },
      }),
    });

    const paymentData = await response.json();

    if (!response.ok) {
      console.error("[payments] API Error:", paymentData);
      return res.status(502).json({
        error: {
          message: paymentData.description || "Payment gateway error",
          code: "PAYMENT_GATEWAY_ERROR",
        },
      });
    }

    db.prepare("UPDATE orders SET payment_id = ? WHERE id_order = ?").run(
      paymentData.id,
      order.id_order,
    );

    res.json({
      data: { confirmation_url: paymentData.confirmation.confirmation_url },
    });
  } catch (err) {
    console.error("[payments] POST /", err);
    res.status(500).json({
      error: { message: "Failed to create payment", code: "INTERNAL" },
    });
  }
});
router.post("/webhook", (req, res) => {
  try {
    const event = req.body;
    console.log("--- [PAYMENTS] Получен вебхук от ЮKassa ---");
    console.log("Событие:", event.event);
    console.log("ID платежа:", event.object?.id);

    if (event.event === "payment.succeeded") {
      const paymentId = event.object.id;

      const order = db
        .prepare("SELECT * FROM orders WHERE payment_id = ?")
        .get(paymentId);

      if (order) {
        db.prepare(
          "UPDATE orders SET payment_status = ?, status = ? WHERE id_order = ?",
        ).run("succeeded", "accepted", order.id_order);
        console.log(`[payments] Заказ №${order.id_order} успешно оплачен!`);
      } else {
        console.log(
          `[payments] Заказ с payment_id=${paymentId} не найден в БД`,
        );
      }
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("[payments] Webhook Error:", err);
    res.status(500).send("Error");
  }
});

module.exports = router;
