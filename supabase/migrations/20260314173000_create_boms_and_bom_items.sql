create table public.boms (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  product_revision_id uuid not null references public.product_revisions (id) on delete cascade,
  name text not null,
  status text not null default 'draft',
  notes text,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint boms_product_revision_id_key unique (product_revision_id)
);

create table public.bom_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  bom_id uuid not null references public.boms (id) on delete cascade,
  parent_bom_item_id uuid references public.bom_items (id) on delete cascade,
  part_revision_id uuid not null references public.part_revisions (id) on delete restrict,
  line_number integer not null,
  quantity numeric(12,4) not null,
  unit_of_measure text,
  reference_designator text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint bom_items_line_number_check check (line_number > 0),
  constraint bom_items_quantity_check check (quantity > 0)
);

create index boms_organization_id_idx
  on public.boms (organization_id);

create index boms_product_revision_id_idx
  on public.boms (product_revision_id);

create index boms_created_by_idx
  on public.boms (created_by);

create index bom_items_organization_id_idx
  on public.bom_items (organization_id);

create index bom_items_bom_id_idx
  on public.bom_items (bom_id);

create index bom_items_parent_bom_item_id_idx
  on public.bom_items (parent_bom_item_id);

create index bom_items_part_revision_id_idx
  on public.bom_items (part_revision_id);

create trigger set_boms_updated_at
before update on public.boms
for each row
execute function public.set_updated_at();

create trigger set_bom_items_updated_at
before update on public.bom_items
for each row
execute function public.set_updated_at();

alter table public.boms enable row level security;
alter table public.bom_items enable row level security;

create policy "BOMs are viewable by active organization members"
on public.boms
for select
to authenticated
using (public.is_active_member_of_organization(organization_id));

create policy "BOMs are insertable by active organization members"
on public.boms
for insert
to authenticated
with check (public.is_active_member_of_organization(organization_id));

create policy "BOMs are updatable by active organization members"
on public.boms
for update
to authenticated
using (public.is_active_member_of_organization(organization_id))
with check (public.is_active_member_of_organization(organization_id));

create policy "BOMs are deletable by active organization members"
on public.boms
for delete
to authenticated
using (public.is_active_member_of_organization(organization_id));

create policy "BOM items are viewable by active organization members"
on public.bom_items
for select
to authenticated
using (public.is_active_member_of_organization(organization_id));

create policy "BOM items are insertable by active organization members"
on public.bom_items
for insert
to authenticated
with check (public.is_active_member_of_organization(organization_id));

create policy "BOM items are updatable by active organization members"
on public.bom_items
for update
to authenticated
using (public.is_active_member_of_organization(organization_id))
with check (public.is_active_member_of_organization(organization_id));

create policy "BOM items are deletable by active organization members"
on public.bom_items
for delete
to authenticated
using (public.is_active_member_of_organization(organization_id));
