import { z } from "zod";

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must not exceed 100 characters")
      .optional(),

    email: z
      .string()
      .trim()
      .email("Please provide a valid email address")
      .toLowerCase(),

    phone: z
      .string()
      .trim()
      .min(10, "Phone number must be at least 10 characters")
      .max(15, "Phone number must not exceed 15 characters"),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password must not exceed 100 characters"),

    confirmPassword: z.string().min(1, "Please confirm your password"),

    referralCode: z.string().trim().toUpperCase().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address")
    .toLowerCase(),

  password: z.string().min(1, "Password is required"),
});
