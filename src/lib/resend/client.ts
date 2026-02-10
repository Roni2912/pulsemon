/**
 * Resend Email Client
 * Purpose: Configure and export Resend client for sending email alerts
 */

import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not defined in environment variables');
}

if (!process.env.EMAIL_FROM) {
  throw new Error('EMAIL_FROM is not defined in environment variables');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

export const EMAIL_FROM = process.env.EMAIL_FROM;
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
