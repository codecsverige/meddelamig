import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import type { Database } from '@/lib/supabase/types';
import { getSetupBlueprint, industryOptions, setupGoals, type SetupGoal } from '@/lib/setup/playbooks';

type RequestPayload = {
  industry: string;
  goal: SetupGoal;
};

const isValidIndustry = (value: string): value is Database['public']['Tables']['organizations']['Insert']['industry'] =>
  industryOptions.some((option) => option.value === value);

const isValidGoal = (value: string): value is SetupGoal =>
  setupGoals.some((goal) => goal.value === value);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<RequestPayload>;

    if (!body.industry || !isValidIndustry(body.industry) || !body.goal || !isValidGoal(body.goal)) {
      return NextResponse.json(
        { error: 'Ogiltiga parametrar. Välj verksamhet och mål.' },
        { status: 400 },
      );
    }

    const supabase = createRouteHandlerClient<Database>({ cookies });

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session error', sessionError);
      return NextResponse.json({ error: 'Kunde inte hämta session.' }, { status: 500 });
    }

    if (!session) {
      return NextResponse.json({ error: 'Inte inloggad.' }, { status: 401 });
    }

    type UserOrgRow = Pick<Database['public']['Tables']['users']['Row'], 'id' | 'organization_id'>;

    const { data: userRows, error: userError } = await supabase
      .from('users')
      .select('id, organization_id')
      .eq('id', session.user.id)
      .limit(1)
      .returns<UserOrgRow[]>();

    const user = userRows?.[0];

    if (userError || !user?.organization_id) {
      return NextResponse.json(
        { error: 'Ingen kopplad organisation hittades. Slutför onboarding först.' },
        { status: 400 },
      );
    }

    const blueprint = getSetupBlueprint(body.industry, body.goal);
    const organizationId = user.organization_id;

    // Insert contacts
    const contactsPayload: Database['public']['Tables']['contacts']['Insert'][] = blueprint.contacts.map(
      (contact) => ({
        ...contact,
        organization_id: organizationId,
      }),
    );

    const { data: insertedContacts, error: contactsError } = await supabase
      .from('contacts')
      .insert(contactsPayload as any)
      .select('id');

    if (contactsError) {
      console.error('Failed to insert contacts', contactsError);
      return NextResponse.json({ error: 'Kunde inte skapa exempelkontakter.' }, { status: 500 });
    }

    // Insert templates
    const templatesPayload: Database['public']['Tables']['sms_templates']['Insert'][] = blueprint.templates.map(
      (template) => ({
        ...template,
        organization_id: organizationId,
        is_global: false,
      }),
    );

    const { data: insertedTemplates, error: templatesError } = await supabase
      .from('sms_templates')
      .insert(templatesPayload as any)
      .select('id');

    if (templatesError) {
      console.error('Failed to insert templates', templatesError);
      return NextResponse.json({ error: 'Kunde inte skapa mallar.' }, { status: 500 });
    }

    // Insert campaign
    const { data: insertedCampaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        ...blueprint.campaign,
        organization_id: organizationId,
      } as any)
      .select('id')
      .single();

    if (campaignError) {
      console.error('Failed to insert campaign', campaignError);
      return NextResponse.json({ error: 'Kunde inte skapa kampanj.' }, { status: 500 });
    }

    const campaignId = (insertedCampaign as { id?: string } | null)?.id ?? null;

    return NextResponse.json({
      success: true,
      contactsCreated: insertedContacts?.length ?? 0,
      templatesCreated: insertedTemplates?.length ?? 0,
      campaignId,
    });
  } catch (error) {
    console.error('Setup assistant error', error);
    return NextResponse.json({ error: 'Ett oväntat fel inträffade.' }, { status: 500 });
  }
}
