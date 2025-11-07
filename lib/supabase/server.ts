import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from './types';
import { createSupabaseStub } from './stub';
import { logSupabaseConfigWarning } from './config';

const hasServerEnv =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const createServerClient = () => {
  if (!hasServerEnv) {
    logSupabaseConfigWarning('public');
    return createSupabaseStub('public');
  }

  const cookieStore = cookies();
  return createServerComponentClient<Database>({ cookies: () => cookieStore });
};
