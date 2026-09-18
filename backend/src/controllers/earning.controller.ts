import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";

export const getMyEarnings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const earnings = await prisma.earning.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalEarned = earnings
      .filter(
        (earning) => earning.status === "APPROVED" || earning.status === "PAID",
      )
      .reduce((total, earning) => total + Number(earning.amount), 0);

    const completedActivities = await prisma.application.count({
      where: {
        userId,
        status: "COMPLETED",
      },
    });

    return res.json({
      success: true,
      data: {
        totalEarned,
        completedActivities,
        earnings,
      },
    });
  } catch (error) {
    console.error("Failed to fetch earnings:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch earnings",
    });
  }
};
