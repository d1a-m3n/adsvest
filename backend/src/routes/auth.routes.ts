import { Router } from "express";
import {
  registerUser,
  loginUser,
  verifyEmail,
} from "../controllers/auth.controller.js";

import { validateBody } from "../middleware/validate.js";

import { registerSchema, loginSchema } from "../validators/auth.validator.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";

const router = Router();

router.post("/register", validateBody(registerSchema), registerUser);

router.post("/login", validateBody(loginSchema), loginUser);

router.get("/verify-email", verifyEmail);

router.get("/me", authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.userId === undefined) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        membershipStatus: true,
        membershipExpiresAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Failed to fetch authenticated user:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
});

export default router;
