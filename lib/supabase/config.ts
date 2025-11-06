const PUBLIC_ENV_KEYS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

const SERVICE_ENV_KEYS = [
  ...PUBLIC_ENV_KEYS,
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

export type SupabaseEnvScope = 'public' | 'service';

export const getMissingSupabaseEnvVars = (
  scope: SupabaseEnvScope = 'public',
): string[] => {
  const keys = scope === 'service' ? SERVICE_ENV_KEYS : PUBLIC_ENV_KEYS;
  return keys.filter((key) => {
    const value = process.env[key];
    return typeof value !== 'string' || value.trim().length === 0;
  });
};

export const isSupabaseConfigured =
  getMissingSupabaseEnvVars('public').length === 0;

export const isSupabaseServiceConfigured =
  getMissingSupabaseEnvVars('service').length === 0;

export class SupabaseConfigError extends Error {
  missing: string[];
  scope: SupabaseEnvScope;

  constructor(scope: SupabaseEnvScope, missing: string[]) {
    const instruction = formatSupabaseConfigMessage(missing);
    super(
      missing.length > 0
        ? `Supabase-konfiguration saknas (${missing.join(', ')}). ${instruction}`
        : `Supabase-konfiguration saknas. ${instruction}`,
    );
    this.name = 'SupabaseConfigError';
    this.missing = missing;
    this.scope = scope;
  }
}

export const formatSupabaseConfigMessage = (missing: string[]): string => {
  const base =
    'Se README.md > Environment Setup för hur du konfigurerar miljövariablerna.';
  if (!missing.length) {
    return base;
  }
  return `Fyll i variablerna: ${missing.join(
    ', ',
  )}. ${base}`;
};

const warnedScopes = new Set<SupabaseEnvScope>();

export const logSupabaseConfigWarning = (
  scope: SupabaseEnvScope,
  missing?: string[],
) => {
  if (warnedScopes.has(scope)) {
    return;
  }
  warnedScopes.add(scope);

  const missingList = missing ?? getMissingSupabaseEnvVars(scope);
  const message = formatSupabaseConfigMessage(missingList);

  if (typeof console !== 'undefined') {
    console.warn(`⚠️ Supabase-konfiguration saknas (${scope}). ${message}`);
  }
};
