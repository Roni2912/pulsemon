export const PLANS = {
  FREE: {
    name: "Free",
    monitors: 5,
    checkInterval: 5, // minutes
    historyDays: 7,
    statusPages: 1,
    teamMembers: 1,
    alertChannels: ["email"],
    price: 0,
  },
  STARTER: {
    name: "Starter",
    monitors: 10,
    checkInterval: 3,
    historyDays: 30,
    statusPages: 3,
    teamMembers: 3,
    alertChannels: ["email", "webhook"],
    price: 9,
    stripePriceId: process.env.STRIPE_PRICE_ID_STARTER,
  },
  PRO: {
    name: "Pro",
    monitors: 50,
    checkInterval: 1,
    historyDays: 90,
    statusPages: 10,
    teamMembers: 10,
    alertChannels: ["email", "webhook", "slack"],
    price: 29,
    stripePriceId: process.env.STRIPE_PRICE_ID_PRO,
  },
  BUSINESS: {
    name: "Business",
    monitors: 200,
    checkInterval: 1,
    historyDays: 365,
    statusPages: 50,
    teamMembers: 50,
    alertChannels: ["email", "webhook", "slack", "sms"],
    price: 99,
    stripePriceId: process.env.STRIPE_PRICE_ID_BUSINESS,
  },
} as const;

export type PlanType = keyof typeof PLANS;

export const CHECK_INTERVALS = [
  { value: 1, label: "1 minute" },
  { value: 3, label: "3 minutes" },
  { value: 5, label: "5 minutes" },
  { value: 10, label: "10 minutes" },
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
];

export const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];

export const MONITOR_TYPES = ["http", "https", "tcp", "ping"] as const;
export type MonitorType = (typeof MONITOR_TYPES)[number];

export const MONITOR_STATUS = {
  UP: "up",
  DOWN: "down",
  PAUSED: "paused",
  PENDING: "pending",
} as const;
export type MonitorStatus = (typeof MONITOR_STATUS)[keyof typeof MONITOR_STATUS];

export const INCIDENT_STATUS = {
  ONGOING: "ongoing",
  RESOLVED: "resolved",
} as const;

export const DEFAULT_TIMEOUT = 30000; // 30 seconds
export const MAX_TIMEOUT = 60000; // 60 seconds
export const DEFAULT_CHECK_INTERVAL = 5; // 5 minutes

export const CONSECUTIVE_FAILURES_THRESHOLD = 2; // Number of failures before marking as down

export const UPTIME_PERIODS = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  "90d": 90 * 24 * 60 * 60 * 1000,
} as const;

export const APP_NAME = "PulseMon";
export const APP_DESCRIPTION = "Monitor your websites and APIs with real-time alerts";
