const jwt = require("jsonwebtoken");
const db = require("../db/db");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("[middleware/auth] JWT_SECRET is not set");
  process.exit(1);
}

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: {
        message: "Требуется авторизация с подтвержденим почты",
        code: "UNAUTHORIZED",
      },
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const idUser = payload.id_user;

    const user = db
      .prepare(
        "SELECT id_user, email, name, is_admin, is_active, is_blocked FROM users WHERE id_user = ?",
      )
      .get(idUser);

    if (!user) {
      return res.status(403).json({
        error: { message: "Пользователь не найден", code: "UNAUTHORIZED" },
      });
    }

    if (user.is_active === 0) {
      return res.status(403).json({
        error: {
          message: "Для выполнения действия требуется активированный аккаунт",
          code: "EMAIL_NOT_ACTIVATED",
        },
      });
    }

    if (user.is_blocked === 1) {
      return res.status(403).json({
        error: { message: "Ваш аккаунт заблокирован", code: "ACCOUNT_BLOCKED" },
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("[authMiddleware]", err);
    return res.status(401).json({
      error: { message: "Неверный или истекший токен", code: "UNAUTHORIZED" },
    });
  }
};
