-- Add birthday and anniversary tracking to contacts
-- This enables automated birthday wishes and special occasion campaigns

ALTER TABLE contacts 
ADD COLUMN birthday DATE,
ADD COLUMN anniversary_date DATE,
ADD COLUMN notes TEXT;

-- Create index for birthday queries (upcoming birthdays)
CREATE INDEX idx_contacts_birthday ON contacts(birthday) WHERE birthday IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_contacts_anniversary ON contacts(anniversary_date) WHERE anniversary_date IS NOT NULL AND deleted_at IS NULL;

-- Create a view for upcoming birthdays (next 7 days)
CREATE OR REPLACE VIEW upcoming_birthdays AS
SELECT 
  c.*,
  EXTRACT(DAY FROM (
    DATE_TRUNC('year', CURRENT_DATE) + 
    (EXTRACT(MONTH FROM c.birthday) - 1) * INTERVAL '1 month' +
    (EXTRACT(DAY FROM c.birthday) - 1) * INTERVAL '1 day'
  ) - CURRENT_DATE) as days_until_birthday
FROM contacts c
WHERE c.birthday IS NOT NULL 
  AND c.deleted_at IS NULL
  AND (
    (EXTRACT(MONTH FROM c.birthday) = EXTRACT(MONTH FROM CURRENT_DATE) AND 
     EXTRACT(DAY FROM c.birthday) >= EXTRACT(DAY FROM CURRENT_DATE))
    OR
    (EXTRACT(MONTH FROM c.birthday) = EXTRACT(MONTH FROM CURRENT_DATE + INTERVAL '7 days') AND
     EXTRACT(DAY FROM c.birthday) <= EXTRACT(DAY FROM CURRENT_DATE + INTERVAL '7 days'))
  );

-- Comment for documentation
COMMENT ON COLUMN contacts.birthday IS 'Contact birthday for automated wishes and campaigns';
COMMENT ON COLUMN contacts.anniversary_date IS 'Anniversary date (first visit, membership, etc.)';
COMMENT ON VIEW upcoming_birthdays IS 'View of contacts with birthdays in the next 7 days';
