import { createClient } from "@supabase/supabase-js";

import type { Database } from "./types";

export const createAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to be set.",
    );
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      persistSession: false,
    },
  });
};
