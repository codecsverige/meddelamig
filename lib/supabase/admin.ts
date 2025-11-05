import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { createSupabaseStub } from './stub';

type AdminClient = ReturnType<typeof createClient<Database>>;

let adminClient: AdminClient | null = null;

export const createAdminClient = (): AdminClient => {
  if (adminClient) return adminClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return createSupabaseStub();
  }

  adminClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
};
