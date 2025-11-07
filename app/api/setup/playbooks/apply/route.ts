import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import type { Database, Json } from '@/lib/supabase/types';
import {
  getPlaybookById,
  getSetupBlueprint,
} from '@/lib/setup/playbooks';
import {
  defaultAutomationSettings,
  mergeAutomationSettings,
  normalizeAutomationSettings,
  type AutomationSettings,
} from '@/lib/automation/presets';

type RequestPayload = { playbookId?: string };

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestPayload;
    if (!body.playbookId) {
      return NextResponse.json(
        { error: 'playbookId saknas.' },
        { status: 400 },
      );
    }

    const playbook = getPlaybookById(body.playbookId);
    if (!playbook) {
      return NextResponse.json(
        { error: 'Playbook hittades inte.' },
        { status: 404 },
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

    const organizationId = user.organization_id;
    const blueprint = getSetupBlueprint(playbook.industry, playbook.goal);

    // Seed contacts only if empty
    const { count: contactCount, error: contactCountError } = await supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    if (contactCountError) {
      console.error('Count contacts error', contactCountError);
    }

    let contactsInserted = 0;
    if ((contactCount ?? 0) === 0) {
      const contactPayload = blueprint.contacts.map((contact) => ({
        ...contact,
        organization_id: organizationId,
        consent_source: contact.consent_source ?? 'playbook',
      }));

      const { data: insertedContacts, error: contactsError } = await supabase
        .from('contacts')
        .insert(contactPayload as any)
        .select('id');

      if (contactsError) {
        console.error('Failed to insert contacts for playbook', contactsError);
      } else {
        contactsInserted = insertedContacts?.length ?? 0;
      }
    }

    // Prepare templates
    const combinedTemplates = [
      ...blueprint.templates,
      ...(playbook.extraTemplates ?? []),
    ];
    const uniqueTemplatesMap = new Map<string, (typeof combinedTemplates)[number]>();
    combinedTemplates.forEach((template) => {
      if (!uniqueTemplatesMap.has(template.name)) {
        uniqueTemplatesMap.set(template.name, template);
      }
    });
    const uniqueTemplates = Array.from(uniqueTemplatesMap.values()).map((template) => ({
      ...template,
      is_global: false,
    }));

    const { data: existingTemplatesData } = await supabase
      .from('sms_templates')
      .select('id, name')
      .eq('organization_id', organizationId);

    const existingTemplates =
      (existingTemplatesData ?? []) as Array<{ id: string; name: string }>;

    const templateIdByName = new Map<string, string>();
    existingTemplates.forEach((template) => {
      templateIdByName.set(template.name, template.id);
    });

    const templatesToInsert = uniqueTemplates.filter((template) => !templateIdByName.has(template.name));

    let templatesInserted = 0;
    if (templatesToInsert.length > 0) {
      const { data: insertedTemplates, error: templatesError } = await supabase
        .from('sms_templates')
        .insert(
          templatesToInsert.map((template) => ({
            ...template,
            organization_id: organizationId,
          })) as any,
        )
        .select('id, name');

      if (templatesError) {
        console.error('Failed to insert templates for playbook', templatesError);
      } else {
        const insertedTemplateRows =
          (insertedTemplates ?? []) as Array<{ id: string; name: string }>;
        templatesInserted = insertedTemplateRows.length;
        insertedTemplateRows.forEach((template) => {
          templateIdByName.set(template.name, template.id);
        });
      }
    }

    // Prepare campaigns
    const combinedCampaigns = [
      blueprint.campaign,
      ...(playbook.extraCampaigns ?? []),
    ];

    const { data: existingCampaignsData } = await supabase
      .from('campaigns')
      .select('id, name')
      .eq('organization_id', organizationId);

    const existingCampaigns =
      (existingCampaignsData ?? []) as Array<{ id: string; name: string }>;

    const campaignsToInsert = combinedCampaigns.filter(
      (campaign) => !existingCampaigns.some((existing) => existing.name === campaign.name),
    );

    let campaignsInserted = 0;
    if (campaignsToInsert.length > 0) {
      const { data: insertedCampaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .insert(
          campaignsToInsert.map((campaign) => ({
            ...campaign,
            organization_id: organizationId,
          })) as any,
        )
        .select('id, name');

      if (campaignsError) {
        console.error('Failed to insert campaigns for playbook', campaignsError);
      } else {
        const insertedCampaignRows =
          (insertedCampaigns ?? []) as Array<{ id: string; name: string }>;
        campaignsInserted = insertedCampaignRows.length;
      }
    }

    // Update automation presets
    const { data: organizationRow, error: organizationError } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', organizationId)
      .single();

    if (organizationError) {
      console.error('Failed to fetch organization settings', organizationError);
    }

    const organizationSettingsRow =
      (organizationRow as { settings?: Record<string, unknown> } | null);
    const existingSettings = (organizationSettingsRow?.settings as Record<string, unknown>) ?? {};
    const existingAutomations = normalizeAutomationSettings(
      (existingSettings as Record<string, unknown>)?.automations ?? defaultAutomationSettings,
    );

    let automationsUpdated = false;
    if (playbook.automationPresets) {
      const automationOverrides: Partial<AutomationSettings> = {};

      (Object.entries(playbook.automationPresets) as Array<
        [keyof AutomationSettings, AutomationSettings[keyof AutomationSettings]]
      >).forEach(([key, preset]) => {
        if (!preset) return;
        const templateId =
          preset.templateId ??
          (preset.templateName ? templateIdByName.get(preset.templateName) ?? null : null);

        switch (key) {
          case 'bookingConfirmation': {
            const typedPreset = preset as AutomationSettings['bookingConfirmation'];
            automationOverrides.bookingConfirmation = {
              ...existingAutomations.bookingConfirmation,
              ...typedPreset,
              templateId,
              templateName: typedPreset.templateName ?? null,
            };
            break;
          }
          case 'bookingReminder': {
            const typedPreset = preset as AutomationSettings['bookingReminder'];
            automationOverrides.bookingReminder = {
              ...existingAutomations.bookingReminder,
              ...typedPreset,
              templateId,
              templateName: typedPreset.templateName ?? null,
            };
            break;
          }
          case 'visitFollowup': {
            const typedPreset = preset as AutomationSettings['visitFollowup'];
            automationOverrides.visitFollowup = {
              ...existingAutomations.visitFollowup,
              ...typedPreset,
              templateId,
              templateName: typedPreset.templateName ?? null,
            };
            break;
          }
          default:
            break;
        }
      });

      const mergedAutomations = mergeAutomationSettings(existingAutomations, automationOverrides);
      const nextSettings = {
        ...existingSettings,
        automations: mergedAutomations,
      };
      const { error: updateSettingsError } = await (supabase as any)
        .from('organizations')
        .update({ settings: nextSettings })
        .eq('id', organizationId);

      if (updateSettingsError) {
        console.error('Failed to update automation settings', updateSettingsError);
      } else {
        automationsUpdated = true;
      }
    }

    return NextResponse.json({
      success: true,
      playbook: {
        id: playbook.id,
        title: playbook.title,
        industry: playbook.industry,
      },
      contactsInserted,
      templatesInserted,
      campaignsInserted,
      automationsUpdated,
    });
  } catch (error) {
    console.error('Playbook apply error', error);
    return NextResponse.json({ error: 'Ett oväntat fel inträffade.' }, { status: 500 });
  }
}
