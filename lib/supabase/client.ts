import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from './types';
import { createSupabaseStub } from './stub';

const hasClientEnv =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const createClient = () =>
  hasClientEnv ? createClientComponentClient<Database>() : createSupabaseStub('public');
