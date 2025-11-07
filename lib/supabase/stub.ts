import {
  SupabaseConfigError,
  getMissingSupabaseEnvVars,
  logSupabaseConfigWarning,
  type SupabaseEnvScope,
} from './config';

const buildStubResponse = (error: SupabaseConfigError) => ({
  data: null,
  error,
  count: null as number | null,
});

const createQueryBuilderStub = (error: SupabaseConfigError) => {
  const response = buildStubResponse(error);

  const builder: any = {
    select: () => builder,
    insert: () => builder,
    update: () => builder,
    delete: () => builder,
    upsert: () => builder,
    eq: () => builder,
    neq: () => builder,
    gt: () => builder,
    gte: () => builder,
    lt: () => builder,
    lte: () => builder,
    order: () => builder,
    limit: () => builder,
    range: () => builder,
    is: () => builder,
    in: () => builder,
    or: () => builder,
    contains: () => builder,
    maybeSingle: async () => response,
    single: async () => response,
    then: (
      resolve: (value: typeof response) => any,
      reject?: (reason: unknown) => any,
    ) => {
      try {
        return Promise.resolve(resolve(response));
      } catch (err) {
        return reject ? Promise.resolve(reject(err)) : Promise.reject(err);
      }
    },
  };

  return builder;
};

export const createSupabaseStub = (scope: SupabaseEnvScope = 'public') => {
  const missing = getMissingSupabaseEnvVars(scope);
  const error = new SupabaseConfigError(scope, missing);
  logSupabaseConfigWarning(scope, missing);

  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error }),
      signUp: async () => ({ data: { user: null }, error }),
      signInWithPassword: async () => ({ data: { session: null, user: null }, error }),
      signInWithOAuth: async () => ({ data: null, error }),
      signOut: async () => ({ error }),
      admin: {
        createUser: async () => ({ data: { user: null }, error }),
        deleteUser: async () => ({ error }),
      },
    },
    from: () => createQueryBuilderStub(error),
    storage: {
      from: () => ({
        upload: async () => ({ error }),
      }),
    },
  } as any;
};
