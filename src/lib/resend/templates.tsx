/**
 * Email Templates
 * Purpose: Professional email templates for alert notifications
 * Design: Clean, minimal, modern SaaS style (Vercel/Linear inspired)
 */

import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface MonitorDownEmailProps {
  monitorName: string;
  monitorUrl: string;
  errorMessage: string;
  incidentTime: string;
  dashboardUrl: string;
}

export const MonitorDownEmail = ({
  monitorName,
  monitorUrl,
  errorMessage,
  incidentTime,
  dashboardUrl,
}: MonitorDownEmailProps) => (
  <Html>
    <Head />
    <Preview>Alert: {monitorName} is experiencing downtime</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header */}
        <Section style={header}>
          <Text style={logo}>PulseMon</Text>
        </Section>

        {/* Alert Badge */}
        <Section style={alertBadgeContainer}>
          <div style={alertBadge}>
            <span style={alertDot}>●</span>
            <span style={alertText}>Monitor Down</span>
          </div>
        </Section>

        {/* Main Content */}
        <Section style={content}>
          <Heading style={h1}>{monitorName}</Heading>
          <Text style={description}>
            Your monitor is currently experiencing downtime and is not responding to health checks.
          </Text>

          {/* Details Table */}
          <div style={detailsTable}>
            <div style={detailRow}>
              <Text style={detailLabel}>URL</Text>
              <Text style={detailValue}>{monitorUrl}</Text>
            </div>
            <Hr style={divider} />
            <div style={detailRow}>
              <Text style={detailLabel}>Error</Text>
              <Text style={detailValue}>{errorMessage}</Text>
            </div>
            <Hr style={divider} />
            <div style={detailRow}>
              <Text style={detailLabel}>Detected</Text>
              <Text style={detailValue}>{incidentTime}</Text>
            </div>
          </div>

          {/* CTA Button */}
          <Section style={buttonSection}>
            <Link href={dashboardUrl} style={button}>
              View Details
            </Link>
          </Section>
        </Section>

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            This alert was sent because you have notifications enabled for this monitor.
          </Text>
          <Text style={footerText}>
            <Link href={`${dashboardUrl.split('/dashboard')[0]}/dashboard/settings/alerts`} style={footerLink}>
              Manage alert settings
            </Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

interface MonitorRecoveryEmailProps {
  monitorName: string;
  monitorUrl: string;
  downtimeDuration: string;
  recoveryTime: string;
  dashboardUrl: string;
}

export const MonitorRecoveryEmail = ({
  monitorName,
  monitorUrl,
  downtimeDuration,
  recoveryTime,
  dashboardUrl,
}: MonitorRecoveryEmailProps) => (
  <Html>
    <Head />
    <Preview>{monitorName} has recovered</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header */}
        <Section style={header}>
          <Text style={logo}>PulseMon</Text>
        </Section>

        {/* Success Badge */}
        <Section style={alertBadgeContainer}>
          <div style={successBadge}>
            <span style={successDot}>●</span>
            <span style={successText}>Recovered</span>
          </div>
        </Section>

        {/* Main Content */}
        <Section style={content}>
          <Heading style={h1}>{monitorName}</Heading>
          <Text style={description}>
            Your monitor has recovered and is now responding normally to health checks.
          </Text>

          {/* Details Table */}
          <div style={detailsTable}>
            <div style={detailRow}>
              <Text style={detailLabel}>URL</Text>
              <Text style={detailValue}>{monitorUrl}</Text>
            </div>
            <Hr style={divider} />
            <div style={detailRow}>
              <Text style={detailLabel}>Downtime</Text>
              <Text style={detailValue}>{downtimeDuration}</Text>
            </div>
            <Hr style={divider} />
            <div style={detailRow}>
              <Text style={detailLabel}>Recovered</Text>
              <Text style={detailValue}>{recoveryTime}</Text>
            </div>
          </div>

          {/* CTA Button */}
          <Section style={buttonSection}>
            <Link href={dashboardUrl} style={button}>
              View Details
            </Link>
          </Section>
        </Section>

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            This alert was sent because you have notifications enabled for this monitor.
          </Text>
          <Text style={footerText}>
            <Link href={`${dashboardUrl.split('/dashboard')[0]}/dashboard/settings/alerts`} style={footerLink}>
              Manage alert settings
            </Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

// Styles - Modern, minimal, professional
const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '0',
  maxWidth: '600px',
};

const header = {
  padding: '32px 24px 24px',
};

const logo = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#000000',
  margin: '0',
  letterSpacing: '-0.5px',
};

const alertBadgeContainer = {
  padding: '0 24px 24px',
};

const alertBadge = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 12px',
  backgroundColor: '#fef2f2',
  borderRadius: '6px',
  border: '1px solid #fee2e2',
};

const alertDot = {
  color: '#dc2626',
  fontSize: '12px',
  lineHeight: '1',
};

const alertText = {
  color: '#991b1b',
  fontSize: '13px',
  fontWeight: '500',
  margin: '0',
};

const successBadge = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 12px',
  backgroundColor: '#f0fdf4',
  borderRadius: '6px',
  border: '1px solid #dcfce7',
};

const successDot = {
  color: '#16a34a',
  fontSize: '12px',
  lineHeight: '1',
};

const successText = {
  color: '#166534',
  fontSize: '13px',
  fontWeight: '500',
  margin: '0',
};

const content = {
  padding: '0 24px',
};

const h1 = {
  color: '#000000',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '0 0 12px',
  letterSpacing: '-0.5px',
};

const description = {
  color: '#525252',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 24px',
};

const detailsTable = {
  backgroundColor: '#fafafa',
  border: '1px solid #e5e5e5',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '24px',
};

const detailRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '16px',
};

const detailLabel = {
  color: '#737373',
  fontSize: '13px',
  fontWeight: '500',
  margin: '0',
  minWidth: '80px',
};

const detailValue = {
  color: '#171717',
  fontSize: '13px',
  margin: '0',
  wordBreak: 'break-all' as const,
  textAlign: 'right' as const,
  flex: '1',
};

const divider = {
  borderColor: '#e5e5e5',
  margin: '12px 0',
};

const buttonSection = {
  padding: '8px 0 32px',
};

const button = {
  backgroundColor: '#000000',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '500',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
  transition: 'background-color 0.2s',
};

const footer = {
  borderTop: '1px solid #e5e5e5',
  padding: '24px',
  marginTop: '8px',
};

const footerText = {
  color: '#737373',
  fontSize: '12px',
  lineHeight: '1.6',
  margin: '0 0 8px',
};

const footerLink = {
  color: '#000000',
  textDecoration: 'underline',
};
