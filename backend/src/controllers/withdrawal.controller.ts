import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";

const MIN_WITHDRAWAL = 2000;
const MAX_WITHDRAWAL = 10000;
const REQUIRED_FIRST_WITHDRAWAL_REFERRALS = 10;

export const requestWithdrawal = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { amount } = req.body;

    const withdrawalAmount = Number(amount);

    if (!Number.isFinite(withdrawalAmount)) {
      return res.status(400).json({
        success: false,
        message: "Withdrawal amount must be a valid number",
      });
    }

    if (withdrawalAmount < MIN_WITHDRAWAL) {
      return res.status(400).json({
        success: false,
        message: `Minimum withdrawal amount is ₦${MIN_WITHDRAWAL.toLocaleString()}`,
      });
    }

    if (withdrawalAmount > MAX_WITHDRAWAL) {
      return res.status(400).json({
        success: false,
        message: `Maximum withdrawal amount is ₦${MAX_WITHDRAWAL.toLocaleString()}`,
      });
    }

    if (!Number.isInteger(withdrawalAmount)) {
      return res.status(400).json({
        success: false,
        message: "Withdrawal amount must be a whole number",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          withdrawalBlockedUntil: true,
        },
      });

      if (!user) {
        throw new Error("USER_NOT_FOUND");
      }

      if (
        user.withdrawalBlockedUntil &&
        user.withdrawalBlockedUntil > new Date()
      ) {
        throw new Error(
          `WITHDRAWAL_COOLDOWN:${user.withdrawalBlockedUntil.toISOString()}`,
        );
      }
      /*
       * First-withdrawal referral requirement
       *
       * Only ACTIVE referrals count.
       * Once the user has made a withdrawal before,
       * this requirement no longer applies.
       */
      const previousWithdrawal = await tx.withdrawal.findFirst({
        where: {
          userId,
        },
        select: {
          id: true,
        },
      });

      if (!previousWithdrawal) {
        const activeReferralCount = await tx.referral.count({
          where: {
            referrerId: userId,
            status: "ACTIVE",
          },
        });

        if (activeReferralCount < REQUIRED_FIRST_WITHDRAWAL_REFERRALS) {
          throw new Error(
            `FIRST_WITHDRAWAL_REFERRAL_REQUIREMENT:${activeReferralCount}`,
          );
        }
      }

      const wallet = await tx.wallet.findUnique({
        where: {
          userId,
        },
      });

      if (!wallet) {
        throw new Error("WALLET_NOT_FOUND");
      }

      const currentBalance = Number(wallet.balance);

      if (currentBalance < withdrawalAmount) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      const withdrawalAccount = await tx.withdrawalAccount.findUnique({
        where: {
          userId,
        },
        select: {
          bankName: true,
          accountNumber: true,
          accountName: true,
        },
      });

      if (!withdrawalAccount) {
        throw new Error("WITHDRAWAL_ACCOUNT_NOT_FOUND");
      }

      const withdrawal = await tx.withdrawal.create({
        data: {
          userId,
          amount: withdrawalAmount,
          currency: "NGN",
          status: "PENDING",
          bankName: withdrawalAccount.bankName,
          accountNumber: withdrawalAccount.accountNumber,
          accountName: withdrawalAccount.accountName,
        },
      });

      const updatedWallet = await tx.wallet.update({
        where: {
          userId,
        },
        data: {
          balance: {
            decrement: withdrawalAmount,
          },
        },
      });

      await tx.walletTransaction.create({
        data: {
          userId,
          walletId: wallet.id,
          type: "WITHDRAWAL",
          amount: withdrawalAmount,
          currency: "NGN",
          description: `Withdrawal request of ₦${withdrawalAmount.toLocaleString()}`,
        },
      });

      return {
        withdrawal,
        balance: updatedWallet.balance,
      };
    });

    return res.status(201).json({
      success: true,
      message: "Withdrawal request submitted successfully",
      data: {
        withdrawal: result.withdrawal,
        balance: result.balance,
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("FIRST_WITHDRAWAL_REFERRAL_REQUIREMENT:")
    ) {
      const activeReferralCount = Number(error.message.split(":")[1]);

      const remaining =
        REQUIRED_FIRST_WITHDRAWAL_REFERRALS - activeReferralCount;

      return res.status(400).json({
        success: false,
        message: `You need ${REQUIRED_FIRST_WITHDRAWAL_REFERRALS} active referrals before making your first withdrawal. You currently have ${activeReferralCount}. You need ${remaining} more.`,
        data: {
          activeReferrals: activeReferralCount,
          requiredReferrals: REQUIRED_FIRST_WITHDRAWAL_REFERRALS,
          remainingReferrals: remaining,
        },
      });
    }

    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (
      error instanceof Error &&
      error.message.startsWith("WITHDRAWAL_COOLDOWN:")
    ) {
      const blockedUntil = error.message.split(":")[1];

      return res.status(400).json({
        success: false,
        message:
          "You cannot make another withdrawal until your 7-day withdrawal cooldown ends.",
        data: {
          withdrawalBlockedUntil: blockedUntil,
        },
      });
    }

    if (error instanceof Error && error.message === "WALLET_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

    if (error instanceof Error && error.message === "INSUFFICIENT_BALANCE") {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance",
      });
    }

    if (
      error instanceof Error &&
      error.message === "WITHDRAWAL_ACCOUNT_NOT_FOUND"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please save a withdrawal account before requesting a withdrawal",
      });
    }

    console.error("Failed to create withdrawal:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit withdrawal request",
    });
  }
};

export const getMyWithdrawals = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const withdrawals = await prisma.withdrawal.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      data: withdrawals,
    });
  } catch (error) {
    console.error("Failed to fetch withdrawals:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch withdrawals",
    });
  }
};
