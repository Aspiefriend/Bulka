const cron = require("node-cron");
const db = require("./db/db");
cron.schedule("* * * * *", () => {
  try {
    const now = new Date().toISOString();

    const expiredOrders = db
      .prepare(
        `
      SELECT id_order FROM orders 
      WHERE status = 'new' 
        AND payment_status = 'pending' 
        AND payment_deadline IS NOT NULL 
        AND payment_deadline < ?
    `,
      )
      .all(now);

    if (expiredOrders.length > 0) {
      const update = db.prepare(`
        UPDATE orders SET status = 'cancelled', payment_status = 'canceled' 
        WHERE id_order = ?
      `);

      for (const order of expiredOrders) {
        update.run(order.id_order);
        console.log(
          `[cron] Заказ №${order.id_order} автоматически отменён (время оплаты истекло)`,
        );
      }
    }
  } catch (err) {
    console.error("[cron] Ошибка при проверке просроченных заказов:", err);
  }
});

console.log("[cron] Планировщик задач запущен");
