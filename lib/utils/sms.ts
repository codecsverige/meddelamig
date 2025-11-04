/**
 * Calculates the number of SMS segments needed for a message
 * Standard SMS: 160 chars
 * Unicode SMS (with special chars): 70 chars
 * @param message - The SMS message
 * @returns Number of segments
 */
export function calculateSMSSegments(message: string): number {
  // Check if message contains unicode characters
  const hasUnicode = /[^\x00-\x7F]/.test(message);
  
  const limit = hasUnicode ? 70 : 160;
  const length = message.length;
  
  if (length === 0) return 0;
  if (length <= limit) return 1;
  
  // For multi-part messages, limits are reduced
  const multiPartLimit = hasUnicode ? 67 : 153;
  return Math.ceil(length / multiPartLimit);
}

/**
 * Validates SMS message length
 * @param message - The SMS message
 * @param maxSegments - Maximum allowed segments (default: 10)
 * @returns true if valid
 */
export function validateSMSLength(message: string, maxSegments: number = 10): boolean {
  const segments = calculateSMSSegments(message);
  return segments > 0 && segments <= maxSegments;
}

/**
 * Replaces template variables in SMS message
 * @param template - Template string with {{variables}}
 * @param variables - Object with variable values
 * @returns Message with replaced variables
 */
export function replaceSMSVariables(
  template: string,
  variables: Record<string, string>
): string {
  let message = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    message = message.replace(regex, value);
  });
  
  return message;
}

/**
 * Extracts variable names from SMS template
 * @param template - Template string
 * @returns Array of variable names
 */
export function extractSMSVariables(template: string): string[] {
  const regex = /{{(\w+)}}/g;
  const matches = template.matchAll(regex);
  return Array.from(matches, match => match[1]);
}

/**
 * Adds GDPR-compliant opt-out text to SMS
 * @param message - Original message
 * @returns Message with opt-out text
 */
export function addOptOutText(message: string): string {
  const optOut = '\n\nSvara STOP för att avsluta.';
  
  // Check if opt-out text already exists
  if (message.includes('STOP') || message.includes('stop')) {
    return message;
  }
  
  return message + optOut;
}

/**
 * Sanitizes SMS message (removes invalid characters)
 * @param message - Original message
 * @returns Sanitized message
 */
export function sanitizeSMSMessage(message: string): string {
  // Remove zero-width characters and other invisible unicode
  return message
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim();
}

/**
 * Calculates estimated cost for SMS
 * @param message - SMS message
 * @param pricePerSMS - Price per SMS segment (default: 0.35 SEK for 46elks)
 * @returns Estimated cost in SEK
 */
export function calculateSMSCost(message: string, pricePerSMS: number = 0.35): number {
  const segments = calculateSMSSegments(message);
  return segments * pricePerSMS;
}
