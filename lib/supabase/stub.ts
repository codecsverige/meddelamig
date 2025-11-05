const buildStubResponse = () => ({
  data: null,
  error: new Error('Supabase not configured'),
  count: null as number | null,
});

const createQueryBuilderStub = () => {
  const response = buildStubResponse();

  const builder: any = {
    select: () => builder,
    insert: () => builder,
    update: () => builder,
    delete: () => builder,
    eq: () => builder,
    order: () => builder,
    limit: () => builder,
    is: () => builder,
    maybeSingle: async () => response,
    single: async () => response,
    then: (resolve: (value: typeof response) => any, reject?: (reason: unknown) => any) => {
      try {
        return Promise.resolve(resolve(response));
      } catch (error) {
        return reject ? Promise.resolve(reject(error)) : Promise.reject(error);
      }
    },
  };

  return builder;
};

export const createSupabaseStub = () => {
  const response = buildStubResponse();

  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: response.error }),
      signUp: async () => ({ data: { user: null }, error: response.error }),
      signInWithOAuth: async () => ({ data: null, error: response.error }),
      signOut: async () => ({ error: response.error }),
      admin: {
        createUser: async () => ({ data: { user: null }, error: response.error }),
        deleteUser: async () => ({ error: response.error }),
      },
    },
    from: () => createQueryBuilderStub(),
    storage: {
      from: () => ({
        upload: async () => ({ error: response.error }),
      }),
    },
  } as any;
};
