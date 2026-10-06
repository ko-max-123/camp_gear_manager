-- キャンプギア棚 v8：新規SupabaseプロジェクトのSQL Editorで実行します。
-- 道具と荷物を正規化し、ユーザーIDでデータを分離します。
begin;

create table if not exists public.camp_shelves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'light' check (theme in ('light','dark')),
  trip_name text not null default '次回キャンプ' check (char_length(trip_name) <= 100),
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.camp_gear (
  user_id uuid not null references public.camp_shelves(user_id) on delete cascade,
  id text not null check (id ~ '^[A-Za-z0-9_-]{1,100}$'),
  name text not null check (char_length(name) between 1 and 80),
  category text not null check (char_length(category) <= 80),
  brand text not null default '' check (char_length(brand) <= 60),
  qty integer not null default 1 check (qty between 1 and 99),
  qty_unit text not null default '個' check (char_length(qty_unit) <= 10),
  weight numeric(9,3) not null default 0 check (weight between 0 and 999),
  status text not null default 'check' check (status in ('good','check','repair')),
  is_default boolean not null default false,
  storage text not null default '' check (char_length(storage) <= 100),
  purchased date,
  purchase_url text not null default '' check (char_length(purchase_url) <= 2000),
  note text not null default '' check (char_length(note) <= 500),
  updated bigint not null default 0,
  care jsonb not null default '{"steps":[],"lastCompleted":null}'::jsonb check (jsonb_typeof(care) = 'object'),
  photo_src text,
  photo_path text check (photo_path is null or starts_with(photo_path, user_id::text || '/')),
  photo_cutout boolean not null default false,
  primary key (user_id, id)
);

create table if not exists public.camp_trip_items (
  user_id uuid not null,
  gear_id text not null,
  primary key (user_id, gear_id),
  foreign key (user_id, gear_id) references public.camp_gear(user_id, id) on delete cascade
);

-- ブラウザがアクセスしても、JWTの本人以外の行は操作できません。
alter table public.camp_shelves enable row level security;
alter table public.camp_gear enable row level security;
alter table public.camp_trip_items enable row level security;
revoke all on public.camp_shelves, public.camp_gear, public.camp_trip_items from public, anon;
grant select, insert, update, delete on public.camp_shelves, public.camp_gear, public.camp_trip_items to authenticated;

drop policy if exists camp_shelf_owner on public.camp_shelves;
create policy camp_shelf_owner on public.camp_shelves for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists camp_gear_owner on public.camp_gear;
create policy camp_gear_owner on public.camp_gear for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists camp_trip_owner on public.camp_trip_items;
create policy camp_trip_owner on public.camp_trip_items for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- 写真のURLではなく保存パスを返します。初回は空の棚として扱います。
create or replace function public.camp_load_shelf()
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  owner uuid := auth.uid();
  shelf public.camp_shelves%rowtype;
  items jsonb;
  selected jsonb;
begin
  if owner is null then raise exception 'login_required' using errcode = '42501'; end if;
  select * into shelf from public.camp_shelves where user_id = owner;
  if not found then return null; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',id,'name',name,'category',category,'brand',brand,'qty',qty,'qtyUnit',qty_unit,
    'weight',weight,'status',status,'default',is_default,'storage',storage,
    'purchased',coalesce(purchased::text,''),'url',purchase_url,'note',note,
    'updated',updated,'care',care,'photoSrc',photo_src,'photoPath',photo_path,'photoCutout',photo_cutout
  ) order by updated desc, id),'[]'::jsonb) into items from public.camp_gear where user_id = owner;
  select coalesce(jsonb_agg(gear_id order by gear_id),'[]'::jsonb) into selected from public.camp_trip_items where user_id = owner;
  return jsonb_build_object('revision',shelf.revision,'state',jsonb_build_object(
    'theme',shelf.theme,'trip',jsonb_build_object('name',shelf.trip_name,'selected',selected),'gear',items
  ));
end;
$$;

-- バージョンをロックしてから、道具と選択を同じトランザクションで更新します。
-- 古い端末の内容を黙って上書きしません。
create or replace function public.camp_save_shelf(p_state jsonb, p_expected_revision bigint)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  owner uuid := auth.uid();
  current_revision bigint;
  gear_record jsonb;
begin
  if owner is null then raise exception 'login_required' using errcode = '42501'; end if;
  if jsonb_typeof(p_state->'gear') is distinct from 'array' or jsonb_array_length(p_state->'gear') > 1000
    or p_expected_revision is null or p_expected_revision < 0 then
    raise exception 'invalid_shelf' using errcode = '22023';
  end if;
  insert into public.camp_shelves(user_id) values (owner) on conflict do nothing;
  select revision into current_revision from public.camp_shelves where user_id = owner for update;
  if current_revision <> p_expected_revision then raise exception 'shelf_conflict' using errcode = '40001'; end if;

  delete from public.camp_gear where user_id = owner and id not in (
    select value->>'id' from jsonb_array_elements(p_state->'gear')
  );
  for gear_record in select value from jsonb_array_elements(p_state->'gear') loop
    insert into public.camp_gear (
      user_id,id,name,category,brand,qty,qty_unit,weight,status,is_default,storage,purchased,
      purchase_url,note,updated,care,photo_src,photo_path,photo_cutout
    ) values (
      owner,gear_record->>'id',gear_record->>'name',coalesce(gear_record->>'category','その他'),coalesce(gear_record->>'brand',''),
      (gear_record->>'qty')::integer,coalesce(gear_record->>'qtyUnit','個'),(gear_record->>'weight')::numeric,
      gear_record->>'status',coalesce((gear_record->>'default')::boolean,false),coalesce(gear_record->>'storage',''),
      nullif(gear_record->>'purchased','')::date,coalesce(gear_record->>'url',''),coalesce(gear_record->>'note',''),
      coalesce((gear_record->>'updated')::bigint,0),coalesce(gear_record->'care','{}'::jsonb),
      gear_record->>'photoSrc',gear_record->>'photoPath',coalesce((gear_record->>'photoCutout')::boolean,false)
    ) on conflict (user_id,id) do update set
      name=excluded.name,category=excluded.category,brand=excluded.brand,qty=excluded.qty,
      qty_unit=excluded.qty_unit,weight=excluded.weight,status=excluded.status,is_default=excluded.is_default,
      storage=excluded.storage,purchased=excluded.purchased,purchase_url=excluded.purchase_url,note=excluded.note,
      updated=excluded.updated,care=excluded.care,photo_src=excluded.photo_src,photo_path=excluded.photo_path,photo_cutout=excluded.photo_cutout;
  end loop;

  delete from public.camp_trip_items where user_id = owner;
  insert into public.camp_trip_items(user_id, gear_id)
    select owner, value from jsonb_array_elements_text(coalesce(p_state->'trip'->'selected','[]'::jsonb)) as selected(value)
    where exists (select 1 from public.camp_gear where user_id = owner and id = value) on conflict do nothing;
  update public.camp_shelves set theme = coalesce(p_state->>'theme','light'),
    trip_name = coalesce(p_state->'trip'->>'name','次回キャンプ'),revision = current_revision + 1,updated_at = now()
    where user_id = owner;
  return jsonb_build_object('revision',current_revision + 1);
end;
$$;

revoke all on function public.camp_load_shelf() from public, anon;
revoke all on function public.camp_save_shelf(jsonb,bigint) from public, anon;
grant execute on function public.camp_load_shelf() to authenticated;
grant execute on function public.camp_save_shelf(jsonb,bigint) to authenticated;

-- FreeプランのStorageを利用。バケットをpublicにしないでください。
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('gear-photos','gear-photos',false,5242880,array['image/webp','image/png','image/jpeg'])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists camp_photo_read on storage.objects;
create policy camp_photo_read on storage.objects for select to authenticated
  using (bucket_id='gear-photos' and (storage.foldername(name))[1]=(select auth.uid()::text));
drop policy if exists camp_photo_create on storage.objects;
create policy camp_photo_create on storage.objects for insert to authenticated
  with check (bucket_id='gear-photos' and (storage.foldername(name))[1]=(select auth.uid()::text));
drop policy if exists camp_photo_delete on storage.objects;
create policy camp_photo_delete on storage.objects for delete to authenticated
  using (bucket_id='gear-photos' and (storage.foldername(name))[1]=(select auth.uid()::text));

commit;
