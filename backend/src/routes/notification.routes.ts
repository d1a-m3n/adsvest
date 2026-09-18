import { Router } from "express";
import prisma from "../lib/prisma.js";

import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../controllers/notification.controller.js";

import { authenticate, AuthRequest } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticate, getNotifications);

router.get("/unread-count", authenticate, getUnreadNotificationCount);

router.patch("/:id/read", authenticate, markNotificationAsRead);

router.patch("/read-all", authenticate, markAllNotificationsAsRead);

export default router;

router.post("/test", authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.userId === undefined) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const notification = await prisma.notification.create({
      data: {
        userId: req.userId,
        type: "SYSTEM",
        title: "Welcome to Advest",
        message: "Your notification system is working successfully!",
      },
    });

    return res.status(201).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error("Failed to create test notification:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create test notification",
    });
  }
});
