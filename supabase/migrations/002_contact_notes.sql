-- Contact notes / timeline events
CREATE TABLE contact_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  note_type TEXT NOT NULL DEFAULT 'note' CHECK (note_type IN ('note', 'task', 'alert')),
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contact_notes_contact ON contact_notes(contact_id, created_at DESC);
CREATE INDEX idx_contact_notes_org ON contact_notes(organization_id);

ALTER TABLE contact_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notes for their contacts"
  ON contact_notes FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert notes for their contacts"
  ON contact_notes FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete their notes"
  ON contact_notes FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    ) AND (author_id = auth.uid() OR author_id IS NULL)
  );
