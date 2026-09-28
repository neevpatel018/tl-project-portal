create extension if not exists pgcrypto;

create type public.user_role as enum ('student','staff','admin');
create type public.project_status as enum ('pending','approved','rejected','needs_changes','in_progress','completed','cancelled');
create type public.item_type as enum ('consumable','reusable','machine');
create type public.resource_request_status as enum ('pending','approved','partially_approved','rejected','issued','cancelled');

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text,
 role public.user_role not null default 'student',
 is_active boolean not null default true,
 created_at timestamptz not null default now()
);
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.profiles(id,full_name) values(new.id,coalesce(new.raw_user_meta_data->>'full_name','')); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create table public.projects (
 id uuid primary key default gen_random_uuid(),
 reference_code text not null unique,
 title text not null check(length(title) between 3 and 160),
 lead_name text not null,
 lead_email text not null,
 organization text not null,
 team_members text not null default '',
 summary text not null,
 resources_description text not null default '',
 safety_notes text not null default '',
 start_date date,
 end_date date,
 submitted_by uuid references public.profiles(id) on delete set null,
 status public.project_status not null default 'pending',
 review_note text not null default '',
 reviewed_by uuid references public.profiles(id),
 reviewed_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check(start_date is null or end_date is null or end_date >= start_date)
);
create index projects_submitter_created_idx on public.projects(submitted_by,created_at desc);
create index projects_status_created_idx on public.projects(status,created_at desc);
create index projects_lead_email_idx on public.projects(lower(lead_email));

create table public.project_members (
 project_id uuid not null references public.projects(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 member_role text not null default 'member',
 created_at timestamptz not null default now(),
 primary key(project_id,user_id)
);
create table public.inventory_items (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 sku text not null unique,
 category text not null,
 unit text not null default 'unit',
 item_type public.item_type not null,
 reorder_level integer not null default 0 check(reorder_level >= 0),
 location text not null default '',
 is_archived boolean not null default false,
 created_by uuid references public.profiles(id),
 created_at timestamptz not null default now()
);
create table public.stock_balances (
 item_id uuid primary key references public.inventory_items(id),
 quantity_on_hand integer not null default 0 check(quantity_on_hand >= 0),
 quantity_reserved integer not null default 0 check(quantity_reserved >= 0 and quantity_reserved <= quantity_on_hand),
 updated_at timestamptz not null default now()
);
create table public.resource_requests (
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null references public.projects(id) on delete cascade,
 requested_by uuid references public.profiles(id),
 status public.resource_request_status not null default 'pending',
 notes text not null default '',
 reviewed_by uuid references public.profiles(id),
 reviewed_at timestamptz,
 created_at timestamptz not null default now()
);
create table public.resource_request_lines (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null references public.resource_requests(id) on delete cascade,
 item_id uuid not null references public.inventory_items(id),
 quantity_requested integer not null check(quantity_requested > 0),
 quantity_approved integer not null default 0 check(quantity_approved >= 0 and quantity_approved <= quantity_requested),
 notes text not null default ''
);
create index resource_requests_project_idx on public.resource_requests(project_id,created_at desc);
create table public.issue_records (
 id uuid primary key default gen_random_uuid(),
 item_id uuid not null references public.inventory_items(id),
 project_id uuid not null references public.projects(id),
 issued_to_email text not null,
 quantity_issued integer not null check(quantity_issued > 0),
 quantity_returned integer not null default 0 check(quantity_returned >= 0 and quantity_returned <= quantity_issued),
 issued_by uuid references public.profiles(id),
 issued_at timestamptz not null default now(),
 due_at timestamptz,
 status text not null default 'open' check(status in ('open','partially_returned','returned','consumed','lost'))
);
create index issue_records_open_idx on public.issue_records(status,due_at);
create table public.stock_movements (
 id uuid primary key default gen_random_uuid(),
 item_id uuid not null references public.inventory_items(id),
 quantity_delta integer not null check(quantity_delta <> 0),
 movement_type text not null check(movement_type in ('opening_balance','issue','return','adjustment','write_off')),
 issue_record_id uuid references public.issue_records(id),
 actor_id uuid references public.profiles(id),
 note text not null default '',
 created_at timestamptz not null default now()
);
create index stock_movements_item_created_idx on public.stock_movements(item_id,created_at desc);
create table public.audit_events (
 id bigint generated always as identity primary key,
 actor_id uuid references public.profiles(id),
 entity_type text not null,
 entity_id uuid,
 action text not null,
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create index audit_events_entity_idx on public.audit_events(entity_type,entity_id,created_at desc);

create function public.is_staff() returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_active and p.role in ('staff','admin'));
$$;

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.inventory_items enable row level security;
alter table public.stock_balances enable row level security;
alter table public.resource_requests enable row level security;
alter table public.resource_request_lines enable row level security;
alter table public.issue_records enable row level security;
alter table public.stock_movements enable row level security;
alter table public.audit_events enable row level security;

create policy "Users can read own profile" on public.profiles for select to authenticated using(id=auth.uid() or public.is_staff());
create policy "Project owner or staff can read projects" on public.projects for select to authenticated using(submitted_by=auth.uid() or exists(select 1 from public.project_members pm where pm.project_id=id and pm.user_id=auth.uid()) or public.is_staff());
create policy "Staff can update projects" on public.projects for update to authenticated using(public.is_staff()) with check(public.is_staff());
create policy "Staff can read project members" on public.project_members for select to authenticated using(user_id=auth.uid() or public.is_staff());
create policy "Authenticated users can read inventory" on public.inventory_items for select to authenticated using(not is_archived or public.is_staff());
create policy "Staff can read stock balances" on public.stock_balances for select to authenticated using(public.is_staff());
create policy "Project owner or staff can read resource requests" on public.resource_requests for select to authenticated using(public.is_staff() or exists(select 1 from public.projects p where p.id=project_id and p.submitted_by=auth.uid()));
create policy "Staff can manage resource requests" on public.resource_requests for all to authenticated using(public.is_staff()) with check(public.is_staff());
create policy "Staff can manage request lines" on public.resource_request_lines for all to authenticated using(public.is_staff()) with check(public.is_staff());
create policy "Staff can read issue records" on public.issue_records for select to authenticated using(public.is_staff() or exists(select 1 from public.projects p where p.id=project_id and p.submitted_by=auth.uid()));
create policy "Staff can read stock movements" on public.stock_movements for select to authenticated using(public.is_staff());
create policy "Staff can read audit events" on public.audit_events for select to authenticated using(public.is_staff());

-- Privileged RPCs use row locks so simultaneous issue attempts cannot oversubscribe stock.
create function public.create_inventory_item(p_name text,p_sku text,p_category text,p_unit text,p_item_type public.item_type,p_reorder_level int,p_initial_quantity int,p_location text,p_actor_id uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
 if not exists(select 1 from public.profiles where id=p_actor_id and is_active and role in ('staff','admin')) then raise exception 'forbidden'; end if;
 insert into public.inventory_items(name,sku,category,unit,item_type,reorder_level,location,created_by)
 values(p_name,p_sku,p_category,p_unit,p_item_type,p_reorder_level,p_location,p_actor_id) returning id into v_id;
 insert into public.stock_balances(item_id,quantity_on_hand) values(v_id,p_initial_quantity);
 if p_initial_quantity>0 then insert into public.stock_movements(item_id,quantity_delta,movement_type,actor_id,note) values(v_id,p_initial_quantity,'opening_balance',p_actor_id,'Opening balance'); end if;
 insert into public.audit_events(actor_id,entity_type,entity_id,action,metadata) values(p_actor_id,'inventory_item',v_id,'inventory.created',jsonb_build_object('sku',p_sku,'initial_quantity',p_initial_quantity));
 return v_id;
end; $$;

create function public.issue_stock(p_item_id uuid,p_project_id uuid,p_quantity int,p_actor_id uuid,p_note text default '')
returns uuid language plpgsql security definer set search_path=public as $$
declare v_available int; v_issue_id uuid; v_email text; v_type public.item_type;
begin
 if not exists(select 1 from public.profiles where id=p_actor_id and is_active and role in ('staff','admin')) then raise exception 'forbidden'; end if;
 if not exists(select 1 from public.projects where id=p_project_id and status in ('approved','in_progress')) then raise exception 'project_not_approved'; end if;
 select sb.quantity_on_hand-sb.quantity_reserved,ii.item_type into v_available,v_type from public.stock_balances sb join public.inventory_items ii on ii.id=sb.item_id where sb.item_id=p_item_id for update of sb;
 if v_available is null or v_available<p_quantity then raise exception 'insufficient_stock'; end if;
 select lead_email into v_email from public.projects where id=p_project_id;
 update public.stock_balances set quantity_on_hand=quantity_on_hand-p_quantity,updated_at=now() where item_id=p_item_id;
 insert into public.issue_records(item_id,project_id,issued_to_email,quantity_issued,issued_by,status) values(p_item_id,p_project_id,v_email,p_quantity,p_actor_id,case when v_type='consumable' then 'consumed' else 'open' end) returning id into v_issue_id;
 insert into public.stock_movements(item_id,quantity_delta,movement_type,issue_record_id,actor_id,note) values(p_item_id,-p_quantity,'issue',v_issue_id,p_actor_id,p_note);
 insert into public.audit_events(actor_id,entity_type,entity_id,action,metadata) values(p_actor_id,'issue_record',v_issue_id,'stock.issued',jsonb_build_object('item_id',p_item_id,'quantity',p_quantity,'project_id',p_project_id));
 return v_issue_id;
end; $$;

create function public.return_stock(p_issue_record_id uuid,p_quantity int,p_actor_id uuid,p_note text default '')
returns int language plpgsql security definer set search_path=public as $$
declare v_issue public.issue_records%rowtype; v_type public.item_type; v_remaining int; v_returned int;
begin
 if not exists(select 1 from public.profiles where id=p_actor_id and is_active and role in ('staff','admin')) then raise exception 'forbidden'; end if;
 select * into v_issue from public.issue_records where id=p_issue_record_id for update;
 if not found then raise exception 'issue_not_found'; end if;
 select item_type into v_type from public.inventory_items where id=v_issue.item_id;
 if v_type='consumable' then raise exception 'consumable_not_returnable'; end if;
 v_remaining:=v_issue.quantity_issued-v_issue.quantity_returned;
 if p_quantity>v_remaining then raise exception 'return_exceeds_outstanding'; end if;
 update public.issue_records set quantity_returned=quantity_returned+p_quantity,status=case when quantity_returned+p_quantity=quantity_issued then 'returned' else 'partially_returned' end where id=p_issue_record_id returning quantity_returned into v_returned;
 update public.stock_balances set quantity_on_hand=quantity_on_hand+p_quantity,updated_at=now() where item_id=v_issue.item_id;
 insert into public.stock_movements(item_id,quantity_delta,movement_type,issue_record_id,actor_id,note) values(v_issue.item_id,p_quantity,'return',p_issue_record_id,p_actor_id,p_note);
 insert into public.audit_events(actor_id,entity_type,entity_id,action,metadata) values(p_actor_id,'issue_record',p_issue_record_id,'stock.returned',jsonb_build_object('quantity',p_quantity));
 return v_returned;
end; $$;

revoke all on function public.create_inventory_item(text,text,text,text,public.item_type,int,int,text,uuid) from public, anon, authenticated;
revoke all on function public.issue_stock(uuid,uuid,int,uuid,text) from public, anon, authenticated;
revoke all on function public.return_stock(uuid,int,uuid,text) from public, anon, authenticated;
grant execute on function public.create_inventory_item(text,text,text,text,public.item_type,int,int,text,uuid) to service_role;
grant execute on function public.issue_stock(uuid,uuid,int,uuid,text) to service_role;
grant execute on function public.return_stock(uuid,int,uuid,text) to service_role;
