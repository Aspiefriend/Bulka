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
cron.schedule("0 3 * * *", () => {
  try {
    const result = db
      .prepare(
        `
      DELETE FROM users 
      WHERE is_active = 0 
        AND activation_deadline IS NOT NULL 
        AND activation_deadline < datetime('now')
    `,
      )
      .run();

    if (result.changes > 0) {
      console.log(
        `[cron] Удалено ${result.changes} неактивированных пользователей.`,
      );
    }
  } catch (err) {
    console.error(
      "[cron] Ошибка при очистке неактивированных пользователей:",
      err,
    );
  }
});

console.log("[cron] Планировщик задач запущен");
