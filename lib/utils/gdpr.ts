/**
 * GDPR Compliance utilities for MEDDELA
 */

export interface ConsentRecord {
  sms_consent: boolean;
  marketing_consent: boolean;
  consent_date: string;
  consent_source: string;
}

/**
 * Creates a consent record for a new contact
 * @param source - Source of consent (e.g., 'manual', 'import', 'booking_system')
 * @param marketingConsent - Whether marketing consent was given
 * @returns Consent record
 */
export function createConsentRecord(
  source: string,
  marketingConsent: boolean = false
): ConsentRecord {
  return {
    sms_consent: true, // Required for service SMS
    marketing_consent: marketingConsent,
    consent_date: new Date().toISOString(),
    consent_source: source,
  };
}

/**
 * Validates if marketing SMS can be sent to a contact
 * @param contact - Contact with consent information
 * @returns true if marketing is allowed
 */
export function canSendMarketingSMS(contact: {
  sms_consent: boolean;
  marketing_consent: boolean;
}): boolean {
  return contact.sms_consent && contact.marketing_consent;
}

/**
 * Validates if service SMS can be sent to a contact
 * @param contact - Contact with consent information
 * @returns true if service SMS is allowed
 */
export function canSendServiceSMS(contact: {
  sms_consent: boolean;
}): boolean {
  return contact.sms_consent;
}

/**
 * Generates GDPR-compliant privacy policy text
 * @param orgName - Organization name
 * @returns Privacy policy text for SMS
 */
export function getPrivacyPolicyText(orgName: string): string {
  return `
Dataskyddsinformation för ${orgName}

Vi behandlar dina personuppgifter (namn, telefonnummer, e-post) för att:
- Skicka bokningsbekräftelser och påminnelser
- Förbättra vår service

Du har rätt att:
✓ Få tillgång till dina uppgifter
✓ Rätta felaktiga uppgifter
✓ Radera dina uppgifter
✓ Invända mot behandling

Kontakta oss för att utöva dina rättigheter.
Svara STOP för att avsluta SMS-påminnelser.
`.trim();
}

/**
 * Logs a GDPR-related action for audit trail
 * @param action - Action type
 * @param details - Additional details
 * @returns Audit log entry
 */
export function createGDPRAuditLog(
  action: 'consent_given' | 'consent_withdrawn' | 'data_export' | 'data_deletion',
  details: Record<string, any>
) {
  return {
    action,
    resource_type: 'gdpr_action',
    details: {
      ...details,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Checks if a contact's data should be deleted (GDPR right to be forgotten)
 * @param lastInteractionDate - Last interaction with the contact
 * @param retentionPeriodMonths - Data retention period in months (default: 36)
 * @returns true if data should be deleted
 */
export function shouldDeleteInactiveContact(
  lastInteractionDate: Date,
  retentionPeriodMonths: number = 36
): boolean {
  const monthsSinceLastInteraction = 
    (Date.now() - lastInteractionDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
  
  return monthsSinceLastInteraction > retentionPeriodMonths;
}

/**
 * Anonymizes contact data (for soft delete)
 * @param contact - Contact to anonymize
 * @returns Anonymized contact data
 */
export function anonymizeContact(contact: {
  name?: string | null;
  email?: string | null;
  phone: string;
}) {
  return {
    name: 'Raderad användare',
    email: null,
    phone: 'ANONYMIZED_' + Date.now(),
  };
}
