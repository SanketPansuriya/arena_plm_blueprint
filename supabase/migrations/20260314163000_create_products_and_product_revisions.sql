create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  industry text,
  primary_site_name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  full_name text,
  email text not null,
  role text not null,
  job_title text,
  is_active boolean not null default true,
  timezone text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  product_code text not null,
  name text not null,
  description text,
  category text,
  lifecycle_status text not null default 'draft',
  owner_user_id uuid references public.users (id) on delete set null,
  current_revision_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint products_organization_id_product_code_key unique (organization_id, product_code)
);

create table public.product_revisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  revision_code text not null,
  status text not null default 'draft',
  summary text,
  change_request_id uuid,
  released_at timestamptz,
  released_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint product_revisions_organization_id_product_id_revision_code_key unique (
    organization_id,
    product_id,
    revision_code
  )
);

alter table public.products
add constraint products_current_revision_id_fkey
foreign key (current_revision_id)
references public.product_revisions (id)
on delete set null;

create index users_organization_id_idx
  on public.users (organization_id);

create index products_organization_id_idx
  on public.products (organization_id);

create index products_owner_user_id_idx
  on public.products (owner_user_id);

create index products_current_revision_id_idx
  on public.products (current_revision_id);

create index product_revisions_organization_id_idx
  on public.product_revisions (organization_id);

create index product_revisions_product_id_idx
  on public.product_revisions (product_id);

create or replace function public.current_user_organization_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select organization_id
  from public.users
  where id = auth.uid()
    and is_active = true
  limit 1
$$;

create or replace function public.is_active_member_of_organization(target_organization_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and organization_id = target_organization_id
      and is_active = true
  )
$$;

create trigger set_organizations_updated_at
before update on public.organizations
for each row
execute function public.set_updated_at();

create trigger set_users_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

create trigger set_products_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

create trigger set_product_revisions_updated_at
before update on public.product_revisions
for each row
execute function public.set_updated_at();

alter table public.organizations enable row level security;
alter table public.users enable row level security;
alter table public.products enable row level security;
alter table public.product_revisions enable row level security;

create policy "Organizations are viewable by active members"
on public.organizations
for select
to authenticated
using (public.is_active_member_of_organization(id));

create policy "Users are viewable by active organization members"
on public.users
for select
to authenticated
using (public.is_active_member_of_organization(organization_id));

create policy "Users can update their own profile"
on public.users
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Products are viewable by active organization members"
on public.products
for select
to authenticated
using (public.is_active_member_of_organization(organization_id));

create policy "Products are insertable by active organization members"
on public.products
for insert
to authenticated
with check (public.is_active_member_of_organization(organization_id));

create policy "Products are updatable by active organization members"
on public.products
for update
to authenticated
using (public.is_active_member_of_organization(organization_id))
with check (public.is_active_member_of_organization(organization_id));

create policy "Products are deletable by active organization members"
on public.products
for delete
to authenticated
using (public.is_active_member_of_organization(organization_id));

create policy "Product revisions are viewable by active organization members"
on public.product_revisions
for select
to authenticated
using (public.is_active_member_of_organization(organization_id));

create policy "Product revisions are insertable by active organization members"
on public.product_revisions
for insert
to authenticated
with check (public.is_active_member_of_organization(organization_id));

create policy "Product revisions are updatable by active organization members"
on public.product_revisions
for update
to authenticated
using (public.is_active_member_of_organization(organization_id))
with check (public.is_active_member_of_organization(organization_id));

create policy "Product revisions are deletable by active organization members"
on public.product_revisions
for delete
to authenticated
using (public.is_active_member_of_organization(organization_id));
