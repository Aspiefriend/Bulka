const express = require("express");
const db = require("../db/db");
const authMiddleware = require("../middleware/auth");
const crypto = require("crypto");

const router = express.Router();

const shopId = process.env.YOOKASSA_SHOP_ID;
const secretKey = process.env.YOOKASSA_SECRET_KEY;
const YOOKASSA_API_URL = "http://localhost:3102/v3/payments";
const authHeader =
  "Basic " + Buffer.from(`${shopId}:${secretKey}`).toString("base64");

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.body;
    const id_user = req.user.id_user;

    if (!shopId || !secretKey) {
      return res.status(500).json({
        error: {
          message: "Payment system is not configured",
          code: "INTERNAL",
        },
      });
    }

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

    if (order.payment_status !== "pending") {
      return res.status(400).json({
        error: {
          message: "Order is already paid or canceled",
          code: "INVALID_PAYMENT_STATUS",
        },
      });
    }

    const now = new Date().toISOString();
    if (order.payment_deadline && order.payment_deadline < now) {
      return res.status(400).json({
        error: {
          message: "Payment deadline expired",
          code: "DEADLINE_EXPIRED",
        },
      });
    }

    if (order.payment_id) {
      const response = await fetch(
        `http://localhost:3102/v3/payments/${order.payment_id}`,
        { headers: { Authorization: authHeader } },
      );

      if (response.ok) {
        const paymentData = await response.json();
        if (paymentData.status === "pending") {
          return res.json({
            data: {
              confirmation_url: paymentData.confirmation.confirmation_url,
            },
          });
        }
      }
    }

    const idempotenceKey = crypto.randomUUID();
    const response = await fetch(YOOKASSA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotence-Key": idempotenceKey,
        Authorization: authHeader,
      },
      body: JSON.stringify({
        amount: { value: order.total.toFixed(2), currency: "RUB" },
        confirmation: {
          type: "redirect",
          return_url: "http://localhost:5173/orders/" + order.id_order,
        },
        capture: true,
        description: `Payment for order #${order.id_order}`,
        metadata: { orderId: order.id_order.toString() },
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
router.post("/webhook", async (req, res) => {
  try {
    const event = req.body;

    if (event.event !== "payment.succeeded") {
      return res.status(200).send("OK");
    }

    const paymentId = event.object.id;
    const order = db
      .prepare("SELECT * FROM orders WHERE payment_id = ?")
      .get(paymentId);

    if (!order) {
      console.error(
        `[webhook] CRITICAL: Orphan payment! Оплата ${paymentId} есть, а заказа в БД нет.`,
      );
      return res.status(200).send("OK");
    }

    if (
      order.payment_status === "succeeded" ||
      order.payment_status === "canceled"
    ) {
      console.log(
        `[webhook] ⚠️ Требуется возврат для заказа №${order.id_order} (payment_status: ${order.payment_status})`,
      );

      const idempotenceKey = crypto.randomUUID();

      const refundResponse = await fetch("http://localhost:3102/v3/refunds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotence-Key": idempotenceKey,
          Authorization: authHeader,
        },
        body: JSON.stringify({
          payment_id: paymentId,
          amount: { value: event.object.amount.value, currency: "RUB" },
        }),
      });

      const refundData = await refundResponse.json();

      if (refundResponse.ok) {
        db.prepare(
          "UPDATE orders SET payment_status = ? WHERE id_order = ?",
        ).run("refunded", order.id_order);
        console.log(
          `[webhook] ✅ Возврат для заказа №${order.id_order} выполнен.`,
        );
        return res.status(200).send("OK");
      } else {
        console.error(
          `[webhook] ❌ Ошибка возврата для заказа №${order.id_order}:`,
          refundData,
        );
        return res.status(500).send("Refund failed");
      }
    }
    db.prepare(
      "UPDATE orders SET payment_status = ?, status = ? WHERE id_order = ?",
    ).run("succeeded", "accepted", order.id_order);

    console.log(`[webhook] Заказ №${order.id_order} успешно оплачен!`);
    res.status(200).send("OK");
  } catch (err) {
    console.error("[webhook] Ошибка:", err);
    res.status(500).send("Internal Server Error");
  }
});
router.post("/sync/:orderId", authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const id_user = req.user.id_user;

    const order = db
      .prepare("SELECT * FROM orders WHERE id_order = ? AND id_user = ?")
      .get(orderId, id_user);

    if (!order) {
      return res
        .status(404)
        .json({ error: { message: "Order not found", code: "NOT_FOUND" } });
    }

    if (!order.payment_id || order.payment_status === "succeeded") {
      return res.json({ data: order });
    }

    const response = await fetch(
      `http://localhost:3102/v3/payments/${order.payment_id}`,
      {
        headers: { Authorization: authHeader },
      },
    );

    if (response.ok) {
      const paymentData = await response.json();

      if (paymentData.status === "succeeded") {
        db.prepare(
          "UPDATE orders SET payment_status = ?, status = ? WHERE id_order = ?",
        ).run("succeeded", "accepted", order.id_order);
        console.log(
          `[payments] Заказ №${order.id_order} синхронизирован (оплачен)`,
        );
      }
    }

    const updatedOrder = db
      .prepare("SELECT * FROM orders WHERE id_order = ?")
      .get(orderId);
    res.json({ data: updatedOrder });
  } catch (err) {
    console.error("[payments] Sync Error:", err);
    res
      .status(500)
      .json({ error: { message: "Sync failed", code: "INTERNAL" } });
  }
});

module.exports = router;
