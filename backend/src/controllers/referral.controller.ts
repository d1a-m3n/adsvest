import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";

export const getMyReferrals = async (req: AuthRequest, res: Response) => {
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
        referralCode: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const referrals = await prisma.referral.findMany({
      where: {
        referrerId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        referredUser: {
          select: {
            id: true,
            name: true,
            email: true,
            membershipStatus: true,
            createdAt: true,
          },
        },
      },
    });

    const totalReferrals = referrals.length;

    const activeReferrals = referrals.filter(
      (referral) => referral.status === "ACTIVE",
    ).length;

    const referralEarnings = referrals
      .filter((referral) => referral.rewardPaid)
      .reduce((total, referral) => total + Number(referral.rewardAmount), 0);

    const formattedReferrals = referrals.map((referral) => ({
      id: referral.id,
      status: referral.status,
      rewardAmount: Number(referral.rewardAmount),
      rewardPaid: referral.rewardPaid,
      rewardedAt: referral.rewardedAt,
      createdAt: referral.createdAt,
      referredUser: referral.referredUser,
    }));

    return res.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        referralLink: `${process.env.FRONTEND_URL || "http://localhost:5173"}/register?ref=${user.referralCode}`,
        stats: {
          totalReferrals,
          activeReferrals,
          referralEarnings,
        },
        referrals: formattedReferrals,
      },
    });
  } catch (error) {
    console.error("Failed to fetch referrals:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch referrals",
    });
  }
};
