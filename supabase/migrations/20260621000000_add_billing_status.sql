alter table transactions
  add column billing_status text not null default 'issued';
