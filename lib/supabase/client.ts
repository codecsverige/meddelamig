import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from './types';
import { createSupabaseStub } from './stub';
import {
  getMissingSupabaseEnvVars,
  logSupabaseConfigWarning,
} from './config';

export const createClient = () => {
  const missing = getMissingSupabaseEnvVars('public');

  if (missing.length > 0) {
    logSupabaseConfigWarning('public', missing);
    return createSupabaseStub('public');
  }

  return createClientComponentClient<Database>();
};
