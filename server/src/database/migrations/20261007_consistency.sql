-- Run once through the migration runner, in a transaction, after a verified backup.
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version integer NOT NULL DEFAULT 0;
ALTER TABLE presentation_assignments ADD COLUMN IF NOT EXISTS presented_date date;
CREATE UNIQUE INDEX IF NOT EXISTS resident_year_unique ON resident_years(resident_id, year);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique ON users(lower(email));
-- Keep the active year with the most referenced rotations. Preserve all rows/history.
UPDATE academic_years SET is_active = false WHERE is_active AND id != (
 SELECT ay.id FROM academic_years ay LEFT JOIN yearly_rotations r ON r.academic_year_id = ay.id
 WHERE ay.is_active GROUP BY ay.id ORDER BY count(r.id) DESC, ay.id LIMIT 1
);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_academic_year ON academic_years(is_active) WHERE is_active;
-- Reconcile only one-to-one candidates: same resident, moderator, title, normalized type,
-- and presentation created while this assignment was being completed (within 5 minutes).
WITH candidates AS (
 SELECT a.id AS assignment_id, p.id AS presentation_id, p.date,
   count(*) OVER (PARTITION BY a.id) AS per_assignment,
   count(*) OVER (PARTITION BY p.id) AS per_presentation
 FROM presentation_assignments a JOIN presentations p ON p.resident_id = a.presenter_id
 AND p.supervisor_id = a.moderator_id AND p.title = a.title
 AND upper(replace(p.presentation_type, ' ', '_')) = upper(replace(a.presentation_type, ' ', '_'))
 AND p.created_at BETWEEN a.updated_at - interval '5 minutes' AND a.updated_at + interval '5 minutes'
 WHERE a.status = 'presented' AND a.presentation_id IS NULL
 AND NOT EXISTS (SELECT 1 FROM presentation_assignments linked WHERE linked.presentation_id = p.id)
)
UPDATE presentation_assignments a SET presentation_id = c.presentation_id, presented_date = c.date
FROM candidates c WHERE a.id = c.assignment_id AND c.per_assignment = 1 AND c.per_presentation = 1;
UPDATE presentations SET presentation_type = upper(replace(presentation_type, ' ', '_'));
UPDATE presentation_assignments SET presentation_type = upper(replace(presentation_type, ' ', '_'));
ALTER TABLE surgical_logs ADD CONSTRAINT surgical_rating_range CHECK (rating IS NULL OR rating BETWEEN 0 AND 100);
ALTER TABLE presentations ADD CONSTRAINT presentation_rating_range CHECK (rating IS NULL OR rating BETWEEN 0 AND 100);
ALTER TABLE surgical_logs ADD CONSTRAINT detachment_surgical_rating_range CHECK (detachment_rating IS NULL OR detachment_rating BETWEEN 0 AND 100);
ALTER TABLE presentations ADD CONSTRAINT detachment_presentation_rating_range CHECK (detachment_rating IS NULL OR detachment_rating BETWEEN 0 AND 100);
CREATE UNIQUE INDEX IF NOT EXISTS resident_year_owner_unique ON resident_years(id, resident_id);
ALTER TABLE surgical_logs ADD CONSTRAINT surgical_year_owner FOREIGN KEY (year_id, resident_id) REFERENCES resident_years(id, resident_id);
ALTER TABLE presentations ADD CONSTRAINT presentation_year_owner FOREIGN KEY (year_id, resident_id) REFERENCES resident_years(id, resident_id);
CREATE UNIQUE INDEX IF NOT EXISTS assignment_presentation_unique ON presentation_assignments(presentation_id) WHERE presentation_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS push_endpoint_unique ON push_subscriptions(endpoint);
CREATE TABLE IF NOT EXISTS notification_outbox (
 id bigserial PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 title text NOT NULL, body text NOT NULL, url text NOT NULL DEFAULT '/',
 attempts integer NOT NULL DEFAULT 0, next_attempt_at timestamptz NOT NULL DEFAULT now(),
 sent_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS scheduled_deliveries (
 event_key text PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS request_idempotency (
 user_id uuid NOT NULL REFERENCES users(id), request_key uuid NOT NULL, request_hash text NOT NULL,
 response jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id, request_key)
);
CREATE INDEX IF NOT EXISTS logs_resident_year_date ON surgical_logs(resident_id, year_id, date DESC);
CREATE INDEX IF NOT EXISTS presentations_resident_year_date ON presentations(resident_id, year_id, date DESC);
CREATE INDEX IF NOT EXISTS outbox_due ON notification_outbox(next_attempt_at) WHERE sent_at IS NULL;
