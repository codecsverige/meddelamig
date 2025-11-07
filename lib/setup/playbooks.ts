import type { Database } from '@/lib/supabase/types';

type IndustryKey = Database['public']['Tables']['organizations']['Insert']['industry'];
type CampaignStatus = Database['public']['Tables']['campaigns']['Insert']['status'];
type TemplateCategory = Database['public']['Tables']['sms_templates']['Insert']['category'];

export type SetupGoal =
  | 'increase_bookings'
  | 'reactivate_customers'
  | 'promote_event';

export interface SetupBlueprint {
  industry: IndustryKey;
  contacts: Array<Omit<Database['public']['Tables']['contacts']['Insert'], 'organization_id' | 'id'>>;
  templates: Array<Omit<Database['public']['Tables']['sms_templates']['Insert'], 'organization_id' | 'id'>>;
  campaign: Omit<Database['public']['Tables']['campaigns']['Insert'], 'organization_id' | 'id'>;
}

const basePhone = () => `+4670${Math.floor(Math.random() * 1_000_0000).toString().padStart(7, '0')}`;

const goalMessages: Record<SetupGoal, string> = {
  increase_bookings: 'Fyll dina tider med en tidsbegränsad kampanj.',
  reactivate_customers: 'Vi saknar dig! Dags att återvända med ett särskilt erbjudande.',
  promote_event: 'Exklusivt event – besvara för att säkra din plats.',
};

const industryBlueprints: Record<
  IndustryKey,
  (goal: SetupGoal) => SetupBlueprint
> = {
  restaurant: (goal) => ({
    industry: 'restaurant',
    contacts: [
      {
        name: 'Anna Svensson',
        phone: basePhone(),
        email: 'anna.svensson@example.com',
        tags: ['VIP', 'Stamkund'],
        sms_consent: true,
        marketing_consent: true,
        consent_date: new Date().toISOString(),
      },
      {
        name: 'Johan Lindberg',
        phone: basePhone(),
        email: 'johan.lindberg@example.com',
        tags: ['Lunch'],
        sms_consent: true,
        marketing_consent: false,
        consent_date: new Date().toISOString(),
      },
      {
        name: 'Sara Holm',
        phone: basePhone(),
        email: 'sara.holm@example.com',
        tags: ['Event'],
        sms_consent: true,
        marketing_consent: true,
        consent_date: new Date().toISOString(),
      },
    ],
    templates: [
      {
        name: 'Bokningsbekräftelse',
        message:
          'Hej {{contact.first_name}}! Din bokning hos {{organization.name}} är bekräftad. Svara på detta SMS om du behöver göra ändringar.',
        category: 'confirmation' as TemplateCategory,
        industry: 'restaurant',
        is_global: false,
      },
      {
        name: 'Uppföljning efter besök',
        message:
          'Tack för besöket {{contact.first_name}}! Vi hoppas att du gillade kvällen hos {{organization.name}}. Svara gärna med ditt betyg 1-5.',
        category: 'thank_you' as TemplateCategory,
        industry: 'restaurant',
        is_global: false,
      },
    ],
    campaign: {
      name: goal === 'reactivate_customers' ? 'Vi saknar dig' : 'Helgerbjudande',
      message:
        goal === 'reactivate_customers'
          ? 'Hej {{contact.first_name}}! Vi saknar dig hos {{organization.name}}. Boka bord innan söndag och få dessert på huset.'
          : goal === 'promote_event'
          ? '🌟 Exklusiv temakväll på {{organization.name}}! Begränsade platser fredag kväll. Svara JA för att reservera.'
          : '🥂 Helgen är här! Boka bord hos {{organization.name}} och få 20% på förrätter. Svara JA för att boka.',
      target_tags: goal === 'reactivate_customers' ? ['Event'] : ['VIP', 'Stamkund'],
      status: 'draft' as CampaignStatus,
      total_recipients: 0,
      sent_count: 0,
      delivered_count: 0,
      failed_count: 0,
    },
  }),
  salon: (goal) => ({
    industry: 'salon',
    contacts: [
      {
        name: 'Mikaela Sand',
        phone: basePhone(),
        email: 'mikaela.sand@example.com',
        tags: ['Färg', 'VIP'],
        sms_consent: true,
        marketing_consent: true,
        consent_date: new Date().toISOString(),
      },
      {
        name: 'Elin Karlsson',
        phone: basePhone(),
        email: 'elin.karlsson@example.com',
        tags: ['Klippning'],
        sms_consent: true,
        marketing_consent: true,
        consent_date: new Date().toISOString(),
      },
      {
        name: 'Patrik Nilsson',
        phone: basePhone(),
        email: 'patrik.nilsson@example.com',
        tags: ['Skägg', 'Lunchkund'],
        sms_consent: true,
        marketing_consent: false,
        consent_date: new Date().toISOString(),
      },
    ],
    templates: [
      {
        name: 'Tidsbokning bekräftelse',
        message:
          'Hej {{contact.first_name}}! Din tid hos {{organization.name}} är bokad. Svara JA om allt stämmer eller ring oss vid ändring.',
        category: 'confirmation',
        industry: 'salon',
        is_global: false,
      },
      {
        name: 'Påminnelse 24h',
        message:
          'Glöm inte din tid hos {{organization.name}} i morgon kl {{system.now}}. Behöver du ändra? Svara på detta SMS.',
        category: 'reminder',
        industry: 'salon',
        is_global: false,
      },
    ],
    campaign: {
      name: goal === 'promote_event' ? 'Sommar-event' : 'VIP-uppgradering',
      message:
        goal === 'reactivate_customers'
          ? 'Hej {{contact.first_name}}! Det var länge sen sist. Boka tid denna vecka och få en quick treatment utan kostnad.'
          : goal === 'promote_event'
          ? '🌸 Sommarstyling hos {{organization.name}}! Begränsade tider på lördag. Svara BOKA om du vill ha en plats.'
          : 'Livsnjutare! Boka klipp+färg den här veckan och få stylingkit värde 199 kr. Svara JA för att boka.',
      target_tags: goal === 'reactivate_customers' ? ['Lunchkund'] : ['VIP'],
      status: 'draft',
      total_recipients: 0,
      sent_count: 0,
      delivered_count: 0,
      failed_count: 0,
    },
  }),
  workshop: (goal) => ({
    industry: 'workshop',
    contacts: [
      {
        name: 'Anders Eklund',
        phone: basePhone(),
        email: 'anders.eklund@example.com',
        tags: ['Service', 'Företag'],
        sms_consent: true,
        marketing_consent: true,
        consent_date: new Date().toISOString(),
      },
      {
        name: 'Camilla Björk',
        phone: basePhone(),
        email: 'camilla.bjork@example.com',
        tags: ['Däck', 'VIP'],
        sms_consent: true,
        marketing_consent: true,
        consent_date: new Date().toISOString(),
      },
    ],
    templates: [
      {
        name: 'Servicebekräftelse',
        message:
          'Hej {{contact.first_name}}! Din tid hos {{organization.name}} är bokad. Välkommen med bilen på {{date.today_short}}.',
        category: 'confirmation',
        industry: 'workshop',
        is_global: false,
      },
    ],
    campaign: {
      name: 'Servicepåminnelse',
      message:
        goal === 'increase_bookings'
          ? 'Hej {{contact.first_name}}! Dags för service? Boka hos {{organization.name}} denna vecka och få gratis lånebil. Svara SERVICE för att boka.'
          : goalMessages[goal],
      target_tags: ['Service'],
      status: 'draft',
      total_recipients: 0,
      sent_count: 0,
      delivered_count: 0,
      failed_count: 0,
    },
  }),
  b2b: (goal) => ({
    industry: 'b2b',
    contacts: [
      {
        name: 'Erik Larsson',
        phone: basePhone(),
        email: 'erik.larsson@example.com',
        tags: ['Partner', 'Demo'],
        sms_consent: true,
        marketing_consent: true,
        consent_date: new Date().toISOString(),
      },
      {
        name: 'Sandra Persson',
        phone: basePhone(),
        email: 'sandra.persson@example.com',
        tags: ['Demo'],
        sms_consent: true,
        marketing_consent: false,
        consent_date: new Date().toISOString(),
      },
    ],
    templates: [
      {
        name: 'Mötesbokning',
        message:
          'Hej {{contact.first_name}}! Tack för samtalet. Vi ses på vårt möte {{date.today_short}} kl 10.00. Svara JA om tiden passar.',
        category: 'confirmation',
        industry: 'b2b',
        is_global: false,
      },
    ],
    campaign: {
      name: 'Demo-uppföljning',
      message:
        goal === 'promote_event'
          ? 'Hej {{contact.first_name}}! Vi håller ett exklusivt webinar för partners. Svara DELTA så skickar vi länk.'
          : 'Hej {{contact.first_name}}! Vill du se hur {{organization.name}} kan snabba upp ert arbete? Boka en demo genom att svara DEMO.',
      target_tags: ['Demo'],
      status: 'draft',
      total_recipients: 0,
      sent_count: 0,
      delivered_count: 0,
      failed_count: 0,
    },
  }),
};

export const setupGoals: Array<{ value: SetupGoal; title: string; description: string }> = [
  {
    value: 'increase_bookings',
    title: 'Fyll tider snabbt',
    description: 'Fokusera på att fylla tomma tider de närmaste dagarna.',
  },
  {
    value: 'reactivate_customers',
    title: 'Återaktivera tidigare kunder',
    description: 'Påminn de som inte varit hos dig på länge.',
  },
  {
    value: 'promote_event',
    title: 'Marknadsför ett event eller lansering',
    description: 'Bjud in till ett särskilt tillfälle eller erbjudande.',
  },
];

export const industryOptions: Array<{
  value: IndustryKey;
  label: string;
  description: string;
  emoji: string;
}> = [
  {
    value: 'restaurant',
    label: 'Restaurang / Café',
    description: 'Boka fler bord, fyll kvällar och bygg stamkunder.',
    emoji: '🍽️',
  },
  {
    value: 'salon',
    label: 'Skönhet / Frisör',
    description: 'Hantera återkommande kunder och minska no-shows.',
    emoji: '💇‍♀️',
  },
  {
    value: 'workshop',
    label: 'Verkstad / Service',
    description: 'Påminn om service och följ upp efter besök.',
    emoji: '🔧',
  },
  {
    value: 'b2b',
    label: 'B2B / Annan tjänst',
    description: 'Boka demo, följ upp och håll partnern informerad.',
    emoji: '🏢',
  },
];

export function getSetupBlueprint(industry: IndustryKey, goal: SetupGoal): SetupBlueprint {
  const createBlueprint = industryBlueprints[industry] ?? industryBlueprints.b2b;
  return createBlueprint(goal);
}
