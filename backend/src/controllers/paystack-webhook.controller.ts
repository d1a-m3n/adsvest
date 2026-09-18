import { Request, Response } from "express";
import crypto from "crypto";
import prisma from "../lib/prisma.js";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

if (!PAYSTACK_SECRET_KEY) {
  throw new Error("PAYSTACK_SECRET_KEY is not defined");
}

export const handlePaystackWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers["x-paystack-signature"];

    if (!signature || typeof signature !== "string") {
      return res.status(401).json({
        success: false,
        message: "Missing Paystack signature",
      });
    }

    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET_KEY)
      .update(req.body)
      .digest("hex");

    if (hash !== signature) {
      return res.status(401).json({
        success: false,
        message: "Invalid Paystack signature",
      });
    }

    const event = JSON.parse(req.body.toString());

    console.log("Paystack webhook received:", event.event);

    if (event.event === "charge.success") {
      const metadata = event.data.metadata;

      if (metadata?.purpose === "membership" && metadata?.userId) {
        const userId = Number(metadata.userId);

        const user = await prisma.user.findUnique({
          where: {
            id: userId,
          },
          include: {
            referral: true,
          },
        });

        if (user) {
          /*
           * Paystack can retry webhooks.
           *
           * Since our membership payment endpoint only allows payment
           * initialization when membership is inactive/expired, an already
           * active membership with a future expiry means this successful
           * payment has already been processed.
           *
           * This prevents duplicate membership extensions and duplicate
           * referral rewards from the same webhook being processed again.
           */
          if (
            user.membershipStatus === "ACTIVE" &&
            user.membershipExpiresAt &&
            user.membershipExpiresAt > new Date()
          ) {
            console.log(
              `Membership already active for user ${userId}. Skipping duplicate webhook.`,
            );

            return res.sendStatus(200);
          }

          const currentExpiry =
            user.membershipExpiresAt && user.membershipExpiresAt > new Date()
              ? user.membershipExpiresAt
              : new Date();

          const newExpiry = new Date(currentExpiry);
          newExpiry.setMonth(newExpiry.getMonth() + 1);

          await prisma.$transaction(async (tx) => {
            // 1. Activate membership for 30 days
            await tx.user.update({
              where: {
                id: userId,
              },
              data: {
                membershipStatus: "ACTIVE",
                membershipExpiresAt: newExpiry,
                paystackCustomerCode:
                  event.data.customer?.customer_code ?? null,
              },
            });

            // 2. Create membership activation notification
            await tx.notification.create({
              data: {
                userId,
                type: "SYSTEM",
                title: "Membership activated",
                message: `Your Advest membership is active until ${newExpiry.toLocaleDateString()}.`,
              },
            });

            /*
             * 3. Check whether this user was referred.
             *
             * A referral is only rewarded when the referred user
             * successfully subscribes.
             */
            const referral = await tx.referral.findUnique({
              where: {
                referredUserId: userId,
              },
            });

            if (!referral) {
              return;
            }

            /*
             * 4. Mark the referral ACTIVE only if it has not already
             * been rewarded.
             *
             * updateMany gives us a safe guard against duplicate
             * webhook processing.
             */
            const referralUpdate = await tx.referral.updateMany({
              where: {
                id: referral.id,
                status: "PENDING",
                rewardPaid: false,
              },
              data: {
                status: "ACTIVE",
                rewardPaid: true,
                rewardedAt: new Date(),
              },
            });

            /*
             * If count is 0, the referral has already been rewarded.
             * Therefore we do not add another ₦100.
             */
            if (referralUpdate.count === 0) {
              return;
            }

            // 5. Find the referrer's wallet
            const referrerWallet = await tx.wallet.findUnique({
              where: {
                userId: referral.referrerId,
              },
            });

            if (!referrerWallet) {
              throw new Error(
                `Wallet not found for referrer ${referral.referrerId}`,
              );
            }

            // 6. Add ₦100 referral reward to referrer's wallet
            await tx.wallet.update({
              where: {
                id: referrerWallet.id,
              },
              data: {
                balance: {
                  increment: referral.rewardAmount,
                },
              },
            });

            // 7. Create a real wallet transaction
            await tx.walletTransaction.create({
              data: {
                userId: referral.referrerId,
                walletId: referrerWallet.id,
                type: "REFERRAL",
                amount: referral.rewardAmount,
                currency: "NGN",
                description: `₦${referral.rewardAmount} referral reward`,
              },
            });

            // 8. Create an in-app referral notification
            await tx.notification.create({
              data: {
                userId: referral.referrerId,
                type: "REFERRAL",
                title: "Referral reward received",
                message: `You earned ₦${referral.rewardAmount} because your referral subscribed to Advest.`,
              },
            });

            console.log(
              `Referral reward of ₦${referral.rewardAmount} paid to user ${referral.referrerId} for referral ${referral.id}.`,
            );
          });
        }
      }
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error("Paystack webhook error:", error);

    return res.status(500).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
};
