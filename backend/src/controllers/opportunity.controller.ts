import { Response } from "express";
import prisma from "../lib/prisma.js";
import { AuthRequest } from "../middleware/auth.js";

export const getOpportunities = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const opportunities = await prisma.opportunity.findMany({
      where: {
        status: "ACTIVE",
        applications: {
          none: {
            userId,
            status: "COMPLETED",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      data: opportunities,
    });
  } catch (error) {
    console.error("Failed to fetch opportunities:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch opportunities",
    });
  }
};

export const createOpportunity = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, type, payout, currency, externalUrl } =
      req.body;

    const opportunity = await prisma.opportunity.create({
      data: {
        title,
        description,
        type,
        payout,
        currency,
        externalUrl,
      },
    });

    return res.status(201).json({
      success: true,
      data: opportunity,
    });
  } catch (error) {
    console.error("Failed to create opportunity:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create opportunity",
    });
  }
};

export const activateOpportunity = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid opportunity ID",
      });
    }

    const opportunity = await prisma.opportunity.update({
      where: {
        id,
      },
      data: {
        status: "ACTIVE",
      },
    });

    return res.json({
      success: true,
      data: opportunity,
    });
  } catch (error) {
    console.error("Failed to activate opportunity:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to activate opportunity",
    });
  }
};

export const getOpportunityById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid opportunity ID",
      });
    }

    const opportunity = await prisma.opportunity.findFirst({
      where: {
        id,
        status: "ACTIVE",
        applications: {
          none: {
            userId,
            status: "COMPLETED",
          },
        },
      },
    });

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: "Opportunity not found",
      });
    }

    return res.json({
      success: true,
      data: opportunity,
    });
  } catch (error) {
    console.error("Failed to fetch opportunity:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch opportunity",
    });
  }
};

export const pauseOpportunity = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid opportunity ID",
      });
    }

    const opportunity = await prisma.opportunity.update({
      where: {
        id,
      },
      data: {
        status: "PAUSED",
      },
    });

    return res.json({
      success: true,
      data: opportunity,
    });
  } catch (error) {
    console.error("Failed to pause opportunity:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to pause opportunity",
    });
  }
};

export const startOpportunity = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const ipAddress = req.ip;
    const userAgent = req.get("user-agent") ?? null;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const opportunityId = Number(req.params.id);

    if (Number.isNaN(opportunityId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid opportunity ID",
      });
    }

    const opportunity = await prisma.opportunity.findFirst({
      where: {
        id: opportunityId,
        status: "ACTIVE",
      },
    });

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: "Opportunity not found",
      });
    }

    const existingApplication = await prisma.application.findUnique({
      where: {
        userId_opportunityId: {
          userId,
          opportunityId,
        },
      },
    });

    if (existingApplication?.status === "COMPLETED") {
      return res.status(400).json({
        success: false,
        message: "You have already completed this opportunity",
      });
    }

    // Record every task start as a click.
    await prisma.click.create({
      data: {
        userId,
        opportunityId,
        ipAddress: ipAddress ?? null,
        userAgent,
      },
    });

    // Every new start creates a fresh 50-second attempt.
    const application = await prisma.application.upsert({
      where: {
        userId_opportunityId: {
          userId,
          opportunityId,
        },
      },
      create: {
        userId,
        opportunityId,
        status: "PENDING",
        startedAt: new Date(),
      },
      update: {
        status: "PENDING",
        startedAt: new Date(),
      },
    });

    return res.json({
      success: true,
      message: "Opportunity started",
      data: {
        applicationId: application.id,
        opportunityId: opportunity.id,
        externalUrl: opportunity.externalUrl,
        startedAt: application.startedAt,
        returnUrl: "http://localhost:5173/opportunities",
      },
    });
  } catch (error) {
    console.error("Failed to start opportunity:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to start opportunity",
    });
  }
};

export const completeOpportunity = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const opportunityId = Number(req.params.id);

    if (Number.isNaN(opportunityId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid opportunity ID",
      });
    }

    const application = await prisma.application.findUnique({
      where: {
        userId_opportunityId: {
          userId,
          opportunityId,
        },
      },
      include: {
        opportunity: true,
      },
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Opportunity application not found",
      });
    }

    if (application.status === "COMPLETED") {
      return res.status(400).json({
        success: false,
        message: "You have already completed this opportunity",
      });
    }

    if (application.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Please start the task again before completing it",
      });
    }

    if (!application.startedAt) {
      return res.status(400).json({
        success: false,
        message: "Opportunity has not been started",
      });
    }

    if (application.opportunity.payout === null) {
      return res.status(400).json({
        success: false,
        message: "This opportunity does not have a valid payout",
      });
    }

    /*
     * The 50-second requirement is checked on the server.
     * The frontend countdown is not trusted.
     */
    const REQUIRED_SECONDS = 50;

    const elapsedSeconds =
      (Date.now() - application.startedAt.getTime()) / 1000;

    if (elapsedSeconds < REQUIRED_SECONDS) {
      await prisma.application.update({
        where: {
          id: application.id,
        },
        data: {
          status: "REJECTED",
        },
      });

      return res.status(400).json({
        success: false,
        message:
          "You returned before completing the required time. Please start the task again.",
      });
    }

    if (application.opportunity.currency !== "NGN") {
      return res.status(400).json({
        success: false,
        message:
          "This opportunity uses a currency that is not supported by the NGN wallet",
      });
    }

    const payout = application.opportunity.payout;

    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: {
          userId,
        },
      });

      if (!wallet) {
        throw new Error("Wallet not found");
      }

      /*
       * Only a PENDING application can become COMPLETED.
       * This prevents the same attempt from being paid twice.
       */
      const completedApplication = await tx.application.updateMany({
        where: {
          id: application.id,
          status: "PENDING",
        },
        data: {
          status: "COMPLETED",
        },
      });

      if (completedApplication.count !== 1) {
        throw new Error("This task attempt is no longer valid");
      }

      const earning = await tx.earning.create({
        data: {
          userId,
          opportunityId,
          amount: payout,
          currency: application.opportunity.currency,
          status: "APPROVED",
        },
      });

      const updatedWallet = await tx.wallet.update({
        where: {
          id: wallet.id,
        },
        data: {
          balance: {
            increment: payout,
          },
        },
      });

      const walletTransaction = await tx.walletTransaction.create({
        data: {
          userId,
          walletId: wallet.id,
          type: "EARNING",
          amount: payout,
          currency: application.opportunity.currency,
          description: `Earning from ${application.opportunity.title}`,
        },
      });

      return {
        earning,
        updatedWallet,
        walletTransaction,
      };
    });

    return res.json({
      success: true,
      message: "Opportunity completed successfully",
      data: {
        earning: result.earning,
        balance: result.updatedWallet.balance,
      },
    });
  } catch (error) {
    console.error("Failed to complete opportunity:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to complete opportunity",
    });
  }
};
