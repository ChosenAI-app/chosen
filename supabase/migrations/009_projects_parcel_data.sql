ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS lot_size_sqft integer,
  ADD COLUMN IF NOT EXISTS year_built integer,
  ADD COLUMN IF NOT EXISTS zoning text,
  ADD COLUMN IF NOT EXISTS zoning_description text,
  ADD COLUMN IF NOT EXISTS map_lat numeric(10,7),
  ADD COLUMN IF NOT EXISTS map_lng numeric(10,7),
  ADD COLUMN IF NOT EXISTS apn text;
