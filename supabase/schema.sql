-- La Vie Salon — pokreni u Supabase SQL Editor (Dashboard → SQL → New query)

create table if not exists bookings (
  id bigserial primary key,
  name text not null,
  email text not null,
  phone text not null,
  service text not null,
  booking_date text not null,
  booking_time text not null,
  notes text not null default '',
  status text not null default 'pending',
  cancel_token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table if not exists admin_sessions (
  id uuid primary key default gen_random_uuid(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists settings (
  key text primary key,
  value text not null
);

create index if not exists idx_bookings_date on bookings(booking_date);
create index if not exists idx_bookings_status on bookings(status);

alter table bookings enable row level security;
alter table admin_sessions enable row level security;
alter table settings enable row level security;

-- API koristi service_role ključ (samo na serveru) — javni pristup zabranjen
create policy "deny anon bookings" on bookings for all to anon using (false);
create policy "deny anon sessions" on admin_sessions for all to anon using (false);
create policy "deny anon settings" on settings for all to anon using (false);
