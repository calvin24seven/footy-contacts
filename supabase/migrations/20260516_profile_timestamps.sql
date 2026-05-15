-- Add onboarding completion timestamp (analytics, day-1 retention queries)
alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz;

-- Add permanent dashboard welcome-banner dismiss flag
-- Default false so existing users see the banner on first load
alter table public.profiles
  add column if not exists dashboard_welcome_dismissed boolean not null default false;
