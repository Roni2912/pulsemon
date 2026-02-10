/**
 * Database Seed Script
 * Creates a test user with sample monitors, checks, and incidents
 * Run with: npm run db:seed
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../src/types/supabase';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

const TEST_USER = {
  email: 'test@pulsemon.com',
  password: 'test123456',
  id: '00000000-0000-0000-0000-000000000000',
};

async function seed() {
  console.log('🌱 Starting database seed...\n');

  // Use a fixed UUID for the test user
  const userId = TEST_USER.id;

  console.log('👤 Using test user ID:', userId);

  // 1. Create or update profile directly (skip auth user creation)
  console.log('\n📝 Creating user profile...');
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email: TEST_USER.email,
      full_name: 'Test User',
      plan: 'free',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  if (profileError) {
    console.error('❌ Error creating profile:', profileError.message);
  } else {
    console.log('✅ Profile created');
  }

  // 3. Create sample monitors
  console.log('\n🖥️  Creating sample monitors...');
  const monitors = [
    {
      user_id: userId,
      name: 'Google',
      url: 'https://www.google.com',
      type: 'https',
      method: 'GET',
      interval_seconds: 300,
      timeout_seconds: 30,
      status: 'active',
      is_up: true,
      expected_status_codes: [200],
    },
    {
      user_id: userId,
      name: 'GitHub',
      url: 'https://github.com',
      type: 'https',
      method: 'GET',
      interval_seconds: 300,
      timeout_seconds: 30,
      status: 'active',
      is_up: true,
      expected_status_codes: [200],
    },
    {
      user_id: userId,
      name: 'Example API',
      url: 'https://api.example.com/health',
      type: 'https',
      method: 'GET',
      interval_seconds: 600,
      timeout_seconds: 30,
      status: 'active',
      is_up: false,
      expected_status_codes: [200],
    },
    {
      user_id: userId,
      name: 'Test Website',
      url: 'https://test.example.com',
      type: 'https',
      method: 'GET',
      interval_seconds: 900,
      timeout_seconds: 30,
      status: 'paused',
      is_up: null,
      expected_status_codes: [200],
    },
  ];

  const { data: createdMonitors, error: monitorsError } = await supabase
    .from('monitors')
    .insert(monitors)
    .select();

  if (monitorsError) {
    console.error('❌ Error creating monitors:', monitorsError.message);
  } else {
    console.log(`✅ Created ${createdMonitors?.length} monitors`);
  }

  // 4. Create sample checks for each monitor
  if (createdMonitors && createdMonitors.length > 0) {
    console.log('\n📊 Creating sample checks...');
    
    const now = new Date();
    const checks = [];

    for (const monitor of createdMonitors) {
      // Create 24 hours of checks (every 5 minutes = 288 checks)
      for (let i = 0; i < 50; i++) {
        const checkedAt = new Date(now.getTime() - i * 5 * 60 * 1000);
        const isUp = monitor.is_up === true || (monitor.is_up === false && i > 10);
        
        checks.push({
          monitor_id: monitor.id,
          status: isUp ? 'success' : 'failure',
          response_time_ms: isUp ? Math.floor(Math.random() * 500) + 100 : null,
          status_code: isUp ? 200 : 500,
          error_message: isUp ? null : 'Connection timeout',
          checked_at: checkedAt.toISOString(),
        });
      }
    }

    const { error: checksError } = await supabase
      .from('checks')
      .insert(checks);

    if (checksError) {
      console.error('❌ Error creating checks:', checksError.message);
    } else {
      console.log(`✅ Created ${checks.length} checks`);
    }
  }

  // 5. Create sample incidents
  console.log('\n🚨 Creating sample incidents...');
  const downMonitor = createdMonitors?.find(m => m.is_up === false);
  
  if (downMonitor) {
    const incidents = [
      {
        monitor_id: downMonitor.id,
        status: 'ongoing',
        started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        error_message: 'Connection timeout',
      },
      {
        monitor_id: downMonitor.id,
        status: 'resolved',
        started_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
        resolved_at: new Date(Date.now() - 47 * 60 * 60 * 1000).toISOString(), // 1 hour later
        error_message: 'Server error (500)',
        duration_ms: 60 * 60 * 1000, // 1 hour
      },
    ];

    const { error: incidentsError } = await supabase
      .from('incidents')
      .insert(incidents);

    if (incidentsError) {
      console.error('❌ Error creating incidents:', incidentsError.message);
    } else {
      console.log(`✅ Created ${incidents.length} incidents`);
    }
  }

  // 6. Create alert settings
  console.log('\n🔔 Creating alert settings...');
  const { error: alertError } = await supabase
    .from('alert_settings')
    .insert({
      user_id: userId,
      name: 'Default Email Alerts',
      description: 'Email notifications for all monitors',
      is_enabled: true,
      events: ['monitor_down', 'monitor_up'],
      channel: 'email',
      channel_config: { email: TEST_USER.email },
      failure_threshold: 3,
      recovery_threshold: 3,
      frequency: 'immediate',
    });

  if (alertError) {
    console.error('❌ Error creating alert settings:', alertError.message);
  } else {
    console.log('✅ Alert settings created');
  }

  console.log('\n✨ Seed completed successfully!\n');
  console.log('ℹ️  Note: Authentication is currently disabled for development');
  console.log('📊 Test data created for user ID:', userId);
  console.log('\n🔗 View dashboard at: http://localhost:3000/dashboard\n');
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
