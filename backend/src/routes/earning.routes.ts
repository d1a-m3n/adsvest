import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { getMyEarnings } from "../controllers/earning.controller.js";

const router = Router();

router.get("/", authenticate, getMyEarnings);

export default router;
