import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { getMyWallet } from "../controllers/wallet.controller.js";

const router = Router();

router.get("/", authenticate, getMyWallet);

export default router;
