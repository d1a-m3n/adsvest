import prisma from "../lib/prisma.js";
import { NotificationType } from "../generated/prisma/client.js";

interface CreateNotificationInput {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
}

export const createNotification = async ({
  userId,
  type,
  title,
  message,
}: CreateNotificationInput) => {
  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
    },
  });
};
