/**
 * 46elks SMS API Client
 * Documentation: https://46elks.com/docs/send-sms
 */

interface SendSMSParams {
  to: string; // E.164 format: +46701234567
  message: string;
  from?: string; // Sender name (max 11 chars) or phone number
  whendelivered?: string; // Webhook URL for delivery status
  dryrun?: 'yes' | 'no'; // Test mode
}

interface SMSResponse {
  id: string;
  from: string;
  to: string;
  message: string;
  direction: 'outgoing';
  created: string;
  parts: number;
  cost: number;
  status?: 'created' | 'delivered' | 'failed';
}

interface SMSError {
  code: number;
  message: string;
}

export class ElksClient {
  private apiUsername: string;
  private apiPassword: string;
  private apiUrl: string = 'https://api.46elks.com/a1';

  constructor() {
    this.apiUsername = process.env.ELKS_API_USERNAME || '';
    this.apiPassword = process.env.ELKS_API_PASSWORD || '';

    if (!this.apiUsername || !this.apiPassword) {
      console.warn('⚠️ 46elks credentials not configured');
    }
  }

  /**
   * Send an SMS message
   * @param params - SMS parameters
   * @returns SMS response or error
   */
  async sendSMS(params: SendSMSParams): Promise<SMSResponse | SMSError> {
    try {
      const formData = new URLSearchParams();
      formData.append('to', params.to);
      formData.append('message', params.message);
      formData.append('from', params.from || process.env.ELKS_SENDER_NAME || 'MEDDELA');
      
      if (params.whendelivered) {
        formData.append('whendelivered', params.whendelivered);
      }
      
      if (params.dryrun) {
        formData.append('dryrun', params.dryrun);
      }

      const auth = Buffer.from(`${this.apiUsername}:${this.apiPassword}`).toString('base64');

      const response = await fetch(`${this.apiUrl}/sms`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          code: response.status,
          message: data.message || 'Failed to send SMS',
        } as SMSError;
      }

      return data as SMSResponse;
    } catch (error) {
      console.error('46elks API error:', error);
      return {
        code: 500,
        message: error instanceof Error ? error.message : 'Unknown error',
      } as SMSError;
    }
  }

  /**
   * Send bulk SMS messages
   * @param messages - Array of messages to send
   * @returns Array of responses
   */
  async sendBulkSMS(
    messages: Array<{ to: string; message: string; from?: string }>
  ): Promise<Array<SMSResponse | SMSError>> {
    const promises = messages.map(msg => this.sendSMS(msg));
    return Promise.all(promises);
  }

  /**
   * Get SMS history
   * @returns Array of SMS messages
   */
  async getHistory(): Promise<SMSResponse[]> {
    try {
      const auth = Buffer.from(`${this.apiUsername}:${this.apiPassword}`).toString('base64');

      const response = await fetch(`${this.apiUrl}/sms`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
        },
      });

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Failed to get SMS history:', error);
      return [];
    }
  }

  /**
   * Check account balance
   * @returns Balance in SEK
   */
  async getBalance(): Promise<number | null> {
    try {
      const auth = Buffer.from(`${this.apiUsername}:${this.apiPassword}`).toString('base64');

      const response = await fetch(`${this.apiUrl}/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
        },
      });

      const data = await response.json();
      return data.balance || 0;
    } catch (error) {
      console.error('Failed to get balance:', error);
      return null;
    }
  }

  /**
   * Validate phone number format
   * @param phone - Phone number to validate
   * @returns true if valid E.164 format
   */
  isValidPhoneFormat(phone: string): boolean {
    // E.164 format: +[country code][number]
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phone);
  }
}

// Singleton instance
export const elksClient = new ElksClient();
