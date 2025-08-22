import ampq from "amqplib";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

export const startSendOTPConsumer = async () => {
  try {
    const connection = await ampq.connect({
      protocol: "amqp",
      hostname: process.env.RABBITMQ_HOST,
      port: process.env.RABBITMQ_PORT,
      username: process.env.RABBITMQ_USER,
      password: process.env.RABBITMQ_PASS,
    });

    const channel = await connection.createChannel();
    const queueName = "send-otp";

    await channel.assertQueue(queueName, {
      durable: true,
    });
    console.log("✅ RabbitMQ MailService consumer started, Listening for otp emails...");

    channel.consume(queueName, async (msg) => {
      if (msg) {
        try {
          const { to, subject, body } = JSON.parse(msg.content.toString());

          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });

          // Read HTML template
          const templatePath = path.resolve("src/emailTemplate/otp.html");
          let htmlTemplate = fs.readFileSync(templatePath, "utf-8");

          // Replace placeholder with dynamic OTP/body
          htmlTemplate = htmlTemplate.replace("{{OTP}}", body);

          const mailOptions = {
            from: process.env.SMTP_FROM,
            to,
            subject,
            html: htmlTemplate, // ✅ use HTML template
          };

          await transporter.sendMail(mailOptions);
          console.log("✅ OTP email sent successfully to:", to);
          channel.ack(msg);
        } catch (error) {
          console.error("❌ Failed to send OTP email:", error);
        }
      }
    });
  } catch (error) {
    console.log("❌ Failed to start rabbitmq consumer", error);
  }
};
