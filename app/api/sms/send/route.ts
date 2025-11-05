import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { elksClient } from "@/lib/46elks/client";
import { resolvePlaceholders } from "@/lib/utils/placeholders";
import { calculateSMSSegments } from "@/lib/utils/sms";

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
    const { contactId, message, templateId } = await request.json();

    if (!contactId || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get contact
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", contactId)
      .eq("organization_id", user.organization_id)
      .eq("sms_consent", true)
      .single();

    if (contactError || !contact) {
      return NextResponse.json(
        { error: "Contact not found or no SMS consent" },
        { status: 404 },
      );
    }

    // Get organization settings
    const { data: org } = await supabase
      .from("organizations")
      .select("sms_sender_name, sms_credits, name, plan")
      .eq("id", user.organization_id)
      .single();

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 },
      );
    }

    // Check SMS credits
    if ((org.sms_credits ?? 0) <= 0) {
      return NextResponse.json(
        { error: "Insufficient SMS credits" },
        { status: 402 },
      );
    }

    const { rendered: personalizedMessage, unmatched } = resolvePlaceholders(
      message,
      {
        contact,
        organization: org,
      },
    );

    if (unmatched.length > 0) {
      return NextResponse.json(
        {
          error: `Okända placeholders: ${unmatched.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const segments = calculateSMSSegments(personalizedMessage);

    if (segments <= 0) {
      return NextResponse.json(
        { error: "Meddelandet verkar vara tomt efter personalisering" },
        { status: 400 },
      );
    }

    if ((org.sms_credits ?? 0) < segments) {
      return NextResponse.json(
        {
          error: `Otillräckliga SMS-krediter. Meddelandet kräver ${segments} kredit(er).`,
        },
        { status: 402 },
      );
    }

    // Send SMS via 46elks
    const smsResult = await elksClient.sendSMS({
      to: contact.phone,
      message: personalizedMessage,
      from: org.sms_sender_name || "MEDDELA",
    });

    // Check if SMS failed
    if ("code" in smsResult) {
      throw new Error(smsResult.message);
    }

    // Save SMS to database
    const { error: insertError } = await supabase.from("sms_messages").insert({
      organization_id: user.organization_id,
      contact_id: contactId,
      user_id: session.user.id,
      to_phone: contact.phone,
      message: personalizedMessage,
      sender_name: org.sms_sender_name || "MEDDELA",
      type: "manual",
      template_id: templateId || null,
      status: "sent",
      sent_at: new Date().toISOString(),
      external_id: smsResult.id,
      cost: smsResult.cost,
    });

    if (insertError) {
      console.error("Failed to save SMS to database:", insertError);
    }

    // Update contact stats
    await supabase
      .from("contacts")
      .update({
        total_sms_sent: (contact.total_sms_sent || 0) + 1,
      })
      .eq("id", contactId);

    // Deduct SMS credits
    await supabase
      .from("organizations")
      .update({
        sms_credits: (org.sms_credits ?? 0) - segments,
      })
      .eq("id", user.organization_id);

    return NextResponse.json({
      success: true,
      smsId: smsResult.id,
      cost: smsResult.cost,
    });
  } catch (error: any) {
    console.error("SMS send error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send SMS" },
      { status: 500 },
    );
  }
}
