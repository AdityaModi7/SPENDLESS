create extension if not exists "pgcrypto";

drop table if exists user_settings cascade;
drop table if exists trips cascade;

alter table if exists transactions drop column if exists plaid_primary_category;
alter table if exists transactions drop column if exists simplified_category;
alter table if exists transactions drop column if exists user_category_override;
alter table if exists transactions drop column if exists allocation_bucket;
alter table if exists transactions drop column if exists is_fixed_expense;
alter table if exists transactions drop column if exists is_investment_transfer;
alter table if exists transactions drop column if exists is_lifestyle;
alter table if exists transactions drop column if exists trip_id;

alter table if exists accounts drop column if exists custom_name;

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
  pending boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_transactions_date on transactions (date desc);
create index if not exists idx_transactions_account on transactions (account_id);
create index if not exists idx_accounts_user on accounts (user_id);

insert into users (id, email)
values ('local-user', 'local@spendlens.app')
on conflict (id) do nothing;
