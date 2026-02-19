# Security Policy

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability in PulseMon, please report it responsibly.

### How to Report

**DO NOT** open a public issue for security vulnerabilities.

Instead, please email: **contact.pulsemon@gmail.com** with:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We'll respond within **48 hours** and work with you to:
1. Confirm the vulnerability
2. Determine the severity
3. Develop and test a fix
4. Release a security patch
5. Credit you in the release notes (if desired)

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Security Best Practices

### For Users

1. **Environment Variables**
   - Never commit `.env.local` or `.env` files
   - Use strong, unique values for `CRON_SECRET`
   - Rotate API keys regularly
   - Use separate keys for development and production

2. **Supabase Security**
   - Enable Row Level Security (RLS) on all tables
   - Use service role key only in server-side code
   - Never expose service role key to client
   - Review RLS policies regularly

3. **Stripe Security**
   - Use webhook secrets to verify events
   - Never expose secret keys to client
   - Use test mode for development
   - Monitor webhook logs for suspicious activity

4. **Resend Security**
   - Keep API key secure
   - Verify sender domain
   - Monitor email sending limits
   - Use rate limiting for alerts

5. **Deployment**
   - Use HTTPS only
   - Set secure headers (CSP, HSTS, etc.)
   - Enable CORS only for trusted domains
   - Keep dependencies updated

### For Contributors

1. **Code Review**
   - Never hardcode secrets or API keys
   - Validate all user inputs
   - Use parameterized queries
   - Sanitize data before rendering

2. **Dependencies**
   - Run `npm audit` regularly
   - Keep dependencies updated
   - Review dependency changes
   - Use lock files

3. **Authentication**
   - Use Supabase Auth for all auth flows
   - Verify user sessions on server
   - Implement proper CSRF protection
   - Use secure cookie settings

4. **API Security**
   - Validate all inputs with Zod
   - Use rate limiting
   - Implement proper error handling
   - Don't expose sensitive data in errors

## Known Security Considerations

### 1. Cron Job Authentication

The `/api/cron/check-monitors` endpoint uses a bearer token (`CRON_SECRET`) for authentication. Ensure this is:
- A strong, random string (32+ characters)
- Kept secret and rotated periodically
- Only used by your cron service

### 2. Service Role Key

The `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security. It should:
- Only be used in server-side code
- Never be exposed to the client
- Be rotated if compromised

### 3. Webhook Endpoints

Stripe webhooks are verified using `STRIPE_WEBHOOK_SECRET`. Always:
- Verify webhook signatures
- Use HTTPS endpoints
- Log webhook events
- Handle replay attacks

## Security Updates

We'll announce security updates via:
- GitHub Security Advisories
- Release notes
- Email (for critical issues)

## Acknowledgments

We appreciate responsible disclosure and will credit security researchers who report vulnerabilities (unless they prefer to remain anonymous).

---

**Last Updated:** February 2025
