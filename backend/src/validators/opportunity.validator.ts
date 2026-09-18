import { z } from "zod";

export const createOpportunitySchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must not exceed 100 characters"),

  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must not exceed 2000 characters"),

  type: z.enum(["TASK", "SOCIAL", "APP", "OTHER"]),

  payout: z.number().nonnegative("Payout cannot be negative").optional(),

  currency: z
    .string()
    .trim()
    .length(3, "Currency must be a 3-letter code")
    .toUpperCase()
    .optional(),

  externalUrl: z.string().url("External URL must be a valid URL").optional(),
});

export const updateOpportunitySchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must not exceed 100 characters")
    .optional(),

  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must not exceed 2000 characters")
    .optional(),

  type: z.enum(["TASK", "SOCIAL", "APP", "OTHER"]).optional(),

  payout: z.number().nonnegative("Payout cannot be negative").optional(),

  currency: z
    .string()
    .trim()
    .length(3, "Currency must be a 3-letter code")
    .toUpperCase()
    .optional(),

  externalUrl: z.string().url("External URL must be a valid URL").optional(),
});
