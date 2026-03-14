create or replace function public.slugify(value text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(value, 'workspace')), '[^a-z0-9]+', '-', 'g'))
$$;

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_organization_id uuid;
  target_organization_id uuid;
  organization_name text;
  organization_slug text;
  requested_role text;
begin
  organization_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'organization_name', '')), '');

  begin
    requested_organization_id := nullif(new.raw_user_meta_data ->> 'organization_id', '')::uuid;
  exception
    when others then
      requested_organization_id := null;
  end;

  if requested_organization_id is not null
    and exists (
      select 1
      from public.organizations
      where id = requested_organization_id
    ) then
    target_organization_id := requested_organization_id;
  else
    if organization_name is null then
      organization_name := 'New workspace';
    end if;

    organization_slug := public.slugify(organization_name);

    if organization_slug = '' then
      organization_slug := 'workspace';
    end if;

    organization_slug := organization_slug || '-' || substring(replace(new.id::text, '-', '') from 1 for 8);

    insert into public.organizations (
      id,
      name,
      slug
    )
    values (
      gen_random_uuid(),
      organization_name,
      organization_slug
    )
    returning id into target_organization_id;
  end if;

  requested_role := lower(coalesce(new.raw_user_meta_data ->> 'role', 'engineer'));

  if requested_role not in ('admin', 'engineer', 'approver', 'supplier') then
    requested_role := 'engineer';
  end if;

  insert into public.users (
    id,
    organization_id,
    full_name,
    email,
    role,
    job_title,
    is_active,
    timezone
  )
  values (
    new.id,
    target_organization_id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    coalesce(new.email, ''),
    requested_role,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'job_title', '')), ''),
    true,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'timezone', '')), '')
  )
  on conflict (id) do update
  set
    organization_id = excluded.organization_id,
    full_name = coalesce(excluded.full_name, public.users.full_name),
    email = excluded.email,
    role = excluded.role,
    job_title = coalesce(excluded.job_title, public.users.job_title),
    is_active = true,
    timezone = coalesce(excluded.timezone, public.users.timezone);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_auth_user_created();
