const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.yandex.ru",
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendActivationEmail(to, name, activationLink) {
  const mailOptions = {
    from: `"Пекарня Булка" <${process.env.SMTP_USER}>`,
    to: to,
    subject: "Добро пожаловать в Булку! Подтвердите почту",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
        <h2 style="color: #2d4a3e;">Привет, ${name}!</h2>
        <p style="font-size: 16px; line-height: 1.5;">
          Спасибо за регистрацию в интернет-магазине «Булка».
        </p>
        <p style="font-size: 16px; line-height: 1.5;">
          Чтобы активировать аккаунт и начать заказывать свежую выпечку, перейди по ссылке:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${activationLink}" style="background-color: #2d4a3e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Подтвердить почту
          </a>
        </div>
        <p style="font-size: 14px; color: #4b5563;">
          Если кнопка не работает, скопируй эту ссылку в браузер:<br>
          <a href="${activationLink}" style="color: #2d4a3e;">${activationLink}</a>
        </p>
        <p style="font-size: 14px; color: #4b5563;">
          Ссылка действительна в течение 24 часов.<br>
          Если ты не регистрировался на нашем сайте, просто проигнорируй это письмо.
        </p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}

module.exports = { sendActivationEmail };
