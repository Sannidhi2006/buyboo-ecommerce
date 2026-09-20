-- Phase 7: soft account deactivation and JWT invalidation version.
ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE AFTER phone;
ALTER TABLE users ADD COLUMN auth_version INT NOT NULL DEFAULT 0 AFTER is_active;
