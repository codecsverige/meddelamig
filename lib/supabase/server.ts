import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from './types';
import { createSupabaseStub } from './stub';
import {
  getMissingSupabaseEnvVars,
  logSupabaseConfigWarning,
} from './config';

export const createServerClient = () => {
  const missing = getMissingSupabaseEnvVars('public');

  if (missing.length > 0) {
    logSupabaseConfigWarning('public', missing);
    return createSupabaseStub('public');
  }

  const cookieStore = cookies();
  return createServerComponentClient<Database>({ cookies: () => cookieStore });
};
