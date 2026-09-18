import { Router } from "express";

import {
  getOpportunities,
  createOpportunity,
  activateOpportunity,
  getOpportunityById,
  pauseOpportunity,
  startOpportunity,
  completeOpportunity,
} from "../controllers/opportunity.controller.js";

import { validateBody } from "../middleware/validate.js";
import { createOpportunitySchema } from "../validators/opportunity.validator.js";
import { authenticate } from "../middleware/auth.js";
import { requireActiveMembership } from "../middleware/membership.js";

const router = Router();

router.get("/", authenticate, requireActiveMembership, getOpportunities);

router.post(
  "/",
  authenticate,
  requireActiveMembership,
  validateBody(createOpportunitySchema),
  createOpportunity,
);

router.patch(
  "/:id/activate",
  authenticate,
  requireActiveMembership,
  activateOpportunity,
);

router.post(
  "/:id/start",
  authenticate,
  requireActiveMembership,
  startOpportunity,
);

router.post(
  "/:id/complete",
  authenticate,
  requireActiveMembership,
  completeOpportunity,
);

router.get("/:id", authenticate, requireActiveMembership, getOpportunityById);

router.patch(
  "/:id/pause",
  authenticate,
  requireActiveMembership,
  pauseOpportunity,
);

export default router;
