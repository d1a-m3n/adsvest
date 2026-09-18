import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";

export const getMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        membershipStatus: true,
        membershipExpiresAt: true,
        withdrawalAccount: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Failed to fetch profile:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};

export const saveWithdrawalAccount = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { bankName, accountNumber, accountName } = req.body;

    if (
      typeof bankName !== "string" ||
      typeof accountNumber !== "string" ||
      typeof accountName !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "All withdrawal account fields are required",
      });
    }

    const cleanedBankName = bankName.trim();
    const cleanedAccountNumber = accountNumber.trim();
    const cleanedAccountName = accountName.trim();

    if (!cleanedBankName || !cleanedAccountNumber || !cleanedAccountName) {
      return res.status(400).json({
        success: false,
        message: "All withdrawal account fields are required",
      });
    }

    if (!/^\d{10}$/.test(cleanedAccountNumber)) {
      return res.status(400).json({
        success: false,
        message: "Account number must contain exactly 10 digits",
      });
    }

    const withdrawalAccount = await prisma.withdrawalAccount.upsert({
      where: {
        userId,
      },
      update: {
        bankName: cleanedBankName,
        accountNumber: cleanedAccountNumber,
        accountName: cleanedAccountName,
      },
      create: {
        userId,
        bankName: cleanedBankName,
        accountNumber: cleanedAccountNumber,
        accountName: cleanedAccountName,
      },
    });

    return res.json({
      success: true,
      message: "Withdrawal account saved successfully",
      data: withdrawalAccount,
    });
  } catch (error) {
    console.error("Failed to save withdrawal account:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save withdrawal account",
    });
  }
};
