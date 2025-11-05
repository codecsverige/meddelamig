import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

function escapeCSVValue(
  value: string | number | boolean | null | undefined,
): string {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = typeof value === "string" ? value : String(value);
  if (
    stringValue.includes('"') ||
    stringValue.includes(",") ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const { data: contacts, error } = await supabase
      .from("contacts")
      .select(
        "name, phone, email, tags, sms_consent, marketing_consent, created_at",
      )
      .eq("organization_id", user.organization_id)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    const header = [
      "Name",
      "Phone",
      "Email",
      "Tags",
      "SMS Consent",
      "Marketing Consent",
      "Created At",
    ];

    const rows = (contacts || []).map((contact) => [
      escapeCSVValue(contact.name || ""),
      escapeCSVValue(contact.phone || ""),
      escapeCSVValue(contact.email || ""),
      escapeCSVValue((contact.tags || []).join("; ")),
      escapeCSVValue(contact.sms_consent ? "Yes" : "No"),
      escapeCSVValue(contact.marketing_consent ? "Yes" : "No"),
      escapeCSVValue(
        contact.created_at ? new Date(contact.created_at).toISOString() : "",
      ),
    ]);

    const csvContent = [header, ...rows].map((row) => row.join(",")).join("\n");

    const timestamp = new Date().toISOString().split("T")[0];

    return new NextResponse(`\uFEFF${csvContent}`, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="meddela-contacts-${timestamp}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Contact export error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to export contacts" },
      { status: 500 },
    );
  }
}
