import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from './types';
import { createSupabaseStub } from './stub';

const hasServerEnv =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const createServerClient = () => {
  if (!hasServerEnv) {
    return createSupabaseStub();
  }

  const cookieStore = cookies();
  return createServerComponentClient<Database>({ cookies: () => cookieStore });
};
