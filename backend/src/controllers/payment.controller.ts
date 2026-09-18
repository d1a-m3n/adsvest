import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";
import { initializeMembershipPayment } from "../services/paystack.service.js";

export const initializeMembership = async (req: AuthRequest, res: Response) => {
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
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.membershipStatus === "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Your membership is already active",
      });
    }

    const payment = await initializeMembershipPayment(user.email, user.id);

    return res.json({
      success: true,
      message: "Payment initialized successfully",
      data: {
        authorizationUrl: payment.authorization_url,
        accessCode: payment.access_code,
        reference: payment.reference,
      },
    });
  } catch (error) {
    console.error("Failed to initialize membership payment:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to initialize membership payment",
    });
  }
};
