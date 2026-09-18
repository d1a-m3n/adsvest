import { Router } from "express";
import { initializeMembership } from "../controllers/payment.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.post("/subscribe", authenticate, initializeMembership);

export default router;
