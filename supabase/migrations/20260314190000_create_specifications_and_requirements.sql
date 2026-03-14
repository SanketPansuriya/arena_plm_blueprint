create table public.specifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  spec_code text,
  title text not null,
  description text,
  owner_entity_type text not null,
  owner_entity_id uuid not null,
  status text not null default 'draft',
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint specifications_organization_id_spec_code_key unique (organization_id, spec_code)
);

create table public.requirements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  requirement_code text,
  title text not null,
  description text,
  requirement_type text,
  priority text,
  owner_entity_type text not null,
  owner_entity_id uuid not null,
  status text not null default 'draft',
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint requirements_organization_id_requirement_code_key unique (
    organization_id,
    requirement_code
  )
);

create index specifications_organization_id_idx
  on public.specifications (organization_id);

create index specifications_owner_entity_idx
  on public.specifications (owner_entity_type, owner_entity_id);

create index specifications_created_by_idx
  on public.specifications (created_by);

create index requirements_organization_id_idx
  on public.requirements (organization_id);

create index requirements_owner_entity_idx
  on public.requirements (owner_entity_type, owner_entity_id);

create index requirements_created_by_idx
  on public.requirements (created_by);

create trigger set_specifications_updated_at
before update on public.specifications
for each row
execute function public.set_updated_at();

create trigger set_requirements_updated_at
before update on public.requirements
for each row
execute function public.set_updated_at();

alter table public.specifications enable row level security;
alter table public.requirements enable row level security;

create policy "Specifications are viewable by active organization members"
on public.specifications
for select
to authenticated
using (public.is_active_member_of_organization(organization_id));

create policy "Specifications are insertable by active organization members"
on public.specifications
for insert
to authenticated
with check (public.is_active_member_of_organization(organization_id));

create policy "Specifications are updatable by active organization members"
on public.specifications
for update
to authenticated
using (public.is_active_member_of_organization(organization_id))
with check (public.is_active_member_of_organization(organization_id));

create policy "Specifications are deletable by active organization members"
on public.specifications
for delete
to authenticated
using (public.is_active_member_of_organization(organization_id));

create policy "Requirements are viewable by active organization members"
on public.requirements
for select
to authenticated
using (public.is_active_member_of_organization(organization_id));

create policy "Requirements are insertable by active organization members"
on public.requirements
for insert
to authenticated
with check (public.is_active_member_of_organization(organization_id));

create policy "Requirements are updatable by active organization members"
on public.requirements
for update
to authenticated
using (public.is_active_member_of_organization(organization_id))
with check (public.is_active_member_of_organization(organization_id));

create policy "Requirements are deletable by active organization members"
on public.requirements
for delete
to authenticated
using (public.is_active_member_of_organization(organization_id));
