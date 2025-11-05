import { NextResponse } from "next/server";

import {
  SmsCreditError,
  SmsServiceError,
  sendPersonalizedSMS,
} from "@/lib/services/sms";
import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_BATCH_LIMIT = 10;

export async function POST(request: Request) {
  try {
    const secret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization") || "";

    if (!secret) {
      return NextResponse.json(
        { error: "CRON_SECRET is not configured" },
        { status: 500 },
      );
    }

    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const nowIso = new Date().toISOString();

    const { data: campaigns, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_for", nowIso)
      .order("scheduled_for", { ascending: true })
      .limit(DEFAULT_BATCH_LIMIT);

    if (error) {
      throw new Error(error.message);
    }

    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json({ processed: 0, campaigns: [] });
    }

    const results: Array<{
      campaignId: string;
      sent: number;
      failed: number;
      cost: number;
    }> = [];

    for (const campaign of campaigns) {
      const contactIds = campaign.target_contact_ids || [];

      if (contactIds.length === 0) {
        await supabase
          .from("campaigns")
          .update({
            status: "completed",
            sent_count: 0,
            failed_count: 0,
            total_cost: 0,
            completed_at: new Date().toISOString(),
          })
          .eq("id", campaign.id);

        results.push({ campaignId: campaign.id, sent: 0, failed: 0, cost: 0 });
        continue;
      }

      await supabase
        .from("campaigns")
        .update({ status: "sending" })
        .eq("id", campaign.id);

      const { data: contactsData, error: contactsError } = await supabase
        .from("contacts")
        .select("*")
        .in("id", contactIds)
        .eq("organization_id", campaign.organization_id)
        .is("deleted_at", null);

      if (contactsError) {
        throw new Error(contactsError.message);
      }

      const contactMap = new Map((contactsData || []).map((c) => [c.id, c]));

      const { data: organization, error: orgError } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", campaign.organization_id)
        .single();

      if (orgError) {
        throw new Error(orgError.message);
      }

      let sent = 0;
      let failed = 0;
      let totalCost = 0;
      let creditsExhausted = false;

      for (const contactId of contactIds) {
        if (creditsExhausted) {
          failed += 1;
          continue;
        }

        const contact = contactMap.get(contactId);

        if (!contact) {
          failed += 1;
          continue;
        }

        try {
          const result = await sendPersonalizedSMS({
            supabase,
            organizationId: campaign.organization_id,
            userId: campaign.user_id,
            contactId,
            message: campaign.message,
            templateId: null,
            messageType: "marketing",
            contact,
            organization,
          });

          sent += 1;
          totalCost += Number(result.cost ?? 0);
        } catch (err) {
          failed += 1;

          if (err instanceof SmsCreditError) {
            creditsExhausted = true;
          }
        }
      }

      await supabase
        .from("campaigns")
        .update({
          status: "completed",
          sent_count: sent,
          failed_count: failed,
          total_cost: totalCost,
          completed_at: new Date().toISOString(),
        })
        .eq("id", campaign.id);

      results.push({ campaignId: campaign.id, sent, failed, cost: totalCost });
    }

    return NextResponse.json({ processed: results.length, campaigns: results });
  } catch (error: any) {
    console.error("Process campaigns error:", error);

    if (error instanceof SmsServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to process campaigns" },
      { status: 500 },
    );
  }
}
