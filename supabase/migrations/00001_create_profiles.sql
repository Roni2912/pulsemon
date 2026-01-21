-- Migration: Create user profiles table
-- Purpose: Extends Supabase auth.users with application-specific data including subscription plans
-- This table stores user profile information, subscription status, and plan limits
-- Uses RLS (Row Level Security) to ensure users can only access their own data

-- Create custom types for better type safety
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'incomplete', 'trialing');
CREATE TYPE plan_type AS ENUM ('free', 'pro', 'enterprise');

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    
    -- Subscription information
    plan plan_type NOT NULL DEFAULT 'free',
    subscription_status subscription_status DEFAULT NULL,
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    
    -- Plan limits (denormalized for performance)
    max_monitors INTEGER NOT NULL DEFAULT 5, -- Free plan limit
    max_checks_per_minute INTEGER NOT NULL DEFAULT 1,
    max_status_pages INTEGER NOT NULL DEFAULT 1,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own profile
CREATE POLICY "Users can view own profile" 
    ON profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
    ON profiles FOR UPDATE 
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
    ON profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS profiles_stripe_customer_id_idx ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS profiles_plan_idx ON profiles(plan);
CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON profiles(created_at);

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to update plan limits when plan changes
CREATE OR REPLACE FUNCTION public.update_plan_limits()
RETURNS TRIGGER AS $$
BEGIN
    -- Update limits based on plan type
    CASE NEW.plan
        WHEN 'free' THEN
            NEW.max_monitors := 5;
            NEW.max_checks_per_minute := 1;
            NEW.max_status_pages := 1;
        WHEN 'pro' THEN
            NEW.max_monitors := 50;
            NEW.max_checks_per_minute := 5;
            NEW.max_status_pages := 10;
        WHEN 'enterprise' THEN
            NEW.max_monitors := 500;
            NEW.max_checks_per_minute := 20;
            NEW.max_status_pages := 50;
    END CASE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update limits when plan changes
CREATE TRIGGER profiles_update_plan_limits
    BEFORE INSERT OR UPDATE OF plan ON profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_plan_limits();