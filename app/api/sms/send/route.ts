import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  SmsCreditError,
  SmsPlaceholderError,
  SmsServiceError,
  sendPersonalizedSMS,
} from "@/lib/services/sms";

const ALLOWED_MESSAGE_TYPES = new Set([
  "manual",
  "marketing",
  "reminder",
  "confirmation",
]);

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: user } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", session.user.id)
      .single();

    if (!user?.organization_id) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 },
      );
    }

    // Get request body
    const { contactId, message, templateId, messageType } =
      await request.json();

    if (!contactId || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const resolvedMessageType =
      typeof messageType === "string" && ALLOWED_MESSAGE_TYPES.has(messageType)
        ? messageType
        : "manual";

    const result = await sendPersonalizedSMS({
      supabase,
      organizationId: user.organization_id,
      userId: session.user.id,
      contactId,
      message,
      templateId,
      messageType: resolvedMessageType as "marketing" | "reminder" | "confirmation" | "manual",
    });

    return NextResponse.json({
      success: true,
      smsId: result.smsId,
      cost: result.cost,
    });
  } catch (error: any) {
    console.error("SMS send error:", error);

    if (error instanceof SmsPlaceholderError) {
      return NextResponse.json(
        { error: error.message, placeholders: error.tokens },
        { status: error.statusCode },
      );
    }

    if (error instanceof SmsCreditError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    if (error instanceof SmsServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to send SMS" },
      { status: 500 },
    );
  }
}
