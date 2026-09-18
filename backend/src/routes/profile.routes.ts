import { Router } from "express";

import {
  getMyProfile,
  saveWithdrawalAccount,
} from "../controllers/profile.controller.js";

import { authenticate } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticate, getMyProfile);

router.put("/withdrawal-account", authenticate, saveWithdrawalAccount);

export default router;
