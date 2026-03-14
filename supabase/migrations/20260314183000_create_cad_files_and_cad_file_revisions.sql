create table public.cad_files (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  cad_number text not null,
  title text not null,
  cad_type text,
  owner_entity_type text not null,
  owner_entity_id uuid not null,
  status text not null default 'draft',
  current_revision_id uuid,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint cad_files_organization_id_cad_number_key unique (organization_id, cad_number)
);

create table public.cad_file_revisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  cad_file_id uuid not null references public.cad_files (id) on delete cascade,
  revision_code text not null,
  file_name text not null,
  storage_bucket text not null,
  storage_path text not null,
  viewer_url text,
  mime_type text,
  file_size_bytes bigint,
  checksum text,
  status text not null default 'draft',
  uploaded_by uuid references public.users (id) on delete set null,
  change_request_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint cad_file_revisions_organization_id_cad_file_id_revision_code_key unique (
    organization_id,
    cad_file_id,
    revision_code
  )
);

alter table public.cad_files
add constraint cad_files_current_revision_id_fkey
foreign key (current_revision_id)
references public.cad_file_revisions (id)
on delete set null;

create index cad_files_organization_id_idx
  on public.cad_files (organization_id);

create index cad_files_owner_entity_idx
  on public.cad_files (owner_entity_type, owner_entity_id);

create index cad_files_current_revision_id_idx
  on public.cad_files (current_revision_id);

create index cad_files_created_by_idx
  on public.cad_files (created_by);

create index cad_file_revisions_organization_id_idx
  on public.cad_file_revisions (organization_id);

create index cad_file_revisions_cad_file_id_idx
  on public.cad_file_revisions (cad_file_id);

create index cad_file_revisions_uploaded_by_idx
  on public.cad_file_revisions (uploaded_by);

create trigger set_cad_files_updated_at
before update on public.cad_files
for each row
execute function public.set_updated_at();

create trigger set_cad_file_revisions_updated_at
before update on public.cad_file_revisions
for each row
execute function public.set_updated_at();

alter table public.cad_files enable row level security;
alter table public.cad_file_revisions enable row level security;

create policy "CAD files are viewable by active organization members"
on public.cad_files
for select
to authenticated
using (public.is_active_member_of_organization(organization_id));

create policy "CAD files are insertable by active organization members"
on public.cad_files
for insert
to authenticated
with check (public.is_active_member_of_organization(organization_id));

create policy "CAD files are updatable by active organization members"
on public.cad_files
for update
to authenticated
using (public.is_active_member_of_organization(organization_id))
with check (public.is_active_member_of_organization(organization_id));

create policy "CAD files are deletable by active organization members"
on public.cad_files
for delete
to authenticated
using (public.is_active_member_of_organization(organization_id));

create policy "CAD file revisions are viewable by active organization members"
on public.cad_file_revisions
for select
to authenticated
using (public.is_active_member_of_organization(organization_id));

create policy "CAD file revisions are insertable by active organization members"
on public.cad_file_revisions
for insert
to authenticated
with check (public.is_active_member_of_organization(organization_id));

create policy "CAD file revisions are updatable by active organization members"
on public.cad_file_revisions
for update
to authenticated
using (public.is_active_member_of_organization(organization_id))
with check (public.is_active_member_of_organization(organization_id));

create policy "CAD file revisions are deletable by active organization members"
on public.cad_file_revisions
for delete
to authenticated
using (public.is_active_member_of_organization(organization_id));
