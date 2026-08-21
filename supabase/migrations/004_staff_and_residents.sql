-- スタッフ・利用者マスター
-- これまでフロント側にハードコードしていた職員名・利用者名をDBで管理し、
-- 画面から追加・編集・削除できるようにする。

create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

create table if not exists residents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

-- 同名の重複登録を防ぐ
create unique index if not exists staff_name_key on staff (name);
create unique index if not exists residents_name_key on residents (name);

create index if not exists staff_sort_order_idx on staff (sort_order);
create index if not exists residents_sort_order_idx on residents (sort_order);

-- RLS（認証なしで全員アクセス可能／既存テーブルと同じ方針）
alter table staff enable row level security;
alter table residents enable row level security;

drop policy if exists "Allow all" on staff;
drop policy if exists "Allow all" on residents;
create policy "Allow all" on staff for all using (true) with check (true);
create policy "Allow all" on residents for all using (true) with check (true);

-- 既存のハードコード値を初期データとして投入
insert into staff (name, sort_order) values
  ('山下亮', 1), ('山下敦子', 2), ('角田', 3), ('内田', 4), ('武内', 5),
  ('樋口', 6), ('舩津', 7), ('中尾', 8), ('野田', 9), ('三原', 10)
on conflict (name) do nothing;

insert into residents (name, sort_order) values
  ('土谷 妃', 1), ('松岡 文子', 2), ('田中 数人', 3), ('田島 寛治', 4),
  ('安田 幸子', 5), ('齋藤 勢津子', 6), ('安永 和子', 7), ('犬束 紀行', 8),
  ('業務利用', 9)
on conflict (name) do nothing;
