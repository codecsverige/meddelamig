import { NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase/admin';

import type { Database } from '@/lib/supabase/types';
import type { SupabaseClient } from '@supabase/supabase-js';

type RegisterPayload = {
  fullName?: string;
  email?: string;
  password?: string;
  organizationName?: string;
  industry?: Database['public']['Tables']['organizations']['Row']['industry'];
  acceptTerms?: boolean;
};

const MIN_PASSWORD_LENGTH = 8;

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
  let adminClient: SupabaseClient<Database> | null = null;
  let createdUserId: string | null = null;
  let createdOrganizationId: string | null = null;

  try {
    const supabase: SupabaseClient<Database> = createAdminClient();
    adminClient = supabase;

    const payload = (await request.json()) as RegisterPayload;

    const {
      fullName,
      email,
      password,
      organizationName,
      industry,
      acceptTerms,
    } = payload;

    if (!fullName || !email || !password || !organizationName || !industry) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!acceptTerms) {
      return NextResponse.json(
        { error: 'Du måste acceptera användarvillkoren' },
        { status: 400 }
      );
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Lösenordet måste vara minst ${MIN_PASSWORD_LENGTH} tecken` },
        { status: 400 }
      );
    }

    const {
      data: userData,
      error: createUserError,
    } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (createUserError || !userData?.user) {
      if (createUserError?.message?.toLowerCase().includes('already registered')) {
        return NextResponse.json(
          { error: 'Det finns redan ett konto med denna e-postadress' },
          { status: 409 }
        );
      }

      throw new Error(createUserError?.message || 'Kunde inte skapa användare');
    }

    createdUserId = userData.user.id;

    const baseSlug = generateSlug(organizationName);
    let slug = baseSlug;
    let attempts = 0;

    while (attempts < 5) {
      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (!existingOrg) break;

      attempts += 1;
      slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
    }

    const organizationInsert: Database['public']['Tables']['organizations']['Insert'] = {
      name: organizationName,
      slug,
      industry,
      plan: 'starter',
      sms_credits: 25,
      subscription_status: 'trial',
    };

    const {
      data: organization,
      error: orgError,
    } = await supabase
      .from('organizations')
      .insert(organizationInsert)
      .select()
      .single();

    if (orgError || !organization) {
      throw new Error(orgError?.message || 'Kunde inte skapa organisation');
    }

    createdOrganizationId = organization.id;

    const { error: updateUserError } = await supabase
      .from('users')
      .update({
        organization_id: organization.id,
        role: 'owner',
      })
      .eq('id', createdUserId)
      .eq('email', email);

    if (updateUserError) {
      throw new Error(updateUserError.message || 'Kunde inte uppdatera användaren');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ett fel uppstod';

    if (adminClient && createdOrganizationId) {
      await adminClient
        .from('organizations')
        .delete()
        .eq('id', createdOrganizationId);
    }

    if (adminClient && createdUserId) {
      await adminClient.auth.admin.deleteUser(createdUserId);
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
