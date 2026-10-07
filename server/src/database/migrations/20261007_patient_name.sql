-- Additive and nullable: historical MRNs must not be used to invent patient names.
ALTER TABLE surgical_logs ADD COLUMN IF NOT EXISTS patient_name VARCHAR(200);
