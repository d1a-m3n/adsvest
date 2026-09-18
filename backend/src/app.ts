import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./lib/prisma.js";
import opportunityRoutes from "./routes/opportunity.routes.js";
import authRoutes from "./routes/auth.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import paystackWebhookRoutes from "./routes/paystack-webhook.routes.js";
import { expireMemberships } from "./services/membership.service.js";
import walletRoutes from "./routes/wallet.routes.js";
import earningRoutes from "./routes/earning.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import withdrawalRoutes from "./routes/withdrawal.routes.js";
import referralRoutes from "./routes/referral.routes.js";
import adminRoutes from "./routes/admin.routes.js";

dotenv.config();

const app = express();


app.use(cors());

app.use(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  paystackWebhookRoutes,
);

app.use(express.json());
app.use("/api/wallet", walletRoutes);
app.use("/api/earnings", earningRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/withdrawals", withdrawalRoutes);
app.use("/api/referrals", referralRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/opportunities", opportunityRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payments", paymentRoutes);

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      success: true,
      message: "Advest backend is running",
      database: "connected",
    });
  } catch (error) {
    console.error("Database connection failed:", error);

    res.status(500).json({
      success: false,
      message: "Advest backend is running, but database connection failed",
    });
  }
});

export default app;