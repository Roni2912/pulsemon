/**
 * Alert Sending Logic
 * Purpose: Handle sending email alerts for monitor incidents
 */

import { render } from '@react-email/components';
import { resend, EMAIL_FROM, APP_URL } from './client';
import { MonitorDownEmail, MonitorRecoveryEmail } from './templates';
import { supabaseAdmin } from '@/lib/supabase/admin';

interface Monitor {
  id: string;
  name: string;
  url: string;
  user_id: string;
}

interface Incident {
  id: string;
  title: string;
  description: string;
  started_at: string;
  duration_seconds?: number;
}

/**
 * Send down alert email when a monitor goes down
 */
export async function sendDownAlert(monitor: Monitor, incident: Incident) {
  try {
    // Get user's email and alert settings
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', monitor.user_id)
      .single();

    if (!profile?.email) {
      console.error('No email found for user:', monitor.user_id);
      return { success: false, error: 'No email found' };
    }

    // Check if user has email alerts enabled for this monitor
    const { data: alertSettings } = await supabaseAdmin
      .from('alert_settings')
      .select('*')
      .eq('user_id', monitor.user_id)
      .eq('is_enabled', true)
      .eq('channel', 'email')
      .contains('events', ['monitor_down'])
      .or(`monitor_id.is.null,monitor_id.eq.${monitor.id}`)
      .limit(1)
      .single();

    if (!alertSettings) {
      console.log('No email alert settings enabled for monitor:', monitor.id);
      return { success: false, error: 'Alerts not enabled' };
    }

    // Check if alert should be sent (rate limiting, quiet hours, etc.)
    const { data: shouldSend } = await supabaseAdmin
      .rpc('should_send_alert', {
        p_alert_setting_id: alertSettings.id,
        p_event_type: 'monitor_down',
      });

    if (!shouldSend) {
      console.log('Alert rate limited or in quiet hours');
      return { success: false, error: 'Rate limited or quiet hours' };
    }

    // Render email template
    const emailHtml = render(
      MonitorDownEmail({
        monitorName: monitor.name,
        monitorUrl: monitor.url,
        errorMessage: incident.description,
        incidentTime: new Date(incident.started_at).toLocaleString(),
        dashboardUrl: `${APP_URL}/dashboard/monitors/${monitor.id}`,
      })
    );

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: profile.email,
      subject: `🔴 ${monitor.name} is down`,
      html: emailHtml,
    });

    if (error) {
      console.error('Error sending email:', error);
      
      // Log failed alert
      await supabaseAdmin.rpc('record_alert_sent', {
        p_alert_setting_id: alertSettings.id,
        p_monitor_id: monitor.id,
        p_event_type: 'monitor_down',
        p_channel: 'email',
        p_subject: `🔴 ${monitor.name} is down`,
        p_message: incident.description,
        p_status: 'failed',
        p_external_id: null,
      });

      return { success: false, error: error.message };
    }

    // Log successful alert
    await supabaseAdmin.rpc('record_alert_sent', {
      p_alert_setting_id: alertSettings.id,
      p_monitor_id: monitor.id,
      p_event_type: 'monitor_down',
      p_channel: 'email',
      p_subject: `🔴 ${monitor.name} is down`,
      p_message: incident.description,
      p_status: 'sent',
      p_external_id: data?.id || null,
    });

    console.log('Down alert sent successfully:', data?.id);
    return { success: true, emailId: data?.id };

  } catch (error: any) {
    console.error('Error in sendDownAlert:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send recovery alert email when a monitor recovers
 */
export async function sendRecoveryAlert(monitor: Monitor, incident: Incident) {
  try {
    // Get user's email and alert settings
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', monitor.user_id)
      .single();

    if (!profile?.email) {
      console.error('No email found for user:', monitor.user_id);
      return { success: false, error: 'No email found' };
    }

    // Check if user has email alerts enabled for this monitor
    const { data: alertSettings } = await supabaseAdmin
      .from('alert_settings')
      .select('*')
      .eq('user_id', monitor.user_id)
      .eq('is_enabled', true)
      .eq('channel', 'email')
      .contains('events', ['monitor_up'])
      .or(`monitor_id.is.null,monitor_id.eq.${monitor.id}`)
      .limit(1)
      .single();

    if (!alertSettings) {
      console.log('No email alert settings enabled for monitor:', monitor.id);
      return { success: false, error: 'Alerts not enabled' };
    }

    // Check if alert should be sent
    const { data: shouldSend } = await supabaseAdmin
      .rpc('should_send_alert', {
        p_alert_setting_id: alertSettings.id,
        p_event_type: 'monitor_up',
      });

    if (!shouldSend) {
      console.log('Alert rate limited or in quiet hours');
      return { success: false, error: 'Rate limited or quiet hours' };
    }

    // Format downtime duration
    const downtimeDuration = formatDuration(incident.duration_seconds || 0);

    // Render email template
    const emailHtml = render(
      MonitorRecoveryEmail({
        monitorName: monitor.name,
        monitorUrl: monitor.url,
        downtimeDuration,
        recoveryTime: new Date().toLocaleString(),
        dashboardUrl: `${APP_URL}/dashboard/monitors/${monitor.id}`,
      })
    );

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: profile.email,
      subject: `✅ ${monitor.name} has recovered`,
      html: emailHtml,
    });

    if (error) {
      console.error('Error sending email:', error);
      
      // Log failed alert
      await supabaseAdmin.rpc('record_alert_sent', {
        p_alert_setting_id: alertSettings.id,
        p_monitor_id: monitor.id,
        p_event_type: 'monitor_up',
        p_channel: 'email',
        p_subject: `✅ ${monitor.name} has recovered`,
        p_message: `Monitor recovered after ${downtimeDuration}`,
        p_status: 'failed',
        p_external_id: null,
      });

      return { success: false, error: error.message };
    }

    // Log successful alert
    await supabaseAdmin.rpc('record_alert_sent', {
      p_alert_setting_id: alertSettings.id,
      p_monitor_id: monitor.id,
      p_event_type: 'monitor_up',
      p_channel: 'email',
      p_subject: `✅ ${monitor.name} has recovered`,
      p_message: `Monitor recovered after ${downtimeDuration}`,
      p_status: 'sent',
      p_external_id: data?.id || null,
    });

    console.log('Recovery alert sent successfully:', data?.id);
    return { success: true, emailId: data?.id };

  } catch (error: any) {
    console.error('Error in sendRecoveryAlert:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Format duration in seconds to human-readable string
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours < 24) {
    return remainingMinutes > 0
      ? `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`
      : `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  return remainingHours > 0
    ? `${days} day${days !== 1 ? 's' : ''} ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`
    : `${days} day${days !== 1 ? 's' : ''}`;
}
