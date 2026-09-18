import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";
import { generateToken } from "../utils/jwt.js";
import crypto from "crypto";
import { generateVerificationToken } from "../utils/verification.js";
import { sendVerificationEmail } from "../services/email.service.js";

const generateReferralCode = () => {
  return `ADV${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
};

export const registerUser = async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      referralCode: incomingReferralCode,
    } = req.body;

    console.log("INCOMING REFERRAL CODE:", incomingReferralCode);

    // Check whether the email is already registered
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    // Check whether the phone number is already registered
    const existingPhone = await prisma.user.findUnique({
      where: {
        phone,
      },
    });

    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message: "Phone number is already registered",
      });
    }

    /*
     * If a referral code was supplied, make sure it belongs
     * to an existing user.
     */
    let referrer = null;

    if (incomingReferralCode) {
      console.log("REFERRAL CODE RECEIVED:", incomingReferralCode);
      console.log("LOOKING FOR:", incomingReferralCode.trim().toUpperCase());

      referrer = await prisma.user.findUnique({
        where: {
          referralCode: incomingReferralCode.trim().toUpperCase(),
        },
      });

      console.log(
        "REFERRER FOUND:",
        referrer
          ? {
              id: referrer.id,
              email: referrer.email,
              referralCode: referrer.referralCode,
            }
          : null,
      );

      if (!referrer) {
        return res.status(400).json({
          success: false,
          message: "Invalid referral code",
        });
      }
    }

    // Hash the password before storing it
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate email verification token
    const { token, tokenHash } = generateVerificationToken();

    // Verification link expires in 30 minutes
    const emailVerificationExpires = new Date(Date.now() + 30 * 60 * 1000);

    /*
     * Generate a unique referral code for the new user.
     */
    let newReferralCode = generateReferralCode();

    while (
      await prisma.user.findUnique({
        where: {
          referralCode: newReferralCode,
        },
      })
    ) {
      newReferralCode = generateReferralCode();
    }

    /*
     * Create the user, wallet, welcome bonus, and optional
     * referral inside one database transaction.
     *
     * The referral remains PENDING until the new user
     * successfully subscribes.
     */
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          phone,
          passwordHash,
          referralCode: newReferralCode,
          emailVerificationToken: tokenHash,
          emailVerificationExpires,
        },
      });

      // Create wallet with the ₦100 welcome bonus
      const wallet = await tx.wallet.create({
        data: {
          userId: user.id,
          balance: 100,
          currency: "NGN",
        },
      });

      // Record the welcome bonus as a real wallet transaction
      await tx.walletTransaction.create({
        data: {
          userId: user.id,
          walletId: wallet.id,
          type: "WELCOME_BONUS",
          amount: 100,
          currency: "NGN",
          description: "₦100 welcome bonus",
        },
      });

      /*
       * If the user registered through another user's
       * referral link, create the referral as PENDING.
       */
      if (referrer) {
        await tx.referral.create({
          data: {
            referrerId: referrer.id,
            referredUserId: user.id,
            status: "PENDING",
            rewardAmount: 100,
            rewardPaid: false,
          },
        });
      }

      return { user, wallet };
    });

    const user = result.user;

    // Build the verification link
    const verificationUrl = `${process.env.BACKEND_URL}/api/auth/verify-email?token=${token}`;

    // Send the real verification email through Resend
    await sendVerificationEmail(email, verificationUrl);

    return res.status(201).json({
      success: true,
      message:
        "Registration successful. Please check your email to verify your account.",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        referralCode: user.referralCode,
      },
    });
  } catch (error) {
    console.error("Failed to register user:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to register user",
    });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    console.log("VERIFY EMAIL REQUEST RECEIVED");

    const { token } = req.query;

    console.log("Token received:", typeof token === "string");

    if (typeof token !== "string" || !token) {
      console.log("No valid token received");

      return res.status(400).send("Invalid verification link");
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await prisma.user.findUnique({
      where: {
        emailVerificationToken: tokenHash,
      },
    });

    console.log("User found:", user ? user.email : "NO USER");

    if (!user) {
      console.log("Invalid token");

      return res.status(400).send("Invalid or expired verification link");
    }

    if (
      !user.emailVerificationExpires ||
      user.emailVerificationExpires < new Date()
    ) {
      console.log("Token expired");

      return res.status(400).send("Invalid or expired verification link");
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    const redirectUrl = `${process.env.FRONTEND_URL}/login?verified=true`;

    console.log("Email verified successfully");
    console.log("Redirecting to:", redirectUrl);

    return res.redirect(302, redirectUrl);
  } catch (error) {
    console.error("Failed to verify email:", error);

    return res.status(500).send("Failed to verify email");
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Compare the supplied password with the stored password hash
    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // User must verify their email before they can log in
    if (!user.emailVerifiedAt) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in",
      });
    }

    // Generate JWT for authenticated user
    const token = generateToken(user.id);

    return res.json({
      success: true,
      message: "Login successful",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        membershipStatus: user.membershipStatus,
        membershipExpiresAt: user.membershipExpiresAt,
        token,
      },
    });
  } catch (error) {
    console.error("Failed to login user:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to login user",
    });
  }
};
