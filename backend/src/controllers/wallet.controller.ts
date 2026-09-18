import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";

export const getMyWallet = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const wallet = await prisma.wallet.findUnique({
      where: {
        userId,
      },
      include: {
        transactions: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

    return res.json({
      success: true,
      data: {
        balance: wallet.balance,
        currency: wallet.currency,
        transactions: wallet.transactions,
      },
    });
  } catch (error) {
    console.error("Failed to fetch wallet:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch wallet",
    });
  }
};
