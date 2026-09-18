import { Response, NextFunction } from "express";
import prisma from "../lib/prisma.js";
import { AuthRequest } from "./auth.js";

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (req.userId === undefined) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.userId,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    next();
  } catch (error) {
    console.error("Admin authorization failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify admin access",
    });
  }
};
