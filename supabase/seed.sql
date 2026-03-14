do $$
declare
  demo_org_id uuid := '11111111-1111-1111-1111-111111111111';
  demo_product_id uuid := '22222222-2222-2222-2222-222222222221';
  demo_product_revision_id uuid := '22222222-2222-2222-2222-222222222222';
  demo_bom_id uuid := '22222222-2222-2222-2222-222222222223';
  demo_bom_item_a_id uuid := '22222222-2222-2222-2222-222222222224';
  demo_bom_item_b_id uuid := '22222222-2222-2222-2222-222222222225';
  demo_part_a_id uuid := '33333333-3333-3333-3333-333333333331';
  demo_part_a_revision_id uuid := '33333333-3333-3333-3333-333333333332';
  demo_part_b_id uuid := '44444444-4444-4444-4444-444444444441';
  demo_part_b_revision_id uuid := '44444444-4444-4444-4444-444444444442';
  demo_document_id uuid := '55555555-5555-5555-5555-555555555551';
  demo_document_revision_id uuid := '55555555-5555-5555-5555-555555555552';
  demo_cad_file_id uuid := '66666666-6666-6666-6666-666666666661';
  demo_cad_file_revision_id uuid := '66666666-6666-6666-6666-666666666662';
  demo_specification_id uuid := '77777777-7777-7777-7777-777777777771';
  demo_requirement_id uuid := '77777777-7777-7777-7777-777777777772';
begin
  if to_regclass('public.organizations') is not null then
    insert into public.organizations (
      id,
      name,
      slug,
      industry,
      primary_site_name
    )
    values (
      demo_org_id,
      'Acme Medical Devices',
      'acme-medical-devices',
      'Medical devices',
      'Austin Manufacturing'
    )
    on conflict (id) do update
    set
      name = excluded.name,
      slug = excluded.slug,
      industry = excluded.industry,
      primary_site_name = excluded.primary_site_name;
  end if;

  if to_regclass('public.products') is not null then
    insert into public.products (
      id,
      organization_id,
      product_code,
      name,
      description,
      category,
      lifecycle_status,
      owner_user_id,
      current_revision_id
    )
    values (
      demo_product_id,
      demo_org_id,
      'NXG-2408',
      'Ventilator Controller',
      'Portable ventilator controller for regulated medical device programs.',
      'Respiratory systems',
      'review',
      null,
      null
    )
    on conflict (id) do update
    set
      product_code = excluded.product_code,
      name = excluded.name,
      description = excluded.description,
      category = excluded.category,
      lifecycle_status = excluded.lifecycle_status;
  end if;

  if to_regclass('public.product_revisions') is not null then
    insert into public.product_revisions (
      id,
      organization_id,
      product_id,
      revision_code,
      status,
      summary,
      released_at,
      released_by
    )
    values (
      demo_product_revision_id,
      demo_org_id,
      demo_product_id,
      'B',
      'released',
      'Released controller revision used for supplier and quality demo flows.',
      timezone('utc', now()),
      null
    )
    on conflict (id) do update
    set
      revision_code = excluded.revision_code,
      status = excluded.status,
      summary = excluded.summary,
      released_at = excluded.released_at;
  end if;

  if to_regclass('public.products') is not null
    and to_regclass('public.product_revisions') is not null then
    update public.products
    set current_revision_id = demo_product_revision_id
    where id = demo_product_id;
  end if;

  if to_regclass('public.parts') is not null then
    insert into public.parts (
      id,
      organization_id,
      part_number,
      name,
      description,
      part_type,
      unit_of_measure,
      lifecycle_status,
      preferred_supplier_id,
      current_revision_id
    )
    values
      (
        demo_part_a_id,
        demo_org_id,
        'PCB-1001',
        'Main Controller PCB',
        'Primary control board assembly for the ventilator controller.',
        'assembly',
        'ea',
        'released',
        null,
        null
      ),
      (
        demo_part_b_id,
        demo_org_id,
        'BAT-2100',
        'Battery Pack',
        'Rechargeable battery pack for portable runtime support.',
        'component',
        'ea',
        'review',
        null,
        null
      )
    on conflict (id) do update
    set
      part_number = excluded.part_number,
      name = excluded.name,
      description = excluded.description,
      part_type = excluded.part_type,
      unit_of_measure = excluded.unit_of_measure,
      lifecycle_status = excluded.lifecycle_status;
  end if;

  if to_regclass('public.part_revisions') is not null then
    insert into public.part_revisions (
      id,
      organization_id,
      part_id,
      revision_code,
      status,
      summary,
      released_at,
      released_by
    )
    values
      (
        demo_part_a_revision_id,
        demo_org_id,
        demo_part_a_id,
        'C',
        'released',
        'Released PCB assembly used in the launch demo.',
        timezone('utc', now()),
        null
      ),
      (
        demo_part_b_revision_id,
        demo_org_id,
        demo_part_b_id,
        'A',
        'review',
        'Battery pack revision pending final quality sign-off.',
        null,
        null
      )
    on conflict (id) do update
    set
      revision_code = excluded.revision_code,
      status = excluded.status,
      summary = excluded.summary,
      released_at = excluded.released_at;
  end if;

  if to_regclass('public.parts') is not null
    and to_regclass('public.part_revisions') is not null then
    update public.parts
    set current_revision_id = case
      when id = demo_part_a_id then demo_part_a_revision_id
      when id = demo_part_b_id then demo_part_b_revision_id
      else current_revision_id
    end
    where id in (demo_part_a_id, demo_part_b_id);
  end if;

  if to_regclass('public.boms') is not null then
    insert into public.boms (
      id,
      organization_id,
      product_revision_id,
      name,
      status,
      notes,
      created_by
    )
    values (
      demo_bom_id,
      demo_org_id,
      demo_product_revision_id,
      'Ventilator Controller Released BOM',
      'released',
      'Baseline manufacturing BOM for the ventilator controller demo.',
      null
    )
    on conflict (id) do update
    set
      product_revision_id = excluded.product_revision_id,
      name = excluded.name,
      status = excluded.status,
      notes = excluded.notes;
  end if;

  if to_regclass('public.bom_items') is not null then
    insert into public.bom_items (
      id,
      organization_id,
      bom_id,
      parent_bom_item_id,
      part_revision_id,
      line_number,
      quantity,
      unit_of_measure,
      reference_designator,
      notes
    )
    values
      (
        demo_bom_item_a_id,
        demo_org_id,
        demo_bom_id,
        null,
        demo_part_a_revision_id,
        10,
        1.0000,
        'ea',
        'PCB-A1',
        'Primary controller assembly.'
      ),
      (
        demo_bom_item_b_id,
        demo_org_id,
        demo_bom_id,
        null,
        demo_part_b_revision_id,
        20,
        1.0000,
        'ea',
        'BAT-1',
        'Battery module for portable use.'
      )
    on conflict (id) do update
    set
      bom_id = excluded.bom_id,
      parent_bom_item_id = excluded.parent_bom_item_id,
      part_revision_id = excluded.part_revision_id,
      line_number = excluded.line_number,
      quantity = excluded.quantity,
      unit_of_measure = excluded.unit_of_measure,
      reference_designator = excluded.reference_designator,
      notes = excluded.notes;
  end if;

  if to_regclass('public.documents') is not null then
    insert into public.documents (
      id,
      organization_id,
      document_number,
      title,
      document_type,
      owner_entity_type,
      owner_entity_id,
      status,
      current_revision_id,
      created_by
    )
    values (
      demo_document_id,
      demo_org_id,
      'DOC-2408-01',
      'Ventilator Controller Assembly Drawing',
      'drawing',
      'product',
      demo_product_id,
      'released',
      null,
      null
    )
    on conflict (id) do update
    set
      document_number = excluded.document_number,
      title = excluded.title,
      document_type = excluded.document_type,
      owner_entity_type = excluded.owner_entity_type,
      owner_entity_id = excluded.owner_entity_id,
      status = excluded.status;
  end if;

  if to_regclass('public.document_revisions') is not null then
    insert into public.document_revisions (
      id,
      organization_id,
      document_id,
      revision_code,
      file_name,
      storage_bucket,
      storage_path,
      mime_type,
      file_size_bytes,
      checksum,
      status,
      uploaded_by,
      change_request_id
    )
    values (
      demo_document_revision_id,
      demo_org_id,
      demo_document_id,
      'B',
      'ventilator-controller-assembly-drawing-rev-b.pdf',
      'documents',
      'demo/ventilator-controller/assembly-drawing-rev-b.pdf',
      'application/pdf',
      2483200,
      'demo-checksum-assembly-drawing-rev-b',
      'released',
      null,
      null
    )
    on conflict (id) do update
    set
      revision_code = excluded.revision_code,
      file_name = excluded.file_name,
      storage_bucket = excluded.storage_bucket,
      storage_path = excluded.storage_path,
      mime_type = excluded.mime_type,
      file_size_bytes = excluded.file_size_bytes,
      checksum = excluded.checksum,
      status = excluded.status;
  end if;

  if to_regclass('public.documents') is not null
    and to_regclass('public.document_revisions') is not null then
    update public.documents
    set current_revision_id = demo_document_revision_id
    where id = demo_document_id;
  end if;

  if to_regclass('public.cad_files') is not null then
    insert into public.cad_files (
      id,
      organization_id,
      cad_number,
      title,
      cad_type,
      owner_entity_type,
      owner_entity_id,
      status,
      current_revision_id,
      created_by
    )
    values (
      demo_cad_file_id,
      demo_org_id,
      'CAD-2408-01',
      'Ventilator Controller Enclosure',
      '3d-model',
      'product',
      demo_product_id,
      'released',
      null,
      null
    )
    on conflict (id) do update
    set
      cad_number = excluded.cad_number,
      title = excluded.title,
      cad_type = excluded.cad_type,
      owner_entity_type = excluded.owner_entity_type,
      owner_entity_id = excluded.owner_entity_id,
      status = excluded.status;
  end if;

  if to_regclass('public.cad_file_revisions') is not null then
    insert into public.cad_file_revisions (
      id,
      organization_id,
      cad_file_id,
      revision_code,
      file_name,
      storage_bucket,
      storage_path,
      viewer_url,
      mime_type,
      file_size_bytes,
      checksum,
      status,
      uploaded_by,
      change_request_id
    )
    values (
      demo_cad_file_revision_id,
      demo_org_id,
      demo_cad_file_id,
      'B',
      'ventilator-controller-enclosure-rev-b.step',
      'cad-files',
      'demo/ventilator-controller/enclosure-rev-b.step',
      'https://viewer.example.com/demo/ventilator-controller/enclosure-rev-b',
      'model/step',
      9234432,
      'demo-checksum-enclosure-rev-b',
      'released',
      null,
      null
    )
    on conflict (id) do update
    set
      revision_code = excluded.revision_code,
      file_name = excluded.file_name,
      storage_bucket = excluded.storage_bucket,
      storage_path = excluded.storage_path,
      viewer_url = excluded.viewer_url,
      mime_type = excluded.mime_type,
      file_size_bytes = excluded.file_size_bytes,
      checksum = excluded.checksum,
      status = excluded.status;
  end if;

  if to_regclass('public.cad_files') is not null
    and to_regclass('public.cad_file_revisions') is not null then
    update public.cad_files
    set current_revision_id = demo_cad_file_revision_id
    where id = demo_cad_file_id;
  end if;

  if to_regclass('public.specifications') is not null then
    insert into public.specifications (
      id,
      organization_id,
      spec_code,
      title,
      description,
      owner_entity_type,
      owner_entity_id,
      status,
      created_by
    )
    values (
      demo_specification_id,
      demo_org_id,
      'SPEC-2408-01',
      'Ventilator Controller Electrical Specification',
      'Electrical and interface constraints for the ventilator controller assembly.',
      'product',
      demo_product_id,
      'released',
      null
    )
    on conflict (id) do update
    set
      spec_code = excluded.spec_code,
      title = excluded.title,
      description = excluded.description,
      owner_entity_type = excluded.owner_entity_type,
      owner_entity_id = excluded.owner_entity_id,
      status = excluded.status;
  end if;

  if to_regclass('public.requirements') is not null then
    insert into public.requirements (
      id,
      organization_id,
      requirement_code,
      title,
      description,
      requirement_type,
      priority,
      owner_entity_type,
      owner_entity_id,
      status,
      created_by
    )
    values (
      demo_requirement_id,
      demo_org_id,
      'REQ-2408-01',
      'Controller must support 4-hour portable operation',
      'The controller and battery system must sustain nominal operation for at least four hours.',
      'performance',
      'high',
      'product',
      demo_product_id,
      'approved',
      null
    )
    on conflict (id) do update
    set
      requirement_code = excluded.requirement_code,
      title = excluded.title,
      description = excluded.description,
      requirement_type = excluded.requirement_type,
      priority = excluded.priority,
      owner_entity_type = excluded.owner_entity_type,
      owner_entity_id = excluded.owner_entity_id,
      status = excluded.status;
  end if;
end
$$;
