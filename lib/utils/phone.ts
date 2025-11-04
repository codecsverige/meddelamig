import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from 'libphonenumber-js';

/**
 * Validates and formats a phone number to E.164 format
 * @param phone - Phone number to validate
 * @param country - Default country code (defaults to 'SE' for Sweden)
 * @returns Formatted phone number in E.164 format or null if invalid
 */
export function formatPhoneNumber(phone: string, country: CountryCode = 'SE'): string | null {
  try {
    // Remove common formatting characters
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    // Check if valid
    if (!isValidPhoneNumber(cleaned, country)) {
      return null;
    }
    
    // Parse and format to E.164
    const phoneNumber = parsePhoneNumber(cleaned, country);
    return phoneNumber.format('E.164');
  } catch (error) {
    return null;
  }
}

/**
 * Validates a phone number
 * @param phone - Phone number to validate
 * @param country - Default country code
 * @returns true if valid
 */
export function validatePhoneNumber(phone: string, country: CountryCode = 'SE'): boolean {
  try {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    return isValidPhoneNumber(cleaned, country);
  } catch {
    return false;
  }
}

/**
 * Formats a phone number for display (national format)
 * @param phone - Phone number in E.164 format
 * @returns Formatted phone number for display
 */
export function displayPhoneNumber(phone: string): string {
  try {
    const phoneNumber = parsePhoneNumber(phone);
    return phoneNumber.formatNational();
  } catch {
    return phone;
  }
}

/**
 * Extracts country code from phone number
 * @param phone - Phone number in E.164 format
 * @returns Country code or null
 */
export function getCountryCode(phone: string): string | null {
  try {
    const phoneNumber = parsePhoneNumber(phone);
    return phoneNumber.country || null;
  } catch {
    return null;
  }
}
