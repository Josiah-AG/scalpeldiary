CREATE TABLE IF NOT EXISTS security_audit (
 id bigserial PRIMARY KEY, actor_id uuid NOT NULL REFERENCES users(id),
 action text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS security_audit_actor_date ON security_audit(actor_id,created_at DESC);
