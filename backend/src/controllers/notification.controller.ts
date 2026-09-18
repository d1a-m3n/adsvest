import { Response } from "express";
import prisma from "../lib/prisma.js";
import { AuthRequest } from "../middleware/auth.js";

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    if (req.userId === undefined) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
};

export const getUnreadNotificationCount = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    if (req.userId === undefined) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const count = await prisma.notification.count({
      where: {
        userId: req.userId,
        isRead: false,
      },
    });

    return res.json({
      success: true,
      data: {
        count,
      },
    });
  } catch (error) {
    console.error("Failed to fetch unread notification count:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch unread notification count",
    });
  }
};

export const markNotificationAsRead = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    if (req.userId === undefined) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const notificationId = Number(req.params.id);

    if (!Number.isInteger(notificationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: req.userId,
      },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    const updatedNotification = await prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        isRead: true,
      },
    });

    return res.json({
      success: true,
      message: "Notification marked as read",
      data: updatedNotification,
    });
  } catch (error) {
    console.error("Failed to mark notification as read:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
    });
  }
};

export const markAllNotificationsAsRead = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    if (req.userId === undefined) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    await prisma.notification.updateMany({
      where: {
        userId: req.userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
    });
  }
};
