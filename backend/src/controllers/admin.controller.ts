import { Response } from "express";
import prisma from "../lib/prisma.js";
import { AuthRequest } from "../middleware/auth.js";

export const getAdminOverview = async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalUsers,
      activeMembers,
      balanceResult,
      pendingWithdrawals,
      recentUsers,
      recentWithdrawals,
    ] = await Promise.all([
      prisma.user.count(),

      prisma.user.count({
        where: {
          membershipStatus: "ACTIVE",
        },
      }),

      prisma.wallet.aggregate({
        _sum: {
          balance: true,
        },
      }),

      prisma.withdrawal.count({
        where: {
          status: "PENDING",
        },
      }),

      prisma.user.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          membershipStatus: true,
          createdAt: true,
        },
      }),

      prisma.withdrawal.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    return res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          activeMembers,
          availableBalance: balanceResult._sum.balance ?? 0,
          pendingWithdrawals,
        },
        recentUsers,
        recentWithdrawals,
      },
    });
  } catch (error) {
    console.error("Failed to fetch admin overview:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin overview",
    });
  }
};

export const getAdminUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        emailVerifiedAt: true,
        createdAt: true,
        membershipStatus: true,
        accountStatus: true,
        membershipExpiresAt: true,

        referralsMade: {
          select: {
            id: true,
          },
        },

        earnings: {
          where: {
            status: {
              in: ["APPROVED", "PAID"],
            },
          },
          select: {
            amount: true,
          },
        },

        wallet: {
          select: {
            balance: true,
            currency: true,
          },
        },
      },
    });

    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      emailVerified: Boolean(user.emailVerifiedAt),
      createdAt: user.createdAt,
      membershipStatus: user.membershipStatus,
      accountStatus: user.accountStatus,
      membershipExpiresAt: user.membershipExpiresAt,

      referralCount: user.referralsMade.length,

      totalEarnings: user.earnings.reduce(
        (total, earning) => total + Number(earning.amount),
        0,
      ),

      walletBalance: user.wallet?.balance ? Number(user.wallet.balance) : 0,

      walletCurrency: user.wallet?.currency ?? "NGN",
    }));

    return res.json({
      success: true,
      data: formattedUsers,
    });
  } catch (error) {
    console.error("Failed to fetch admin users:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin users",
    });
  }
};

export const updateAdminUserStatus = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const userId = Number(req.params.id);
    const { accountStatus } = req.body;

    if (!Number.isInteger(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (!["ACTIVE", "SUSPENDED"].includes(accountStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid account status",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role === "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Admin accounts cannot be suspended",
      });
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        accountStatus,
      },
      select: {
        id: true,
        accountStatus: true,
      },
    });

    return res.json({
      success: true,
      message:
        accountStatus === "SUSPENDED"
          ? "User suspended successfully"
          : "User activated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Failed to update user account status:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update user account status",
    });
  }
};

export const getAdminTasks = async (req: AuthRequest, res: Response) => {
  try {
    const tasks = await prisma.opportunity.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            clicks: true,
            applications: true,
            earnings: true,
          },
        },

        earnings: {
          where: {
            status: {
              in: ["APPROVED", "PAID"],
            },
          },
          select: {
            amount: true,
            currency: true,
          },
        },
      },
    });

    const formattedTasks = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      type: task.type,
      status: task.status,
      payout: task.payout ? Number(task.payout) : null,
      currency: task.currency,
      externalUrl: task.externalUrl,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,

      clicks: task._count.clicks,
      applications: task._count.applications,

      earnings: task.earnings.reduce(
        (total, earning) => total + Number(earning.amount),
        0,
      ),

      earningsCurrency: task.earnings[0]?.currency ?? task.currency,
    }));

    return res.json({
      success: true,
      data: formattedTasks,
    });
  } catch (error) {
    console.error("Failed to fetch admin tasks:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin tasks",
    });
  }
};

export const createAdminTask = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, type, payout, currency, externalUrl } =
      req.body;

    const task = await prisma.opportunity.create({
      data: {
        title,
        description,
        type,
        payout,
        currency: currency ?? "NGN",
        externalUrl,
        status: "ACTIVE",
      },
    });

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    console.error("Failed to create admin task:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create task",
    });
  }
};

export const updateAdminTask = async (req: AuthRequest, res: Response) => {
  try {
    const taskId = Number(req.params.id);

    if (!Number.isInteger(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    const existingTask = await prisma.opportunity.findUnique({
      where: {
        id: taskId,
      },
    });

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const { title, description, type, payout, currency, externalUrl } =
      req.body;

    const task = await prisma.opportunity.update({
      where: {
        id: taskId,
      },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(type !== undefined && { type }),
        ...(payout !== undefined && { payout }),
        ...(currency !== undefined && { currency }),
        ...(externalUrl !== undefined && { externalUrl }),
      },
    });

    return res.json({
      success: true,
      message: "Task updated successfully",
      data: task,
    });
  } catch (error) {
    console.error("Failed to update admin task:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update task",
    });
  }
};

export const updateAdminTaskStatus = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const taskId = Number(req.params.id);

    if (!Number.isInteger(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    const { status } = req.body;

    if (!["ACTIVE", "PAUSED"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be ACTIVE or PAUSED",
      });
    }

    const existingTask = await prisma.opportunity.findUnique({
      where: {
        id: taskId,
      },
    });

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const task = await prisma.opportunity.update({
      where: {
        id: taskId,
      },
      data: {
        status,
      },
    });

    return res.json({
      success: true,
      message: `${
        status === "ACTIVE" ? "Task activated" : "Task paused"
      } successfully`,
      data: task,
    });
  } catch (error) {
    console.error("Failed to update admin task status:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update task status",
    });
  }
};

export const deleteAdminTask = async (req: AuthRequest, res: Response) => {
  try {
    const taskId = Number(req.params.id);

    if (!Number.isInteger(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    const existingTask = await prisma.opportunity.findUnique({
      where: {
        id: taskId,
      },
    });

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    await prisma.opportunity.delete({
      where: {
        id: taskId,
      },
    });

    return res.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete admin task:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete task",
    });
  }
};

/*
|--------------------------------------------------------------------------
| ADMIN WITHDRAWALS
|--------------------------------------------------------------------------
*/

export const getAdminWithdrawals = async (req: AuthRequest, res: Response) => {
  try {
    const withdrawals = await prisma.withdrawal.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    const formattedWithdrawals = withdrawals.map((withdrawal) => ({
      id: withdrawal.id,
      userId: withdrawal.userId,
      user: withdrawal.user,
      amount: Number(withdrawal.amount),
      currency: withdrawal.currency,
      status: withdrawal.status,
      bankName: withdrawal.bankName,
      accountNumber: withdrawal.accountNumber,
      accountName: withdrawal.accountName,
      rejectionReason: withdrawal.rejectionReason,
      createdAt: withdrawal.createdAt,
      updatedAt: withdrawal.updatedAt,
    }));

    return res.json({
      success: true,
      data: formattedWithdrawals,
    });
  } catch (error) {
    console.error("Failed to fetch admin withdrawals:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch withdrawals",
    });
  }
};

export const updateAdminWithdrawalStatus = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const withdrawalId = Number(req.params.id);
    const { status, rejectionReason } = req.body;

    if (!Number.isInteger(withdrawalId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid withdrawal ID",
      });
    }

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be APPROVED or REJECTED",
      });
    }

    if (
      status === "REJECTED" &&
      (!rejectionReason || !String(rejectionReason).trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "A rejection reason is required",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const withdrawal = await tx.withdrawal.findUnique({
        where: {
          id: withdrawalId,
        },
      });

      if (!withdrawal) {
        throw new Error("WITHDRAWAL_NOT_FOUND");
      }

      /*
       * Atomically claim the pending withdrawal.
       *
       * The update only succeeds when the withdrawal is still PENDING.
       * This prevents two admin requests from both processing the same
       * withdrawal and potentially refunding it twice.
       */
      const claimedWithdrawal = await tx.withdrawal.updateMany({
        where: {
          id: withdrawalId,
          status: "PENDING",
        },
        data:
          status === "APPROVED"
            ? {
                status: "APPROVED",
                rejectionReason: null,
              }
            : {
                status: "REJECTED",
                rejectionReason: String(rejectionReason).trim(),
              },
      });

      if (claimedWithdrawal.count !== 1) {
        throw new Error("WITHDRAWAL_ALREADY_PROCESSED");
      }

      if (status === "APPROVED") {
        const withdrawalBlockedUntil = new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        );

        await tx.user.update({
          where: {
            id: withdrawal.userId,
          },
          data: {
            withdrawalBlockedUntil,
          },
        });

        const updatedWithdrawal = await tx.withdrawal.findUnique({
          where: {
            id: withdrawalId,
          },
        });

        return {
          withdrawal: updatedWithdrawal,
          withdrawalBlockedUntil,
          refunded: false,
        };
      }

      const wallet = await tx.wallet.findUnique({
        where: {
          userId: withdrawal.userId,
        },
      });

      if (!wallet) {
        throw new Error("WALLET_NOT_FOUND");
      }

      const updatedWallet = await tx.wallet.update({
        where: {
          id: wallet.id,
        },
        data: {
          balance: {
            increment: withdrawal.amount,
          },
        },
      });

      await tx.walletTransaction.create({
        data: {
          userId: withdrawal.userId,
          walletId: wallet.id,
          type: "ADJUSTMENT",
          amount: withdrawal.amount,
          currency: withdrawal.currency,
          description: `Refund for rejected withdrawal #${withdrawal.id}`,
        },
      });

      const updatedWithdrawal = await tx.withdrawal.findUnique({
        where: {
          id: withdrawalId,
        },
      });

      return {
        withdrawal: updatedWithdrawal,
        balance: updatedWallet.balance,
        refunded: true,
      };
    });

    return res.json({
      success: true,
      message:
        status === "APPROVED"
          ? "Withdrawal approved successfully"
          : "Withdrawal rejected and funds refunded successfully",
      data: result,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "WITHDRAWAL_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Withdrawal not found",
      });
    }

    if (
      error instanceof Error &&
      error.message === "WITHDRAWAL_ALREADY_PROCESSED"
    ) {
      return res.status(400).json({
        success: false,
        message: "This withdrawal has already been processed",
      });
    }

    if (error instanceof Error && error.message === "WALLET_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "User wallet not found",
      });
    }

    console.error("Failed to update admin withdrawal:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update withdrawal",
    });
  }
};

export const markAdminWithdrawalPaid = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const withdrawalId = Number(req.params.id);

    if (!Number.isInteger(withdrawalId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid withdrawal ID",
      });
    }

    const withdrawal = await prisma.withdrawal.findUnique({
      where: {
        id: withdrawalId,
      },
    });

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal not found",
      });
    }

    const updated = await prisma.withdrawal.updateMany({
      where: {
        id: withdrawalId,
        status: "APPROVED",
      },
      data: {
        status: "PAID",
      },
    });

    if (updated.count !== 1) {
      return res.status(400).json({
        success: false,
        message: "Only approved withdrawals can be marked as paid",
      });
    }

    const updatedWithdrawal = await prisma.withdrawal.findUnique({
      where: {
        id: withdrawalId,
      },
    });

    return res.json({
      success: true,
      message: "Withdrawal marked as paid successfully",
      data: updatedWithdrawal,
    });
  } catch (error) {
    console.error("Failed to mark withdrawal as paid:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark withdrawal as paid",
    });
  }
};

export const getAdminReferrals = async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalReferrals,
      activeReferrals,
      pendingReferrals,
      rewardsResult,
      referrals,
    ] = await Promise.all([
      prisma.referral.count(),

      prisma.referral.count({
        where: {
          status: "ACTIVE",
        },
      }),

      prisma.referral.count({
        where: {
          status: "PENDING",
        },
      }),

      prisma.referral.aggregate({
        _sum: {
          rewardAmount: true,
        },
        where: {
          rewardPaid: true,
        },
      }),

      prisma.referral.findMany({
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          status: true,
          rewardAmount: true,
          rewardPaid: true,
          rewardedAt: true,
          createdAt: true,

          referrer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          referredUser: {
            select: {
              id: true,
              name: true,
              email: true,
              membershipStatus: true,
            },
          },
        },
      }),
    ]);

    return res.json({
      success: true,
      data: {
        stats: {
          totalReferrals,
          activeReferrals,
          pendingReferrals,
          totalRewards: rewardsResult._sum.rewardAmount ?? 0,
        },
        referrals,
      },
    });
  } catch (error) {
    console.error("Failed to fetch admin referrals:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin referrals",
    });
  }
};
