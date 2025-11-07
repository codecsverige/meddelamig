#!/usr/bin/env node

import 'dotenv/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../lib/supabase/types';

type AdminClient = SupabaseClient<Database>;

const REQUIRED_ENV = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

const DEFAULTS = {
  organizationName: 'Demo Restaurang AB',
  organizationSlug: 'demo-restaurang',
  organizationIndustry: 'restaurant' as const,
  organizationPlan: 'professional' as const,
  smsCredits: 350,
  senderName: 'MEDDELA',
  ownerEmail: 'founder@demo.se',
  ownerPassword: 'Demo1234!',
  ownerName: 'Demo Ägare',
};

interface BootstrapConfig {
  organizationName: string;
  organizationSlug: string;
  industry: Database['public']['Tables']['organizations']['Insert']['industry'];
  plan: Database['public']['Tables']['organizations']['Insert']['plan'];
  smsCredits: number;
  senderName: string;
  ownerEmail: string;
  ownerPassword: string;
  ownerName: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const log = (message: string) => console.log(`➡️  ${message}`);
const success = (message: string) => console.log(`✅ ${message}`);
const warn = (message: string) => console.warn(`⚠️ ${message}`);

async function main() {
  const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missingEnv.length > 0) {
    console.error('❌ Supabase environment variables saknas.');
    console.error(`   Lägg till: ${missingEnv.join(', ')}`);
    console.error('   Se README.md > Environment Setup för instruktioner.');
    process.exit(1);
  }

  const config: BootstrapConfig = {
    organizationName:
      process.env.BOOTSTRAP_ORG_NAME || DEFAULTS.organizationName,
    organizationSlug:
      process.env.BOOTSTRAP_ORG_SLUG || DEFAULTS.organizationSlug,
    industry:
      (process.env.BOOTSTRAP_ORG_INDUSTRY as BootstrapConfig['industry']) ||
      DEFAULTS.organizationIndustry,
    plan:
      (process.env.BOOTSTRAP_ORG_PLAN as BootstrapConfig['plan']) ||
      DEFAULTS.organizationPlan,
    smsCredits: Number(process.env.BOOTSTRAP_SMS_CREDITS) || DEFAULTS.smsCredits,
    senderName: process.env.BOOTSTRAP_SENDER_NAME || DEFAULTS.senderName,
    ownerEmail: process.env.BOOTSTRAP_OWNER_EMAIL || DEFAULTS.ownerEmail,
    ownerPassword:
      process.env.BOOTSTRAP_OWNER_PASSWORD || DEFAULTS.ownerPassword,
    ownerName: process.env.BOOTSTRAP_OWNER_NAME || DEFAULTS.ownerName,
  };

  log('Initierar Supabase-klient...');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  log(`Organisationsslug: ${config.organizationSlug}`);

  const organizationId = await ensureOrganization(supabase, config);
  success(`Organisation klar (${organizationId})`);

  const ownerId = await ensureOwnerUser(supabase, config, organizationId);
  success(`Ägarkonto klart (${config.ownerEmail})`);

  const contacts = await seedContacts(supabase, organizationId);
  success(`Kontakter seedade (${contacts.length})`);

  const templates = await seedTemplates(supabase, organizationId, config.industry);
  success(`SMS-mallar seedade (${templates})`);

  const messages = await seedSmsHistory(
    supabase,
    organizationId,
    ownerId,
    contacts,
    config.senderName,
    config.organizationName,
  );
  success(`SMS-historik seedad (${messages})`);

  console.log('');
  success('Bootstrap klart!');
  console.log('Logga in med:');
  console.log(`   E-post: ${config.ownerEmail}`);
  console.log(`   Lösenord: ${config.ownerPassword}`);
  console.log('Uppdatera dessa värden omedelbart i produktion.');
}

async function ensureOrganization(
  supabase: AdminClient,
  config: BootstrapConfig,
): Promise<string> {
  const { data: existing, error } = await supabase
    .from('organizations')
    .select('id, sms_credits')
    .eq('slug', config.organizationSlug)
    .maybeSingle();

  if (error) {
    throw new Error(`Kunde inte läsa organisation: ${error.message}`);
  }

  const baseFields = {
    name: config.organizationName,
    slug: config.organizationSlug,
    industry: config.industry,
    plan: config.plan,
    subscription_status: 'trial' as const,
    sms_sender_name: config.senderName,
    gdpr_consent_date: new Date().toISOString(),
    data_processing_agreement: true,
    email: config.ownerEmail,
  } satisfies Pick<
    Database['public']['Tables']['organizations']['Insert'],
    | 'name'
    | 'slug'
    | 'industry'
    | 'plan'
    | 'subscription_status'
    | 'sms_sender_name'
    | 'gdpr_consent_date'
    | 'data_processing_agreement'
    | 'email'
  >;

  const updatePayload: Database['public']['Tables']['organizations']['Update'] = {
    ...baseFields,
    sms_credits: Math.max(existing?.sms_credits ?? 0, config.smsCredits),
  };

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from('organizations')
      .update(updatePayload)
      .eq('id', existing.id);

    if (updateError) {
      throw new Error(`Kunde inte uppdatera organisation: ${updateError.message}`);
    }

    return existing.id;
  }

  const insertPayload: Database['public']['Tables']['organizations']['Insert'] = {
    ...baseFields,
    sms_credits: config.smsCredits,
  };

  const { data: inserted, error: insertError } = await supabase
    .from('organizations')
    .insert(insertPayload)
    .select('id')
    .single();

  if (insertError || !inserted) {
    throw new Error(
      `Kunde inte skapa organisation: ${insertError?.message ?? 'okänt fel'}`,
    );
  }

  return inserted.id;
}

async function ensureOwnerUser(
  supabase: AdminClient,
  config: BootstrapConfig,
  organizationId: string,
): Promise<string> {
  const { data: userList, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 100,
  });

  if (error) {
    throw new Error(`Kunde inte hämta användare: ${error.message}`);
  }

  const existingUser = userList?.users?.find(
    (user) => user.email?.toLowerCase() === config.ownerEmail.toLowerCase(),
  );

  let userId = existingUser?.id;

  if (!userId) {
    const { data, error: createError } = await supabase.auth.admin.createUser({
      email: config.ownerEmail,
      password: config.ownerPassword,
      email_confirm: true,
      user_metadata: {
        full_name: config.ownerName,
      },
    });

    if (createError || !data.user) {
      throw new Error(
        `Kunde inte skapa ägarkonto: ${createError?.message ?? 'okänt fel'}`,
      );
    }

    userId = data.user.id;
  } else {
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...(existingUser?.user_metadata ?? {}),
        full_name: config.ownerName,
      },
    });
  }

  await ensureProfileRow(supabase, userId, config.ownerEmail, config.ownerName);

  const { error: updateError } = await supabase
    .from('users')
    .update({
      organization_id: organizationId,
      role: 'owner',
      email: config.ownerEmail,
      full_name: config.ownerName,
    })
    .eq('id', userId);

  if (updateError) {
    throw new Error(`Kunde inte uppdatera användarprofil: ${updateError.message}`);
  }

  return userId;
}

async function ensureProfileRow(
  supabase: AdminClient,
  userId: string,
  email: string,
  fullName: string,
) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Kunde inte verifiera användarprofil: ${error.message}`);
    }

    if (data?.id) {
      return;
    }

    await sleep(500);
  }

  warn(
    'Användarprofil skapades inte automatiskt. Kontrollera trigger handle_new_user i databasen.',
  );

  await supabase.from('users').insert({
    id: userId,
    email,
    full_name: fullName,
    role: 'owner',
  });
}

async function seedContacts(
  supabase: AdminClient,
  organizationId: string,
) {
  const { count } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .is('deleted_at', null);

  if ((count ?? 0) > 0) {
    return await fetchContacts(supabase, organizationId);
  }

  const now = new Date();
  const contactsPayload: Database['public']['Tables']['contacts']['Insert'][] = [
    {
      organization_id: organizationId,
      name: 'Anna Svensson',
      phone: '+46701234567',
      email: 'anna.svensson@example.com',
      tags: ['VIP', 'Stamkund'],
      sms_consent: true,
      marketing_consent: true,
      consent_date: now.toISOString(),
      total_bookings: 12,
      last_visit_date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      organization_id: organizationId,
      name: 'Johan Lindberg',
      phone: '+46709876543',
      email: 'johan.lindberg@example.com',
      tags: ['Lunch'],
      sms_consent: true,
      marketing_consent: false,
      consent_date: now.toISOString(),
      total_bookings: 5,
      last_visit_date: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      organization_id: organizationId,
      name: 'Sara Holm',
      phone: '+46705551234',
      email: 'sara.holm@example.com',
      tags: ['Event', 'VIP'],
      sms_consent: true,
      marketing_consent: true,
      consent_date: now.toISOString(),
      total_bookings: 8,
      last_visit_date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const { error } = await supabase
    .from('contacts')
    .upsert(contactsPayload, { onConflict: 'organization_id,phone' });

  if (error) {
    throw new Error(`Kunde inte seeda kontakter: ${error.message}`);
  }

  return await fetchContacts(supabase, organizationId);
}

async function fetchContacts(
  supabase: AdminClient,
  organizationId: string,
) {
  const { data, error } = await supabase
    .from('contacts')
    .select('id, name, phone, email, tags')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('name');

  if (error || !data) {
    throw new Error(
      `Kunde inte hämta kontakter efter seed: ${error?.message ?? 'okänt fel'}`,
    );
  }

  return data;
}

async function seedTemplates(
  supabase: AdminClient,
  organizationId: string,
  industry: BootstrapConfig['industry'],
) {
  const { count } = await supabase
    .from('sms_templates')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId);

  if ((count ?? 0) > 0) {
    return count ?? 0;
  }

  const templates: Database['public']['Tables']['sms_templates']['Insert'][] = [
    {
      organization_id: organizationId,
      name: 'Bokningsbekräftelse',
      category: 'confirmation',
      message:
        'Hej {{contact.first_name}}! Din bokning hos {{organization.name}} är bekräftad {{date.today_short}}. Svara gärna om du behöver ändra något.',
      industry,
      is_global: false,
    },
    {
      organization_id: organizationId,
      name: 'Påminnelse 24h',
      category: 'reminder',
      message:
        'Hej {{contact.first_name}}! Vi ses i morgon hos {{organization.name}}. Behöver du avboka? Svara på detta SMS så hjälper vi dig.',
      industry,
      is_global: false,
    },
    {
      organization_id: organizationId,
      name: 'VIP-erbjudande',
      category: 'marketing',
      message:
        'Hej {{contact.first_name}}! Som VIP hos {{organization.name}} får du 20% rabatt på nästa besök. Visa SMS:et vid ankomst. Gäller veckan ut!',
      industry,
      is_global: false,
    },
  ];

  const { error } = await supabase.from('sms_templates').insert(templates);

  if (error) {
    throw new Error(`Kunde inte seeda SMS-mallar: ${error.message}`);
  }

  return templates.length;
}

async function seedSmsHistory(
  supabase: AdminClient,
  organizationId: string,
  ownerId: string,
  contacts: Array<Pick<Database['public']['Tables']['contacts']['Row'], 'id' | 'name' | 'phone'>>,
  senderName: string,
  organizationName: string,
) {
  const { count } = await supabase
    .from('sms_messages')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId);

  if ((count ?? 0) > 0) {
    return count ?? 0;
  }

  if (contacts.length === 0) {
    warn('Hoppar över SMS-historik eftersom inga kontakter finns.');
    return 0;
  }

  const now = Date.now();
  const baseMessages: Database['public']['Tables']['sms_messages']['Insert'][] = contacts
    .slice(0, 3)
    .map((contact, index) => ({
      organization_id: organizationId,
      contact_id: contact.id,
      user_id: ownerId,
      to_phone: contact.phone,
      message: `Hej ${contact.name?.split(' ')[0] ?? 'vän'}! Tack för senast hos ${organizationName}. Vi bjuder på dessert vid nästa besök – visa bara detta SMS.`,
      sender_name: senderName,
      type: index === 0 ? 'confirmation' : index === 1 ? 'reminder' : 'marketing',
      status: 'delivered',
      sent_at: new Date(now - (index + 1) * 2 * 60 * 60 * 1000).toISOString(),
      delivered_at: new Date(now - (index + 1) * 2 * 60 * 60 * 1000 + 60 * 1000).toISOString(),
      cost: 0.35,
    }));

  const { error } = await supabase.from('sms_messages').insert(baseMessages);

  if (error) {
    throw new Error(`Kunde inte seeda SMS-historik: ${error.message}`);
  }

  // Uppdatera enklare statistik
  const contactIds = baseMessages
    .map((message) => message.contact_id)
    .filter((id): id is string => Boolean(id));

  if (contactIds.length > 0) {
    const { data: contactStats, error: contactStatsError } = await supabase
      .from('contacts')
      .select('id, total_sms_sent')
      .in('id', contactIds);

    if (contactStatsError) {
      warn(`Kunde inte läsa kontaktstatistik: ${contactStatsError.message}`);
    } else if (contactStats) {
      await Promise.all(
        contactStats.map(async (contact) => {
          const { error: updateContactError } = await supabase
            .from('contacts')
            .update({ total_sms_sent: (contact.total_sms_sent ?? 0) + 1 })
            .eq('id', contact.id);

          if (updateContactError) {
            warn(`Kunde inte uppdatera sms-statistik för kontakt ${contact.id}: ${updateContactError.message}`);
          }
        }),
      );
    }
  }

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('sms_credits')
    .eq('id', organizationId)
    .single();

  if (orgError) {
    warn(`Kunde inte läsa sms_credits: ${orgError.message}`);
  } else {
    await supabase
      .from('organizations')
      .update({ sms_credits: Math.max(0, (org?.sms_credits ?? DEFAULTS.smsCredits) - baseMessages.length) })
      .eq('id', organizationId);
  }

  return baseMessages.length;
}

main().catch((error) => {
  console.error('❌ Bootstrap misslyckades.');
  console.error(error);
  process.exit(1);
});
