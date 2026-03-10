import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

// GET /api/settings/alerts - Get user's alert settings
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get alert settings
    const { data: settings, error } = await supabase
      .from('alert_settings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('ALERT_SETTINGS_FETCH_FAILED', { context: 'GET /api/settings/alerts', reason: error.message });
      return NextResponse.json({ error: 'Failed to fetch alert settings' }, { status: 500 });
    }

    return NextResponse.json({ settings });
  } catch (error: any) {
    logger.error('ALERT_SETTINGS_FETCH_FAILED', { context: 'GET /api/settings/alerts', reason: error?.message });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/settings/alerts - Create new alert setting
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      monitor_id,
      events,
      channel,
      channel_config,
      is_enabled,
      frequency,
      max_alerts_per_hour,
    } = body;

    // Validate required fields
    if (!name || !events || !channel) {
      return NextResponse.json(
        { error: 'Missing required fields: name, events, channel' },
        { status: 400 }
      );
    }

    // Create alert setting
    const { data: setting, error } = await supabase
      .from('alert_settings')
      .insert({
        user_id: user.id,
        name,
        description,
        monitor_id: monitor_id || null,
        events,
        channel,
        channel_config: channel_config || {},
        is_enabled: is_enabled !== undefined ? is_enabled : true,
        frequency: frequency || 'immediate',
        max_alerts_per_hour: max_alerts_per_hour || 10,
      })
      .select()
      .single();

    if (error) {
      logger.error('ALERT_SETTING_CREATE_FAILED', { context: 'POST /api/settings/alerts', reason: error.message });
      return NextResponse.json(
        { error: error.message || 'Failed to create alert setting' },
        { status: 500 }
      );
    }

    return NextResponse.json({ setting }, { status: 201 });
  } catch (error: any) {
    logger.error('ALERT_SETTING_CREATE_FAILED', { context: 'POST /api/settings/alerts', reason: error?.message });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/settings/alerts - Update alert setting
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing alert setting ID' }, { status: 400 });
    }

    // Update alert setting
    const { data: setting, error } = await supabase
      .from('alert_settings')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      logger.error('ALERT_SETTING_UPDATE_FAILED', { context: 'PATCH /api/settings/alerts', reason: error.message });
      return NextResponse.json(
        { error: error.message || 'Failed to update alert setting' },
        { status: 500 }
      );
    }

    if (!setting) {
      return NextResponse.json({ error: 'Alert setting not found' }, { status: 404 });
    }

    return NextResponse.json({ setting });
  } catch (error: any) {
    logger.error('ALERT_SETTING_UPDATE_FAILED', { context: 'PATCH /api/settings/alerts', reason: error?.message });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/settings/alerts - Delete alert setting
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing alert setting ID' }, { status: 400 });
    }

    // Delete alert setting
    const { error } = await supabase
      .from('alert_settings')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      logger.error('ALERT_SETTING_DELETE_FAILED', { context: 'DELETE /api/settings/alerts', reason: error.message });
      return NextResponse.json(
        { error: error.message || 'Failed to delete alert setting' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('ALERT_SETTING_DELETE_FAILED', { context: 'DELETE /api/settings/alerts', reason: error?.message });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
