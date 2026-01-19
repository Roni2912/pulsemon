import { z } from "zod";
import { HTTP_METHODS, MONITOR_TYPES } from "@/lib/constants";

export const monitorSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  url: z
    .string()
    .min(1, "URL is required")
    .url("Please enter a valid URL"),
  type: z.enum(MONITOR_TYPES).default("https"),
  method: z.enum(HTTP_METHODS).default("GET"),
  interval: z
    .number()
    .min(1, "Interval must be at least 1 minute")
    .max(60, "Interval must be at most 60 minutes")
    .default(5),
  timeout: z
    .number()
    .min(1000, "Timeout must be at least 1 second")
    .max(60000, "Timeout must be at most 60 seconds")
    .default(30000),
  expected_status_code: z
    .number()
    .min(100)
    .max(599)
    .optional()
    .nullable(),
  headers: z.record(z.string()).optional().nullable(),
  body: z.string().optional().nullable(),
});

export const statusPageSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(50, "Slug must be less than 50 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .nullable(),
  monitors: z.array(z.string()).min(1, "Select at least one monitor"),
  is_public: z.boolean().default(true),
  show_values: z.boolean().default(true),
});

export const alertSettingsSchema = z.object({
  email_enabled: z.boolean().default(true),
  email_address: z.string().email("Please enter a valid email").optional().nullable(),
  webhook_enabled: z.boolean().default(false),
  webhook_url: z.string().url("Please enter a valid URL").optional().nullable(),
  slack_enabled: z.boolean().default(false),
  slack_webhook_url: z.string().url("Please enter a valid Slack webhook URL").optional().nullable(),
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  full_name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

export type MonitorFormData = z.infer<typeof monitorSchema>;
export type StatusPageFormData = z.infer<typeof statusPageSchema>;
export type AlertSettingsFormData = z.infer<typeof alertSettingsSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
