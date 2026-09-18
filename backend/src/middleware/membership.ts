import { Response, NextFunction } from "express";
import prisma from "../lib/prisma.js";
import { AuthRequest } from "./auth.js";

export const requireActiveMembership = async (
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

    const now = new Date();

    // If the membership has expired, keep the database status accurate.
    if (
      user.membershipStatus === "ACTIVE" &&
      user.membershipExpiresAt !== null &&
      user.membershipExpiresAt <= now
    ) {
      await prisma.user.update({
        where: {
          id: req.userId,
        },
        data: {
          membershipStatus: "EXPIRED",
        },
      });

      return res.status(403).json({
        success: false,
        message: "Your membership has expired",
      });
    }

    const hasActiveMembership =
      user.membershipStatus === "ACTIVE" &&
      user.membershipExpiresAt !== null &&
      user.membershipExpiresAt > now;

    if (!hasActiveMembership) {
      return res.status(403).json({
        success: false,
        message: "An active membership is required to access this resource",
      });
    }

    next();
  } catch (error) {
    console.error("Membership check failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify membership",
    });
  }
};
