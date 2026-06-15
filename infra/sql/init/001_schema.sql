create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  role varchar(20) not null check (role in ('client', 'organizer', 'admin')),
  phone varchar(20) not null unique,
  email varchar(120),
  status varchar(20) not null default 'active' check (status in ('active', 'disabled', 'banned')),
  trust_score int not null default 100,
  trust_level varchar(4) not null default 'A+',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  nickname varchar(60),
  avatar_url text,
  real_name varchar(50),
  gender varchar(10) check (gender in ('male', 'female', 'other')),
  birth_date date,
  city_code varchar(20),
  bio text
);

create table if not exists identity_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  full_name varchar(50) not null,
  id_number varchar(32) not null,
  phone varchar(20) not null,
  gender varchar(10),
  front_image_url text,
  back_image_url text,
  hand_held_image_url text,
  review_status varchar(20) not null default 'pending' check (review_status in ('unverified', 'pending', 'approved', 'rejected')),
  review_note text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  city_code varchar(20) not null,
  district varchar(50),
  address_line varchar(255) not null,
  latitude numeric(10,7),
  longitude numeric(10,7),
  contact_name varchar(50),
  contact_phone varchar(20),
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists service_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  service_city_code varchar(20) not null,
  years_experience int not null default 0,
  intro text,
  approval_status varchar(20) not null default 'pending' check (approval_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists organizer_services (
  id uuid primary key default gen_random_uuid(),
  service_profile_id uuid not null references service_profiles(id) on delete cascade,
  service_type varchar(50) not null,
  pricing_mode varchar(20) not null check (pricing_mode in ('hourly', 'fixed')),
  base_price numeric(12,2) not null,
  unit_name varchar(20) not null,
  clean_level varchar(20) not null default 'none' check (clean_level in ('none', 'light', 'medium', 'heavy')),
  clean_addon_price numeric(12,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists organizer_pricing_rules (
  id uuid primary key default gen_random_uuid(),
  service_profile_id uuid not null references service_profiles(id) on delete cascade,
  overtime_price_per_hour numeric(12,2) not null default 0,
  distance_base_km numeric(8,2) not null default 10,
  distance_extra_price_per_km numeric(12,2) not null default 0,
  night_service_rate numeric(5,2) not null default 0.20
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  client_user_id uuid not null references users(id),
  organizer_user_id uuid references users(id),
  title varchar(120) not null,
  description text not null,
  city_code varchar(20) not null,
  district varchar(50),
  address_line varchar(255) not null,
  floor varchar(20),
  has_elevator boolean not null default false,
  scheduled_start_at timestamptz not null,
  estimated_duration_minutes int not null,
  storage_supply_status varchar(20) not null check (storage_supply_status in ('owned', 'need_organizer_prepare', 'unknown')),
  special_notes text,
  same_gender_only boolean not null default false,
  start_pin_code varchar(6) not null,
  arrival_radius_meters int not null default 50,
  latitude numeric(10,7) not null,
  longitude numeric(10,7) not null,
  status varchar(40) not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists order_media (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  media_type varchar(10) not null check (media_type in ('image', 'video')),
  url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists order_applications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  organizer_user_id uuid not null references users(id),
  message text,
  quoted_price numeric(12,2),
  status varchar(20) not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at timestamptz not null default now(),
  unique(order_id, organizer_user_id)
);

create table if not exists service_sessions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders(id) on delete cascade,
  started_at timestamptz,
  ended_at timestamptz,
  start_verification_status varchar(20) not null default 'pending' check (start_verification_status in ('pending', 'gps_verified', 'pin_verified', 'started', 'failed')),
  actual_duration_minutes int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists gps_checkins (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  organizer_user_id uuid not null references users(id),
  latitude numeric(10,7) not null,
  longitude numeric(10,7) not null,
  distance_meters numeric(10,2),
  checkin_type varchar(20) not null check (checkin_type in ('arrival', 'sos', 'heartbeat')),
  created_at timestamptz not null default now()
);

create table if not exists order_bills (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders(id) on delete cascade,
  estimated_amount numeric(12,2) not null default 0,
  overtime_amount numeric(12,2) not null default 0,
  distance_amount numeric(12,2) not null default 0,
  night_amount numeric(12,2) not null default 0,
  final_amount numeric(12,2) not null default 0,
  platform_commission_rate numeric(5,2) not null default 0.15,
  platform_commission_amount numeric(12,2) not null default 0,
  organizer_income_amount numeric(12,2) not null default 0,
  currency varchar(10) not null default 'CNY',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists chats (
  id uuid primary key default gen_random_uuid(),
  order_id uuid unique references orders(id) on delete set null,
  chat_type varchar(20) not null default 'order' check (chat_type in ('order', 'support')),
  created_at timestamptz not null default now()
);

create table if not exists chat_participants (
  chat_id uuid not null references chats(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (chat_id, user_id)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references chats(id) on delete cascade,
  sender_user_id uuid not null references users(id),
  message_type varchar(20) not null check (message_type in ('text', 'image', 'video', 'location', 'system')),
  content text,
  attachment_url text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  created_at timestamptz not null default now()
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  reviewer_user_id uuid not null references users(id),
  reviewee_user_id uuid not null references users(id),
  overall_rating int not null check (overall_rating between 1 and 5),
  professionalism_rating int check (professionalism_rating between 1 and 5),
  efficiency_rating int check (efficiency_rating between 1 and 5),
  attitude_rating int check (attitude_rating between 1 and 5),
  neatness_rating int check (neatness_rating between 1 and 5),
  content text,
  created_at timestamptz not null default now(),
  unique(order_id, reviewer_user_id)
);

create table if not exists disputes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete set null,
  reporter_user_id uuid not null references users(id),
  reported_user_id uuid references users(id),
  dispute_type varchar(20) not null check (dispute_type in ('refund', 'complaint', 'report', 'sos')),
  status varchar(20) not null default 'open' check (status in ('open', 'processing', 'resolved', 'rejected')),
  description text not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists dispute_evidences (
  id uuid primary key default gen_random_uuid(),
  dispute_id uuid not null references disputes(id) on delete cascade,
  evidence_type varchar(20) not null check (evidence_type in ('image', 'video', 'audio', 'text', 'location')),
  url text,
  content text,
  created_at timestamptz not null default now()
);

create table if not exists payment_transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  payer_user_id uuid not null references users(id),
  payee_user_id uuid references users(id),
  transaction_type varchar(20) not null check (transaction_type in ('prepay', 'settlement', 'refund', 'commission')),
  provider varchar(20) not null,
  provider_transaction_id varchar(100),
  amount numeric(12,2) not null,
  status varchar(20) not null default 'pending' check (status in ('pending', 'authorized', 'escrowed', 'settled', 'refunded', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists payouts (
  id uuid primary key default gen_random_uuid(),
  organizer_user_id uuid not null references users(id),
  order_id uuid not null unique references orders(id) on delete cascade,
  amount numeric(12,2) not null,
  status varchar(20) not null default 'pending' check (status in ('pending', 'processing', 'paid', 'failed')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists trust_score_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  order_id uuid references orders(id) on delete set null,
  action_code varchar(50) not null,
  score_delta int not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_orders_client_status on orders(client_user_id, status);
create index if not exists idx_orders_organizer_status on orders(organizer_user_id, status);
create index if not exists idx_orders_scheduled_start_at on orders(scheduled_start_at);
create index if not exists idx_applications_order_status on order_applications(order_id, status);
create index if not exists idx_messages_chat_created_at on messages(chat_id, created_at desc);
create index if not exists idx_payments_order_status on payment_transactions(order_id, status);
create index if not exists idx_verifications_user_status on identity_verifications(user_id, review_status);
