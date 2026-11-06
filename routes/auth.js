const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../db/db");
const { sendActivationEmail } = require("../utils/mailer");
const authMiddleware = require("../middleware/auth");
const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "for_prod_jwt_secret_string";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        error: { message: "Заполните все поля", code: "VALIDATION_ERROR" },
      });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        error: { message: "Некорректный email", code: "INVALID_EMAIL" },
      });
    }
    if (password.length < 6) {
      return res.status(400).json({
        error: { message: "Пароль слишком короткий", code: "WEAK_PASSWORD" },
      });
    }

    const existing = db
      .prepare(
        "SELECT id_user, password, is_active, is_send, activation_deadline FROM users WHERE email = ?",
      )
      .get(email);

    if (existing && existing.is_active === 1) {
      return res.status(400).json({
        error: {
          message: "Email уже зарегистрирован. Войдите.",
          code: "EMAIL_ALREADY_EXISTS",
        },
      });
    }

    if (existing && existing.is_send === 1) {
      const deadlineTime = new Date(existing.activation_deadline).getTime();
      const now = Date.now();
      if (deadlineTime > now) {
        const sentTime = deadlineTime - 24 * 60 * 60 * 1000;
        if (now - sentTime < 60 * 1000) {
          return res.status(429).json({
            error: {
              message: "Письмо уже отправлено. Подождите минуту.",
              code: "TOO_MANY_REQUESTS",
            },
          });
        }
      }
    }

    const hash = await bcrypt.hash(password, 10);
    const token = crypto.randomBytes(32).toString("hex");
    const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    let userId;
    if (existing) {
      const valid = await bcrypt.compare(password, existing.password);
      if (!valid) {
        return res.status(401).json({
          error: {
            message: "Неверный email или пароль",
            code: "INVALID_CREDENTIALS",
          },
        });
      }
    }

    if (existing) {
      db.prepare(
        "UPDATE users SET password = ?, name = ?, activation_token = ?, activation_deadline = ?, is_send = 0 WHERE id_user = ?",
      ).run(hash, name, token, deadline, existing.id_user);
      userId = existing.id_user;
    } else {
      const result = db
        .prepare(
          "INSERT INTO users (email, password, name, is_admin, is_active, activation_token, activation_deadline, is_send) VALUES (?, ?, ?, 0, 0, ?, ?, 0)",
        )
        .run(email, hash, name, token, deadline);
      userId = result.lastInsertRowid;
    }

    const activationLink = `http://project-test.ru:5173/activate?token=${token}`;

    try {
      await sendActivationEmail(email, name, activationLink);
      db.prepare("UPDATE users SET is_send = 1 WHERE id_user = ?").run(userId);
    } catch (mailErr) {
      console.error("[auth] Failed to send email:", mailErr);
      return res.status(500).json({
        error: {
          message: "Не удалось отправить письмо. Попробуйте позже.",
          code: "EMAIL_SEND_FAILED",
        },
      });
    }

    res.status(201).json({
      data: {
        message: "Регистрация успешна. Проверьте почту для активации.",
      },
    });
  } catch (err) {
    console.error("[auth] register error:", err);
    res.status(500).json({
      error: { message: "Внутренняя ошибка сервера", code: "INTERNAL_ERROR" },
    });
  }
});

router.post("/activate", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({
        error: { message: "Токен не передан", code: "VALIDATION_ERROR" },
      });
    }

    const user = db
      .prepare(
        "SELECT id_user, activation_deadline FROM users WHERE activation_token = ?",
      )
      .get(token);

    if (!user) {
      return res.status(400).json({
        error: {
          message: "Неверная или устаревшая ссылка",
          code: "INVALID_TOKEN",
        },
      });
    }

    if (new Date(user.activation_deadline) < new Date()) {
      return res.status(400).json({
        error: {
          message: "Срок действия ссылки истек. Зарегистрируйтесь заново.",
          code: "TOKEN_EXPIRED",
        },
      });
    }

    db.prepare(
      "UPDATE users SET is_active = 1, activation_token = NULL, activation_deadline = NULL WHERE id_user = ?",
    ).run(user.id_user);

    res.json({
      data: { message: "Аккаунт успешно активирован! Теперь вы можете войти." },
    });
  } catch (err) {
    console.error("[auth] activate error:", err);
    res.status(500).json({
      error: { message: "Внутренняя ошибка сервера", code: "INTERNAL_ERROR" },
    });
  }
});

router.post("/resend-activation", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        error: {
          message: "Email и пароль  обязательны",
          code: "VALIDATION_ERROR",
        },
      });
    }

    const user = db
      .prepare(
        "SELECT id_user, name, is_active, is_send, activation_deadline FROM users WHERE email = ?",
      )
      .get(email);

    if (!user) {
      return res.status(200).json({
        data: { message: "Если аккаунт существует, письмо отправлено." },
      });
    }

    if (user.is_active === 1) {
      return res.status(400).json({
        error: {
          message: "Этот аккаунт уже активирован. Войдите.",
          code: "ALREADY_ACTIVE",
        },
      });
    }
    const valid = crypto.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({
        error: {
          message: "Неверный email или пароль",
          code: "INVALID_CREDENTIALS",
        },
      });
    }

    if (user.is_send === 1) {
      const deadlineTime = new Date(user.activation_deadline).getTime();
      const now = Date.now();
      if (deadlineTime > now) {
        const sentTime = deadlineTime - 24 * 60 * 60 * 1000;
        if (now - sentTime < 60 * 1000) {
          return res.status(429).json({
            error: {
              message: "Письмо уже отправлено. Подождите минуту.",
              code: "TOO_MANY_REQUESTS",
            },
          });
        }
      }
    }

    const token = crypto.randomBytes(32).toString("hex");
    const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    db.prepare(
      "UPDATE users SET activation_token = ?, activation_deadline = ?, is_send = 0 WHERE id_user = ?",
    ).run(token, deadline, user.id_user);

    const activationLink = `http://project-test.ru:5173/activate?token=${token}`;

    try {
      await sendActivationEmail(email, user.name, activationLink);
      db.prepare("UPDATE users SET is_send = 1 WHERE id_user = ?").run(
        user.id_user,
      );
    } catch (mailErr) {
      console.error("[auth] Failed to resend email:", mailErr);
      return res.status(500).json({
        error: {
          message: "Не удалось отправить письмо. Попробуйте позже.",
          code: "EMAIL_SEND_FAILED",
        },
      });
    }

    res.json({ data: { message: "Письмо отправлено. Проверьте почту." } });
  } catch (err) {
    console.error("[auth] resend-activation error:", err);
    res.status(500).json({
      error: { message: "Внутренняя ошибка сервера", code: "INTERNAL_ERROR" },
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: {
          message: "Введите email и пароль",
          code: "VALIDATION_ERROR",
        },
      });
    }

    const user = db
      .prepare(
        "SELECT id_user, email, password, name, is_admin, is_active, is_blocked FROM users WHERE email = ?",
      )
      .get(email);

    if (!user || !user.password) {
      return res.status(401).json({
        error: {
          message: "Неверный email или пароль",
          code: "INVALID_CREDENTIALS",
        },
      });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({
        error: {
          message: "Неверный email или пароль",
          code: "INVALID_CREDENTIALS",
        },
      });
    }

    if (user.is_blocked === 1) {
      return res.status(403).json({
        error: {
          message: "Ваш аккаунт заблокирован.",
          code: "ACCOUNT_BLOCKED",
        },
      });
    }

    if (user.is_active === 0) {
      return res.status(403).json({
        error: {
          message: "Требуется подтверждение почты.",
          code: "EMAIL_NOT_ACTIVATED",
        },
      });
    }

    const token = jwt.sign(
      { id_user: user.id_user, email: user.email, is_admin: user.is_admin },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      data: {
        token,
        user: {
          id_user: user.id_user,
          email: user.email,
          name: user.name,
          is_admin: user.is_admin,
        },
      },
    });
  } catch (err) {
    console.error("[auth] login error:", err);
    res.status(500).json({
      error: { message: "Внутренняя ошибка сервера", code: "INTERNAL_ERROR" },
    });
  }
});

router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        error: { message: "Токен Google не передан", code: "VALIDATION_ERROR" },
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    if (!email) {
      return res.status(400).json({
        error: {
          message: "Google не вернул email",
          code: "INVALID_GOOGLE_TOKEN",
        },
      });
    }

    const user = db
      .prepare(
        "SELECT id_user, email, name, is_admin, is_active, is_blocked, google_id FROM users WHERE email = ?",
      )
      .get(email);

    let finalUser;

    if (user) {
      if (user.is_blocked === 1) {
        return res.status(403).json({
          error: {
            message: "Ваш аккаунт заблокирован.",
            code: "ACCOUNT_BLOCKED",
          },
        });
      }

      if (user.is_active === 1) {
        if (!user.google_id) {
          db.prepare("UPDATE users SET google_id = ? WHERE id_user = ?").run(
            googleId,
            user.id_user,
          );
        }
        finalUser = { ...user, google_id: googleId };
      } else {
        db.prepare(
          `
          UPDATE users 
          SET name = ?, is_active = 1, google_id = ?, password = NULL, activation_token = NULL, activation_deadline = NULL 
          WHERE id_user = ?
        `,
        ).run(name, googleId, user.id_user);

        finalUser = { ...user, name, is_active: 1, google_id: googleId };
      }
    } else {
      const result = db
        .prepare(
          `
        INSERT INTO users (email, password, name, is_admin, is_active, google_id) 
        VALUES (?, NULL, ?, 0, 1, ?)
      `,
        )
        .run(email, name, googleId);

      finalUser = {
        id_user: result.lastInsertRowid,
        email: email,
        name: name,
        is_admin: 0,
        is_active: 1,
      };
    }

    const token = jwt.sign(
      {
        id_user: finalUser.id_user,
        email: finalUser.email,
        is_admin: finalUser.is_admin,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      data: {
        token,
        user: {
          id_user: finalUser.id_user,
          email: finalUser.email,
          name: finalUser.name,
          is_admin: finalUser.is_admin,
        },
      },
    });
  } catch (err) {
    console.error("[auth] google auth error:", err);
    res.status(401).json({
      error: {
        message: "Не удалось авторизоваться через Google",
        code: "INVALID_GOOGLE_TOKEN",
      },
    });
  }
});

router.get("/me", authMiddleware, (req, res) => {
  res.json({ data: req.user });
});

module.exports = router;
