-- Extend sms_messages with direction and inbound support
ALTER TABLE sms_messages
  ADD COLUMN direction TEXT NOT NULL DEFAULT 'outbound' CHECK (direction IN ('outbound', 'inbound'));

ALTER TABLE sms_messages
  ADD COLUMN from_phone TEXT;

-- Allow storing received messages
ALTER TABLE sms_messages DROP CONSTRAINT IF EXISTS sms_messages_status_check;
ALTER TABLE sms_messages
  ADD CONSTRAINT sms_messages_status_check
  CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'received'));

CREATE INDEX IF NOT EXISTS idx_sms_messages_contact_direction
  ON sms_messages(contact_id, direction, created_at DESC);
