-- =============================================================================
-- Chosen MVP — Palo Alto Permit Seed Data
-- Seeds permit_types, permit_requirements, and inspection_steps
-- for the City of Palo Alto jurisdiction.
-- =============================================================================

DO $$
DECLARE
  v_jurisdiction_id uuid;
  v_building_permit_id uuid;
  v_electrical_permit_id uuid;
  v_plumbing_permit_id uuid;
  v_mechanical_permit_id uuid;
  v_fire_review_id uuid;
  v_jadu_deed_id uuid;
  v_title24_id uuid;
  v_school_fee_id uuid;
  v_grading_id uuid;
BEGIN
  -- Capture Palo Alto jurisdiction
  SELECT id INTO v_jurisdiction_id FROM jurisdictions
  WHERE city = 'Palo Alto' AND state = 'CA' LIMIT 1;

  IF v_jurisdiction_id IS NULL THEN
    RAISE EXCEPTION 'Palo Alto jurisdiction not found — run schema.sql first';
  END IF;

  -- Idempotency guard
  IF EXISTS (SELECT 1 FROM permit_types WHERE jurisdiction_id = v_jurisdiction_id) THEN
    RAISE NOTICE 'Seed data already exists for Palo Alto — skipping';
    RETURN;
  END IF;

  -- ===========================================================================
  -- PERMIT TYPES (9 rows)
  -- ===========================================================================

  -- 1. Building Permit
  INSERT INTO permit_types (jurisdiction_id, name, description, display_order, required_for)
  VALUES (v_jurisdiction_id, 'Building Permit', NULL, 1, ARRAY['adu_detached','adu_attached','addition','remodel'])
  RETURNING id INTO v_building_permit_id;

  -- 2. Electrical Permit
  INSERT INTO permit_types (jurisdiction_id, name, description, display_order, required_for)
  VALUES (v_jurisdiction_id, 'Electrical Permit', NULL, 2, ARRAY['adu_detached','adu_attached','addition','remodel'])
  RETURNING id INTO v_electrical_permit_id;

  -- 3. Plumbing Permit
  INSERT INTO permit_types (jurisdiction_id, name, description, display_order, required_for)
  VALUES (v_jurisdiction_id, 'Plumbing Permit', NULL, 3, ARRAY['adu_detached','adu_attached','addition'])
  RETURNING id INTO v_plumbing_permit_id;

  -- 4. Mechanical Permit
  INSERT INTO permit_types (jurisdiction_id, name, description, display_order, required_for)
  VALUES (v_jurisdiction_id, 'Mechanical Permit', NULL, 4, ARRAY['adu_detached','adu_attached','addition'])
  RETURNING id INTO v_mechanical_permit_id;

  -- 5. Palo Alto Fire Department Review
  INSERT INTO permit_types (jurisdiction_id, name, description, display_order, required_for)
  VALUES (
    v_jurisdiction_id,
    'Palo Alto Fire Department Review',
    'Conditional — required if ADU is west of Hwy 280, main house has sprinklers, or ADU is 150+ ft from street. Contact Palo Alto Fire Prevention Bureau: 650-329-2184',
    5,
    ARRAY['adu_detached']
  )
  RETURNING id INTO v_fire_review_id;

  -- 6. JADU Deed Restriction Recording
  INSERT INTO permit_types (jurisdiction_id, name, description, display_order, required_for)
  VALUES (
    v_jurisdiction_id,
    'JADU Deed Restriction Recording',
    'Must be recorded with Santa Clara County Clerk-Recorder before building permit is issued. Owner must occupy primary dwelling or JADU.',
    5,
    ARRAY['adu_attached']
  )
  RETURNING id INTO v_jadu_deed_id;

  -- 7. Title 24 Energy Compliance
  INSERT INTO permit_types (jurisdiction_id, name, description, display_order, required_for)
  VALUES (
    v_jurisdiction_id,
    'Title 24 Energy Compliance',
    'California energy code compliance documentation. Required for new construction and additions.',
    6,
    ARRAY['adu_detached','adu_attached','addition']
  )
  RETURNING id INTO v_title24_id;

  -- 8. School District Fee Certificate
  INSERT INTO permit_types (jurisdiction_id, name, description, display_order, required_for)
  VALUES (
    v_jurisdiction_id,
    'School District Fee Certificate',
    'PAUSD fee: $4.79/SF on all new habitable square footage. ADUs under 500 SF exempt. Pay at PAUSD offices before permit issuance.',
    7,
    ARRAY['addition']
  )
  RETURNING id INTO v_school_fee_id;

  -- 9. Grading and Drainage Plan
  INSERT INTO permit_types (jurisdiction_id, name, description, display_order, required_for)
  VALUES (
    v_jurisdiction_id,
    'Grading and Drainage Plan',
    'Required if earthwork is involved. Submitted with building permit application.',
    8,
    ARRAY['adu_detached']
  )
  RETURNING id INTO v_grading_id;

  -- ===========================================================================
  -- PERMIT REQUIREMENTS (22 rows)
  -- ===========================================================================

  -- Building Permit documents (7 rows)
  INSERT INTO permit_requirements (permit_type_id, document_name, description, required, display_order)
  VALUES (v_building_permit_id, 'Site plan', 'Showing property lines, existing structures, proposed location, setbacks', true, 1);

  INSERT INTO permit_requirements (permit_type_id, document_name, description, required, display_order)
  VALUES (v_building_permit_id, 'Floor plans (existing and proposed)', 'At minimum 1/4"=1'' scale', true, 2);

  INSERT INTO permit_requirements (permit_type_id, document_name, description, required, display_order)
  VALUES (v_building_permit_id, 'Building elevations (all four sides)', NULL, true, 3);

  INSERT INTO permit_requirements (permit_type_id, document_name, description, required, display_order)
  VALUES (v_building_permit_id, 'Building sections', NULL, true, 4);

  INSERT INTO permit_requirements (permit_type_id, document_name, description, required, display_order)
  VALUES (v_building_permit_id, 'Structural calculations', 'Stamped by California-licensed structural engineer', true, 5);

  INSERT INTO permit_requirements (permit_type_id, document_name, description, required, display_order)
  VALUES (v_building_permit_id, 'Soils/geotechnical report', 'If required by building dept based on site conditions', false, 6);

  INSERT INTO permit_requirements (permit_type_id, document_name, description, required, display_order)
  VALUES (v_building_permit_id, 'CalGreen checklist', NULL, true, 7);

  -- Electrical Permit documents (2 rows)
  INSERT INTO permit_requirements (permit_type_id, document_name, description, required, display_order)
  VALUES (v_electrical_permit_id, 'Electrical plans', 'Showing panel location, circuits, load calculations', true, 1);

  INSERT INTO permit_requirements (permit_type_id, document_name, description, required, display_order)
  VALUES (v_electrical_permit_id, 'Load calculation worksheet', NULL, true, 2);

  -- Plumbing Permit documents (2 rows)
  INSERT INTO permit_requirements (permit_type_id, document_name, description, required, display_order)
  VALUES (v_plumbing_permit_id, 'Plumbing plans', 'Showing drain, waste, vent, and supply lines', true, 1);

  INSERT INTO permit_requirements (permit_type_id, document_name, description, required, display_order)
  VALUES (v_plumbing_permit_id, 'Fixture schedule', NULL, true, 2);

  -- Mechanical Permit documents (2 rows)
  INSERT INTO permit_requirements (permit_type_id, document_name, description, required, display_order)
  VALUES (v_mechanical_permit_id, 'Mechanical/HVAC plans', 'Showing equipment location, duct layout', true, 1);

  INSERT INTO permit_requirements (permit_type_id, document_name, description, required, display_order)
  VALUES (v_mechanical_permit_id, 'Equipment specifications/cut sheets', NULL, true, 2);

  -- Fire Department Review documents (2 rows)
  INSERT INTO permit_requirements (permit_type_id, document_name, description, required, display_order)
  VALUES (v_fire_review_id, 'Fire sprinkler plans', 'If sprinklers required', false, 1);

  INSERT INTO permit_requirements (permit_type_id, document_name, description, required, display_order)
  VALUES (v_fire_review_id, 'PAFD residential plan review checklist', 'Completed checklist', true, 2);

  -- JADU Deed Restriction documents (2 rows)
  INSERT INTO permit_requirements (permit_type_id, document_name, description, required, display_order)
  VALUES (v_jadu_deed_id, 'Deed restriction form', 'Completed, notarized, and ready for recording', true, 1);

  INSERT INTO permit_requirements (permit_type_id, document_name, description, required, display_order)
  VALUES (v_jadu_deed_id, 'Santa Clara County Clerk-Recorder filing receipt', NULL, true, 2);

  -- Title 24 Energy Compliance documents (2 rows)
  INSERT INTO permit_requirements (permit_type_id, document_name, description, required, display_order)
  VALUES (v_title24_id, 'Title 24 compliance report (CF1R)', NULL, true, 1);

  INSERT INTO permit_requirements (permit_type_id, document_name, description, required, display_order)
  VALUES (v_title24_id, 'HERS verification (CF2R/CF3R)', 'If required', false, 2);

  -- School District Fee Certificate documents (1 row)
  INSERT INTO permit_requirements (permit_type_id, document_name, description, required, display_order)
  VALUES (v_school_fee_id, 'PAUSD fee payment receipt', NULL, true, 1);

  -- Grading and Drainage Plan documents (2 rows)
  INSERT INTO permit_requirements (permit_type_id, document_name, description, required, display_order)
  VALUES (v_grading_id, 'Grading plan', 'Stamped by licensed civil engineer', true, 1);

  INSERT INTO permit_requirements (permit_type_id, document_name, description, required, display_order)
  VALUES (v_grading_id, 'Drainage calculations', NULL, true, 2);

  -- ===========================================================================
  -- INSPECTION STEPS (15 rows) — Building Permit only
  -- ===========================================================================

  INSERT INTO inspection_steps (permit_type_id, name, description, display_order, prerequisite_ids)
  VALUES (v_building_permit_id, 'Foundation/Footing', 'Before concrete pour', 1, ARRAY[]::uuid[]);

  INSERT INTO inspection_steps (permit_type_id, name, description, display_order, prerequisite_ids)
  VALUES (v_building_permit_id, 'Underground Plumbing', 'Before backfill', 2, ARRAY[]::uuid[]);

  INSERT INTO inspection_steps (permit_type_id, name, description, display_order, prerequisite_ids)
  VALUES (v_building_permit_id, 'Underground Electrical Conduit', 'Before backfill', 3, ARRAY[]::uuid[]);

  INSERT INTO inspection_steps (permit_type_id, name, description, display_order, prerequisite_ids)
  VALUES (v_building_permit_id, 'Framing', 'After framing complete, before insulation', 4, ARRAY[]::uuid[]);

  INSERT INTO inspection_steps (permit_type_id, name, description, display_order, prerequisite_ids)
  VALUES (v_building_permit_id, 'Rough Electrical', 'After framing, before drywall', 5, ARRAY[]::uuid[]);

  INSERT INTO inspection_steps (permit_type_id, name, description, display_order, prerequisite_ids)
  VALUES (v_building_permit_id, 'Rough Plumbing', 'After framing, before drywall', 6, ARRAY[]::uuid[]);

  INSERT INTO inspection_steps (permit_type_id, name, description, display_order, prerequisite_ids)
  VALUES (v_building_permit_id, 'Rough Mechanical/HVAC', 'After framing, before drywall', 7, ARRAY[]::uuid[]);

  INSERT INTO inspection_steps (permit_type_id, name, description, display_order, prerequisite_ids)
  VALUES (v_building_permit_id, 'Insulation', 'After all rough inspections pass', 8, ARRAY[]::uuid[]);

  INSERT INTO inspection_steps (permit_type_id, name, description, display_order, prerequisite_ids)
  VALUES (v_building_permit_id, 'Drywall Nailing', 'If required by inspector', 9, ARRAY[]::uuid[]);

  INSERT INTO inspection_steps (permit_type_id, name, description, display_order, prerequisite_ids)
  VALUES (v_building_permit_id, 'Final Electrical', NULL, 10, ARRAY[]::uuid[]);

  INSERT INTO inspection_steps (permit_type_id, name, description, display_order, prerequisite_ids)
  VALUES (v_building_permit_id, 'Final Plumbing', NULL, 11, ARRAY[]::uuid[]);

  INSERT INTO inspection_steps (permit_type_id, name, description, display_order, prerequisite_ids)
  VALUES (v_building_permit_id, 'Final Mechanical', NULL, 12, ARRAY[]::uuid[]);

  INSERT INTO inspection_steps (permit_type_id, name, description, display_order, prerequisite_ids)
  VALUES (v_building_permit_id, 'Final Building', NULL, 13, ARRAY[]::uuid[]);

  INSERT INTO inspection_steps (permit_type_id, name, description, display_order, prerequisite_ids)
  VALUES (v_building_permit_id, 'Fire Final', 'If fire review required, scheduled through Palo Alto Fire Prevention Bureau', 14, ARRAY[]::uuid[]);

  INSERT INTO inspection_steps (permit_type_id, name, description, display_order, prerequisite_ids)
  VALUES (v_building_permit_id, 'Certificate of Occupancy', 'Issued after all finals pass, required before occupancy', 15, ARRAY[]::uuid[]);

  RAISE NOTICE 'Seeded: 9 permit_types, 22 permit_requirements, 15 inspection_steps';
END $$;
