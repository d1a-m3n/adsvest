import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import {
  requestWithdrawal,
  getMyWithdrawals,
} from "../controllers/withdrawal.controller.js";

const router = Router();

router.get("/", authenticate, getMyWithdrawals);

router.post("/", authenticate, requestWithdrawal);

export default router;
