ALTER TABLE users ADD COLUMN biometric_id TEXT;
ALTER TABLE attendance ADD COLUMN source TEXT DEFAULT 'app';
ALTER TABLE attendance ADD COLUMN external_id TEXT;
ALTER TABLE notifications ADD COLUMN read_at DATETIME;
