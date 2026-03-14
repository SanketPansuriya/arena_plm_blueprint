create table public.parts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  part_number text not null,
  name text not null,
  description text,
  part_type text,
  unit_of_measure text,
  lifecycle_status text not null default 'draft',
  preferred_supplier_id uuid,
  current_revision_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint parts_organization_id_part_number_key unique (organization_id, part_number)
);

create table public.part_revisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  part_id uuid not null references public.parts (id) on delete cascade,
  revision_code text not null,
  status text not null default 'draft',
  summary text,
  specification_id uuid,
  cost_id uuid,
  change_request_id uuid,
  released_at timestamptz,
  released_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint part_revisions_organization_id_part_id_revision_code_key unique (
    organization_id,
    part_id,
    revision_code
  )
);

alter table public.parts
add constraint parts_current_revision_id_fkey
foreign key (current_revision_id)
references public.part_revisions (id)
on delete set null;

create index parts_organization_id_idx
  on public.parts (organization_id);

create index parts_part_type_idx
  on public.parts (part_type);

create index parts_current_revision_id_idx
  on public.parts (current_revision_id);

create index part_revisions_organization_id_idx
  on public.part_revisions (organization_id);

create index part_revisions_part_id_idx
  on public.part_revisions (part_id);

create index part_revisions_released_by_idx
  on public.part_revisions (released_by);

create trigger set_parts_updated_at
before update on public.parts
for each row
execute function public.set_updated_at();

create trigger set_part_revisions_updated_at
before update on public.part_revisions
for each row
execute function public.set_updated_at();

alter table public.parts enable row level security;
alter table public.part_revisions enable row level security;

create policy "Parts are viewable by active organization members"
on public.parts
for select
to authenticated
using (public.is_active_member_of_organization(organization_id));

create policy "Parts are insertable by active organization members"
on public.parts
for insert
to authenticated
with check (public.is_active_member_of_organization(organization_id));

create policy "Parts are updatable by active organization members"
on public.parts
for update
to authenticated
using (public.is_active_member_of_organization(organization_id))
with check (public.is_active_member_of_organization(organization_id));

create policy "Parts are deletable by active organization members"
on public.parts
for delete
to authenticated
using (public.is_active_member_of_organization(organization_id));

create policy "Part revisions are viewable by active organization members"
on public.part_revisions
for select
to authenticated
using (public.is_active_member_of_organization(organization_id));

create policy "Part revisions are insertable by active organization members"
on public.part_revisions
for insert
to authenticated
with check (public.is_active_member_of_organization(organization_id));

create policy "Part revisions are updatable by active organization members"
on public.part_revisions
for update
to authenticated
using (public.is_active_member_of_organization(organization_id))
with check (public.is_active_member_of_organization(organization_id));

create policy "Part revisions are deletable by active organization members"
on public.part_revisions
for delete
to authenticated
using (public.is_active_member_of_organization(organization_id));
