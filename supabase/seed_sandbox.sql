insert into users (id, email)
values ('local-user', 'local@spendlens.app')
on conflict (id) do nothing;

-- After connecting via Plaid Link (sandbox), run /api/plaid/sync-transactions once.
-- Use institution_id ins_109508 in Plaid Link (First Platypus Bank).
