export type PlaceholderCategory = "contact" | "organization" | "system";

export interface PlaceholderMetadata {
  token: string;
  description: string;
  category: PlaceholderCategory;
}

export interface PlaceholderContext {
  contact?: {
    name?: string | null;
    phone?: string | null;
    email?: string | null;
    tags?: string[] | null;
  } | null;
  organization?: {
    name?: string | null;
    sms_sender_name?: string | null;
    plan?: string | null;
  } | null;
  locale?: string;
}

interface PlaceholderResult {
  rendered: string;
  unmatched: string[];
}

const PLACEHOLDER_RESOLVERS: Record<
  string,
  (context: PlaceholderContext) => string
> = {
  "contact.name": (context) => context.contact?.name?.trim() || "",
  "contact.first_name": (context) => getFirstName(context.contact?.name),
  "contact.last_name": (context) => getLastName(context.contact?.name),
  "contact.phone": (context) => context.contact?.phone?.trim() || "",
  "contact.email": (context) => context.contact?.email?.trim() || "",
  "contact.tags": (context) => {
    const tags = context.contact?.tags?.filter(Boolean) ?? [];
    return tags.length ? tags.join(", ") : "";
  },
  "organization.name": (context) => context.organization?.name?.trim() || "",
  "organization.plan": (context) =>
    context.organization?.plan?.toUpperCase() || "",
  "organization.sender_name": (context) =>
    context.organization?.sms_sender_name?.trim() || "",
  "date.today": (context) =>
    formatDate(new Date(), context.locale ?? "sv-SE", { dateStyle: "long" }),
  "date.today_short": (context) =>
    formatDate(new Date(), context.locale ?? "sv-SE", { dateStyle: "medium" }),
};

export const PLACEHOLDER_METADATA: PlaceholderMetadata[] = [
  {
    token: "{{contact.first_name}}",
    description: "Kontaktens förnamn (om det finns)",
    category: "contact",
  },
  {
    token: "{{contact.last_name}}",
    description: "Kontaktens efternamn (om det finns)",
    category: "contact",
  },
  {
    token: "{{contact.name}}",
    description: "Kontaktens fullständiga namn",
    category: "contact",
  },
  {
    token: "{{contact.phone}}",
    description: "Kontaktens telefonnummer",
    category: "contact",
  },
  {
    token: "{{contact.email}}",
    description: "Kontaktens e-postadress",
    category: "contact",
  },
  {
    token: "{{contact.tags}}",
    description: "Kontaktens taggar (kommaseparerade)",
    category: "contact",
  },
  {
    token: "{{organization.name}}",
    description: "Din organisations namn",
    category: "organization",
  },
  {
    token: "{{organization.plan}}",
    description: "Nuvarande abonnemangsplan",
    category: "organization",
  },
  {
    token: "{{organization.sender_name}}",
    description: "SMS-avsändarnamn",
    category: "organization",
  },
  {
    token: "{{date.today}}",
    description: "Datum i långt format (t.ex. 5 november 2025)",
    category: "system",
  },
  {
    token: "{{date.today_short}}",
    description: "Datum i kort format (t.ex. 5 nov. 2025)",
    category: "system",
  },
];

export const PLACEHOLDER_METADATA_BY_CATEGORY: Record<
  PlaceholderCategory,
  PlaceholderMetadata[]
> = PLACEHOLDER_METADATA.reduce(
  (acc, placeholder) => {
    acc[placeholder.category].push(placeholder);
    return acc;
  },
  {
    contact: [] as PlaceholderMetadata[],
    organization: [] as PlaceholderMetadata[],
    system: [] as PlaceholderMetadata[],
  },
);

const SUPPORTED_TOKENS = new Set(
  Object.keys(PLACEHOLDER_RESOLVERS).map((key) => key.toLowerCase()),
);

export function resolvePlaceholders(
  message: string,
  context: PlaceholderContext,
): PlaceholderResult {
  if (!message) {
    return { rendered: "", unmatched: [] };
  }

  const unmatched = new Set<string>();

  const rendered = message.replace(/{{\s*([^{}]+)\s*}}/g, (match, token) => {
    const normalizedToken = normalizeToken(token);

    if (!SUPPORTED_TOKENS.has(normalizedToken)) {
      unmatched.add(match);
      return match;
    }

    try {
      const replacement = PLACEHOLDER_RESOLVERS[normalizedToken](context);
      return replacement ?? "";
    } catch (error) {
      unmatched.add(match);
      return match;
    }
  });

  return {
    rendered,
    unmatched: Array.from(unmatched),
  };
}

function normalizeToken(rawToken: string): string {
  return rawToken.replace(/\s+/g, "").toLowerCase();
}

function getFirstName(name?: string | null): string {
  if (!name) {
    return "";
  }
  const parts = name.trim().split(/\s+/);
  return parts[0] || "";
}

function getLastName(name?: string | null): string {
  if (!name) {
    return "";
  }
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) {
    return "";
  }
  return parts.slice(1).join(" ");
}

function formatDate(
  date: Date,
  locale: string,
  options: Intl.DateTimeFormatOptions,
): string {
  try {
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch (error) {
    return date.toISOString().split("T")[0];
  }
}
