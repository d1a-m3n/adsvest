import { Router } from "express";
import { handlePaystackWebhook } from "../controllers/paystack-webhook.controller.js";

const router = Router();

router.post("/", handlePaystackWebhook);

export default router;
