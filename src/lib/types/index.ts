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
  role: "contractor" | "architect" | "client";
  invited_email: string;
  invite_status: "pending" | "accepted";
  invited_at: string;
};
