import { NextResponse } from 'next/server';

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function handleAPIError(error: unknown) {
  console.error('API Error:', error);

  if (error instanceof APIError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    // Supabase errors
    if ('code' in error) {
      return NextResponse.json(
        {
          error: error.message,
          code: (error as any).code,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      error: 'Ett oväntat fel uppstod',
    },
    { status: 500 }
  );
}

export function validateRequest(data: any, requiredFields: string[]) {
  const missing = requiredFields.filter((field) => !data[field]);

  if (missing.length > 0) {
    throw new APIError(
      `Saknade obligatoriska fält: ${missing.join(', ')}`,
      400,
      'MISSING_FIELDS'
    );
  }
}

export function validatePhoneNumber(phone: string) {
  // Swedish phone number validation
  const cleaned = phone.replace(/\s+/g, '');
  const phoneRegex = /^(\+46|0)[1-9]\d{7,9}$/;

  if (!phoneRegex.test(cleaned)) {
    throw new APIError(
      'Ogiltigt telefonnummer. Använd svenskt format: +46XXXXXXXXX eller 07XXXXXXXX',
      400,
      'INVALID_PHONE'
    );
  }

  return cleaned;
}

export function validateSMSMessage(message: string) {
  if (!message || message.trim().length === 0) {
    throw new APIError('Meddelandet kan inte vara tomt', 400, 'EMPTY_MESSAGE');
  }

  if (message.length > 1600) {
    throw new APIError(
      'Meddelandet är för långt (max 1600 tecken)',
      400,
      'MESSAGE_TOO_LONG'
    );
  }

  return message.trim();
}
