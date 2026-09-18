import prisma from "../lib/prisma.js";

export const expireMemberships = async () => {
  try {
    const result = await prisma.user.updateMany({
      where: {
        membershipStatus: "ACTIVE",
        membershipExpiresAt: {
          lte: new Date(),
        },
      },
      data: {
        membershipStatus: "EXPIRED",
      },
    });

    if (result.count > 0) {
      console.log(
        `Membership expiration check: ${result.count} membership(s) expired.`,
      );
    }
  } catch (error) {
    console.error("Failed to expire memberships:", error);
  }
};
