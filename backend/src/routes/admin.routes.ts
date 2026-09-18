import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import {
  getAdminOverview,
  getAdminUsers,
  getAdminReferrals,
  updateAdminUserStatus,
  getAdminTasks,
  createAdminTask,
  updateAdminTask,
  updateAdminTaskStatus,
  deleteAdminTask,
  getAdminWithdrawals,
  updateAdminWithdrawalStatus,
  markAdminWithdrawalPaid,
} from "../controllers/admin.controller.js";

const router = Router();

router.get("/test", authenticate, requireAdmin, (req, res) => {
  res.json({
    success: true,
    message: "Admin access granted",
  });
});

router.get("/overview", authenticate, requireAdmin, getAdminOverview);

router.get("/users", authenticate, requireAdmin, getAdminUsers);

router.get("/referrals", authenticate, requireAdmin, getAdminReferrals);

router.patch(
  "/users/:id/status",
  authenticate,
  requireAdmin,
  updateAdminUserStatus,
);

router.get("/tasks", authenticate, requireAdmin, getAdminTasks);

router.post("/tasks", authenticate, requireAdmin, createAdminTask);

router.patch("/tasks/:id", authenticate, requireAdmin, updateAdminTask);

router.patch(
  "/tasks/:id/status",
  authenticate,
  requireAdmin,
  updateAdminTaskStatus,
);

router.delete("/tasks/:id", authenticate, requireAdmin, deleteAdminTask);

router.get("/withdrawals", authenticate, requireAdmin, getAdminWithdrawals);

router.patch(
  "/withdrawals/:id/status",
  authenticate,
  requireAdmin,
  updateAdminWithdrawalStatus,
);

router.patch(
  "/withdrawals/:id/paid",
  authenticate,
  requireAdmin,
  markAdminWithdrawalPaid,
);

export default router;
