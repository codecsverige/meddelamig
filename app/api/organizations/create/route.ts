import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Database } from '@/lib/supabase/types';

type CreateOrganizationPayload = {
  name?: string;
  industry?: 'restaurant' | 'salon' | 'workshop' | 'b2b';
};

const generateSlug = (input: string) => {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

  return base || `org-${Math.random().toString(36).slice(2, 8)}`;
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function POST(request: Request) {
  const routeClient = createRouteHandlerClient<Database>({ cookies });
  let adminClient: ReturnType<typeof createAdminClient> | null = null;
  let createdOrganizationId: string | null = null;

  try {
    adminClient = createAdminClient();

    const {
      data: { session },
    } = await routeClient.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = (await request.json()) as CreateOrganizationPayload;
    const name = payload.name?.trim();
    const { industry } = payload;

    if (!name || !industry) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: userRecord, error: userError } = await adminClient
      .from('users')
      .select('id, organization_id, role')
      .eq('id', session.user.id)
      .single();

    if (userError) {
      throw new Error(userError.message || 'Kunde inte hämta användardata');
    }

    if (userRecord?.organization_id) {
      return NextResponse.json(
        { error: 'Användaren har redan en organisation' },
        { status: 400 }
      );
    }

    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let attempts = 0;

    while (attempts < 5) {
      const { data: existing } = await adminClient
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (!existing) break;

      attempts += 1;
      slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
    }

    const { data: organization, error: organizationError } = await adminClient
      .from<Database['public']['Tables']['organizations']['Row']>('organizations')
      .insert({
        name,
        slug,
        industry,
        plan: 'starter',
        sms_credits: 25,
        subscription_status: 'trial',
      })
      .select()
      .single();

    if (organizationError || !organization) {
      throw new Error(organizationError?.message || 'Kunde inte skapa organisation');
    }

    createdOrganizationId = organization.id;

    const { error: updateError } = await adminClient
      .from('users')
      .update({
        organization_id: organization.id,
        role: 'owner',
      })
      .eq('id', session.user.id);

    if (updateError) {
      throw new Error(updateError.message || 'Kunde inte uppdatera användaren');
    }

    return NextResponse.json({ success: true, organization });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ett fel uppstod';

    if (adminClient && createdOrganizationId) {
      await adminClient
        .from('organizations')
        .delete()
        .eq('id', createdOrganizationId);
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
