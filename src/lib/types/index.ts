export type Jurisdiction = {
  id: string;
  name: string;
  city: string;
  state: string;
  zip_codes: string[];
  created_at: string;
};

export type Project = {
  id: string;
  user_id: string;
  address: string;
  city: string;
  zip_code: string;
  project_type: string;
  scope_description: string | null;
  jurisdiction_id: string;
  created_at: string;
};

export type PermitType = {
  id: string;
  jurisdiction_id: string;
  name: string;
  description: string | null;
  display_order: number;
  required_for: string[];
};

export type PermitRequirement = {
  id: string;
  permit_type_id: string;
  document_name: string;
  description: string | null;
  required: boolean;
  display_order: number;
};

export type InspectionStep = {
  id: string;
  permit_type_id: string;
  name: string;
  description: string | null;
  display_order: number;
  prerequisite_ids: string[];
};

export type ProjectPermit = {
  id: string;
  project_id: string;
  permit_type_id: string;
  status: string;
  submitted_at: string | null;
  notes: string | null;
  created_at: string;
};

export type ProjectDocument = {
  id: string;
  project_id: string;
  permit_requirement_id: string;
  file_name: string;
  file_url: string;
  uploaded_by: string;
  uploaded_at: string;
  status: string;
};

export type TeamMember = {
  id: string;
  project_id: string;
  user_id: string | null;
  role: "contractor" | "co_owner" | "architect" | "engineer" | "inspector" | "client";
  invited_email: string;
  invite_status: "pending" | "accepted";
  invited_at: string;
};

export type HomeownerProject = {
  id: string;
  homeowner_id: string;
  address: string;
  zip_code: string;
  jurisdiction_id: string | null;
  project_type: string;
  description: string | null;
  ai_scope_summary: string | null;
  ai_permit_checklist: { name: string; description: string; required: boolean }[] | null;
  ai_cost_estimate_low: number | null;
  ai_cost_estimate_high: number | null;
  ai_timeline_weeks_low: number | null;
  ai_timeline_weeks_high: number | null;
  ai_feasibility_notes: string | null;
  ai_generated_at: string | null;
  regrid_parcel_id: string | null;
  lot_size_sqft: number | null;
  existing_sqft: number | null;
  year_built: number | null;
  zoning: string | null;
  zoning_description: string | null;
  parcel_geometry: unknown | null;
  fire_west_of_280: boolean;
  fire_sprinklers_exist: boolean;
  has_earthwork: boolean;
  status: string;
  map_lat: number | null;
  map_lng: number | null;
  map_heading: number | null;
  map_tilt: number | null;
  map_altitude: number | null;
  contractor_project_id: string | null;
  created_at: string;
  updated_at: string;
};
