create extension if not exists "pgcrypto";

alter table if exists accounts add column if not exists custom_name text;

create table if not exists users (
  id text primary key,
  email text,
  created_at timestamptz default now()
);

create table if not exists plaid_items (
  id bigserial primary key,
  user_id text not null references users(id) on delete cascade,
  item_id text not null unique,
  institution_name text,
  access_token text not null,
  sync_cursor text,
  last_synced_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists accounts (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  item_id text not null references plaid_items(item_id) on delete cascade,
  name text not null,
  custom_name text,
  mask text,
  type text not null,
  subtype text,
  current_balance numeric default 0,
  available_balance numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists transactions (
  id bigserial primary key,
  plaid_transaction_id text not null unique,
  item_id text not null references plaid_items(item_id) on delete cascade,
  account_id text not null references accounts(id) on delete cascade,
  merchant_name text,
  name text,
  amount numeric not null,
  category text,
  date date not null,
  plaid_primary_category text,
  simplified_category text default 'Other',
  user_category_override text,
  allocation_bucket text default 'Lifestyle',
  is_fixed_expense boolean default false,
  is_investment_transfer boolean default false,
  is_lifestyle boolean default true,
  trip_id bigint,
  pending boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists user_settings (
  user_id text primary key references users(id) on delete cascade,
  monthly_income numeric not null default 4656,
  savings_goal_percent numeric not null default 60,
  warning_threshold_percent numeric not null default 35,
  yearly_event_budget numeric not null default 2500,
  monthly_essentials numeric not null default 1363,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists trips (
  id bigserial primary key,
  user_id text not null references users(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_name = 'fk_transactions_trip_id'
      and table_name = 'transactions'
  ) then
    alter table transactions
      add constraint fk_transactions_trip_id
      foreign key (trip_id)
      references trips(id)
      on delete set null;
  end if;
end $$;


alter table if exists transactions add column if not exists plaid_primary_category text;
alter table if exists transactions add column if not exists simplified_category text default 'Other';
alter table if exists transactions add column if not exists user_category_override text;
alter table if exists transactions add column if not exists allocation_bucket text default 'Lifestyle';
alter table if exists transactions add column if not exists is_fixed_expense boolean default false;
alter table if exists transactions add column if not exists is_investment_transfer boolean default false;
alter table if exists transactions add column if not exists is_lifestyle boolean default true;
alter table if exists transactions add column if not exists trip_id bigint;

create index if not exists idx_transactions_date on transactions (date desc);
create index if not exists idx_transactions_account on transactions (account_id);
create index if not exists idx_accounts_user on accounts (user_id);

insert into users (id, email)
values ('local-user', 'local@spendlens.app')
on conflict (id) do nothing;

alter table if exists user_settings add column if not exists monthly_essentials numeric not null default 1363;

insert into user_settings (user_id, monthly_income, savings_goal_percent, warning_threshold_percent, yearly_event_budget, monthly_essentials)
values ('local-user', 4656, 60, 35, 2500, 1363)
on conflict (user_id) do nothing;
