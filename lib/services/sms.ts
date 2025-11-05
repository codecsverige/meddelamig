import { SupabaseClient } from "@supabase/supabase-js";

import { elksClient } from "@/lib/46elks/client";
import {
  PlaceholderContext,
  resolvePlaceholders,
} from "@/lib/utils/placeholders";
import { calculateSMSSegments } from "@/lib/utils/sms";
import type { Database } from "@/lib/supabase/types";

type SmsMessageType =
  Database["public"]["Tables"]["sms_messages"]["Row"]["type"];

interface BaseSmsOptions {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  userId: string | null;
  contactId: string;
  message: string;
  templateId?: string | null;
  messageType?: SmsMessageType;
  contact?: Database["public"]["Tables"]["contacts"]["Row"] | null;
  organization?: Database["public"]["Tables"]["organizations"]["Row"] | null;
}

export class SmsServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "SmsServiceError";
    this.statusCode = statusCode;
  }
}

export class SmsPlaceholderError extends SmsServiceError {
  tokens: string[];

  constructor(tokens: string[]) {
    super(`Okända placeholders: ${tokens.join(", ")}`, 400);
    this.name = "SmsPlaceholderError";
    this.tokens = tokens;
  }
}

export class SmsConsentError extends SmsServiceError {
  constructor() {
    super("Kontakt saknas eller har inte gett SMS-godkännande.", 404);
    this.name = "SmsConsentError";
  }
}

export class SmsCreditError extends SmsServiceError {
  constructor() {
    super("Otillräckliga SMS-krediter.", 402);
    this.name = "SmsCreditError";
  }
}

export class SmsContentError extends SmsServiceError {
  constructor() {
    super("Meddelandet verkar vara tomt efter personalisering.");
    this.name = "SmsContentError";
  }
}

export class SmsProviderError extends SmsServiceError {
  constructor(message: string) {
    super(message || "Misslyckades med att skicka SMS", 502);
    this.name = "SmsProviderError";
  }
}

interface SmsResult {
  smsId: string;
  cost: number | null;
  segments: number;
  personalizedMessage: string;
}

export async function sendPersonalizedSMS({
  supabase,
  organizationId,
  userId,
  contactId,
  message,
  templateId = null,
  messageType = "manual",
  contact,
  organization,
}: BaseSmsOptions): Promise<SmsResult> {
  if (!message?.trim()) {
    throw new SmsContentError();
  }

  const contactRecord =
    contact ||
    (await supabase
      .from("contacts")
      .select("*")
      .eq("id", contactId)
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .single()
      .then((res) => res.data));

  if (!contactRecord || !contactRecord.sms_consent) {
    throw new SmsConsentError();
  }

  const organizationRecord =
    organization ||
    (await supabase
      .from("organizations")
      .select("*")
      .eq("id", organizationId)
      .single()
      .then((res) => res.data));

  if (!organizationRecord) {
    throw new SmsServiceError("Organisation hittades inte", 400);
  }

  if ((organizationRecord.sms_credits ?? 0) <= 0) {
    throw new SmsCreditError();
  }

  const placeholderContext: PlaceholderContext = {
    contact: contactRecord,
    organization: organizationRecord,
  };

  const { rendered, unmatched } = resolvePlaceholders(
    message,
    placeholderContext,
  );

  if (unmatched.length > 0) {
    throw new SmsPlaceholderError(unmatched);
  }

  const segments = calculateSMSSegments(rendered);

  if (segments <= 0) {
    throw new SmsContentError();
  }

  if ((organizationRecord.sms_credits ?? 0) < segments) {
    throw new SmsCreditError();
  }

  const smsResult = await elksClient.sendSMS({
    to: contactRecord.phone,
    message: rendered,
    from: organizationRecord.sms_sender_name || "MEDDELA",
  });

  if ("code" in smsResult) {
    throw new SmsProviderError(smsResult.message);
  }

  const { error: insertError } = await supabase.from("sms_messages").insert({
    organization_id: organizationId,
    contact_id: contactId,
    user_id: userId,
    to_phone: contactRecord.phone,
    message: rendered,
    sender_name: organizationRecord.sms_sender_name || "MEDDELA",
    type: messageType,
    template_id: templateId || null,
    status: "sent",
    sent_at: new Date().toISOString(),
    external_id: smsResult.id,
    cost: smsResult.cost,
  });

  if (insertError) {
    throw new SmsServiceError(insertError.message, 500);
  }

  const { error: updateContactError } = await supabase
    .from("contacts")
    .update({
      total_sms_sent: (contactRecord.total_sms_sent || 0) + 1,
    })
    .eq("id", contactId);

  if (updateContactError) {
    throw new SmsServiceError(updateContactError.message, 500);
  }

  const updatedCredits = (organizationRecord.sms_credits ?? 0) - segments;

  const { error: updateOrgError } = await supabase
    .from("organizations")
    .update({ sms_credits: updatedCredits })
    .eq("id", organizationId);

  if (updateOrgError) {
    throw new SmsServiceError(updateOrgError.message, 500);
  }

  organizationRecord.sms_credits = updatedCredits;

  return {
    smsId: smsResult.id,
    cost: smsResult.cost ?? null,
    segments,
    personalizedMessage: rendered,
  };
}
