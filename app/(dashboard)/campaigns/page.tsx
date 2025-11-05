"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plus,
  Send,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { calculateSMSCost, calculateSMSSegments } from "@/lib/utils/sms";
import { useToast } from "@/components/ui/toast";
import {
  PLACEHOLDER_METADATA_BY_CATEGORY,
  resolvePlaceholders,
} from "@/lib/utils/placeholders";

const PLACEHOLDER_CATEGORY_LABELS: Record<
  keyof typeof PLACEHOLDER_METADATA_BY_CATEGORY,
  string
> = {
  contact: "Kontakt",
  organization: "Organisation",
  system: "System",
};

const PLACEHOLDER_CATEGORY_ORDER: Array<
  keyof typeof PLACEHOLDER_METADATA_BY_CATEGORY
> = ["contact", "organization", "system"];

export default function CampaignsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [organization, setOrganization] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    message: "",
    targetTags: [] as string[],
    targetContactIds: [] as string[],
  });

  const sampleContact = useMemo(() => {
    if (formData.targetContactIds.length === 0) {
      return null;
    }
    return (
      contacts.find((contact) => contact.id === formData.targetContactIds[0]) ||
      null
    );
  }, [contacts, formData.targetContactIds]);

  const placeholderResult = useMemo(() => {
    if (!formData.message) {
      return { rendered: "", unmatched: [] as string[] };
    }

    return resolvePlaceholders(formData.message, {
      contact: sampleContact,
      organization,
    });
  }, [formData.message, sampleContact, organization]);

  const previewMessage = sampleContact
    ? placeholderResult.rendered
    : formData.message;
  const metricsMessage = previewMessage || formData.message || "";
  const estimatedSegments = useMemo(
    () => calculateSMSSegments(metricsMessage),
    [metricsMessage],
  );
  const estimatedCost = useMemo(
    () => calculateSMSCost(metricsMessage),
    [metricsMessage],
  );
  const totalEstimatedCost = formData.targetContactIds.length * estimatedCost;
  const unmatchedPlaceholders = placeholderResult.unmatched;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data: user } = await supabase
        .from("users")
        .select("organization_id")
        .eq("id", session.user.id)
        .single();

      if (!user?.organization_id) return;

      const [campaignsResponse, contactsResponse, organizationResponse] =
        await Promise.all([
          supabase
            .from("campaigns")
            .select("*")
            .eq("organization_id", user.organization_id)
            .order("created_at", { ascending: false }),
          supabase
            .from("contacts")
            .select("*")
            .eq("organization_id", user.organization_id)
            .eq("marketing_consent", true)
            .is("deleted_at", null)
            .order("name"),
          supabase
            .from("organizations")
            .select("id, name, sms_sender_name, plan")
            .eq("id", user.organization_id)
            .single(),
        ]);

      setCampaigns(campaignsResponse.data || []);
      setContacts(contactsResponse.data || []);
      setOrganization(organizationResponse.data || null);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (unmatchedPlaceholders.length > 0) {
      showToast(
        `Ta bort okända placeholders: ${unmatchedPlaceholders.join(", ")}`,
        "error",
      );
      return;
    }

    if (!formData.message.trim()) {
      showToast("Meddelandet får inte vara tomt", "error");
      return;
    }

    if (formData.targetContactIds.length === 0) {
      showToast("Välj minst en mottagare", "error");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data: user } = await supabase
        .from("users")
        .select("organization_id")
        .eq("id", session.user.id)
        .single();

      if (!user?.organization_id) throw new Error("No organization");

      // Calculate recipients
      const totalRecipients = formData.targetContactIds.length;
      const totalCost = totalEstimatedCost;

      // Create campaign
      const { data: campaign, error } = await supabase
        .from("campaigns")
        .insert({
          organization_id: user.organization_id,
          user_id: session.user.id,
          name: formData.name,
          message: formData.message,
          target_tags:
            formData.targetTags.length > 0 ? formData.targetTags : null,
          target_contact_ids: formData.targetContactIds,
          status: "scheduled",
          total_recipients: totalRecipients,
          total_cost: totalCost,
        })
        .select()
        .single();

      if (error) throw error;

      // Send SMS to all recipients
      showToast(
        `Kampanj skapades! Skickar till ${totalRecipients} kontakter... 📤`,
        "info",
      );
      await sendCampaignSMS(
        campaign.id,
        formData.targetContactIds,
        formData.message,
      );

      setShowModal(false);
      setFormData({
        name: "",
        message: "",
        targetTags: [],
        targetContactIds: [],
      });
      showToast("Kampanj slutförd! ✅", "success");
      loadData();
    } catch (error: any) {
      showToast(error.message || "Ett fel uppstod", "error");
    } finally {
      setLoading(false);
    }
  };

  const sendCampaignSMS = async (
    campaignId: string,
    contactIds: string[],
    message: string,
  ) => {
    try {
      // Update campaign status
      await supabase
        .from("campaigns")
        .update({ status: "sending" })
        .eq("id", campaignId);

      let sent = 0;
      let failed = 0;

      // Send to each contact
      for (const contactId of contactIds) {
        try {
          const response = await fetch("/api/sms/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contactId,
              message,
            }),
          });

          if (response.ok) {
            sent++;
          } else {
            failed++;
          }
        } catch {
          failed++;
        }
      }

      // Update campaign with results
      await supabase
        .from("campaigns")
        .update({
          status: "completed",
          sent_count: sent,
          failed_count: failed,
          completed_at: new Date().toISOString(),
        })
        .eq("id", campaignId);
    } catch (error) {
      console.error("Failed to send campaign SMS:", error);
      await supabase
        .from("campaigns")
        .update({ status: "completed" })
        .eq("id", campaignId);
    }
  };

  const handleTagSelection = (tag: string) => {
    const newTags = formData.targetTags.includes(tag)
      ? formData.targetTags.filter((t) => t !== tag)
      : [...formData.targetTags, tag];

    setFormData({ ...formData, targetTags: newTags });

    // Auto-select contacts with these tags
    const matchingContacts = contacts
      .filter((c) => c.tags && newTags.some((tag) => c.tags.includes(tag)))
      .map((c) => c.id);

    setFormData((prev) => ({ ...prev, targetContactIds: matchingContacts }));
  };

  const handleInsertPlaceholder = (token: string) => {
    setFormData((prev) => {
      const current = prev.message || "";
      const needsSpace = current.length > 0 && !/\s$/.test(current);
      return {
        ...prev,
        message: `${current}${needsSpace ? " " : ""}${token}`,
      };
    });
  };

  const allTags = Array.from(new Set(contacts.flatMap((c) => c.tags || [])));

  const statusColors = {
    draft: "bg-gray-100 text-gray-800",
    scheduled: "bg-blue-100 text-blue-800",
    sending: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
  };

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Kampanjer</h1>
          <p className="text-gray-600">
            Skicka bulk SMS till flera kontakter samtidigt
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ny kampanj
        </Button>
      </div>

      {/* Campaigns List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Laddar kampanjer...</p>
        </div>
      ) : campaigns.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{campaign.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {new Date(campaign.created_at).toLocaleString("sv-SE")}
                    </CardDescription>
                  </div>
                  <span
                    className={`text-xs px-3 py-1 rounded-full ${statusColors[campaign.status as keyof typeof statusColors]}`}
                  >
                    {campaign.status === "completed"
                      ? "Slutförd"
                      : campaign.status === "sending"
                        ? "Skickar"
                        : campaign.status === "scheduled"
                          ? "Schemalagd"
                          : "Utkast"}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {campaign.message}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {campaign.total_recipients} mottagare
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {campaign.sent_count || 0} skickade
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-600">
                      {campaign.delivered_count || 0} levererade
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-gray-600">
                      {campaign.failed_count || 0} misslyckade
                    </span>
                  </div>
                </div>

                {campaign.total_cost && (
                  <div className="text-sm text-gray-600 border-t pt-3">
                    Kostnad:{" "}
                    <span className="font-medium">
                      {campaign.total_cost.toFixed(2)} SEK
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Send className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Inga kampanjer ännu
              </h3>
              <p className="mb-6">
                Skapa din första kampanj för att skicka SMS till flera kontakter
              </p>
              <Button onClick={() => setShowModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Skapa kampanj
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Campaign Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full my-8">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Skapa ny kampanj
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kampanjnamn *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="T.ex. Veckoslut erbjudande"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meddelande *
                  </label>
                  <div className="mb-3 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Dynamiska fält
                    </p>
                    <p className="text-xs text-gray-500">
                      Använd dessa placeholders för att personalisera utskicket
                      per mottagare.
                    </p>
                    {PLACEHOLDER_CATEGORY_ORDER.map((category) => {
                      const placeholders =
                        PLACEHOLDER_METADATA_BY_CATEGORY[category];
                      if (!placeholders.length) {
                        return null;
                      }
                      return (
                        <div key={category}>
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                            {PLACEHOLDER_CATEGORY_LABELS[category]}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {placeholders.map((placeholder) => (
                              <button
                                key={placeholder.token}
                                type="button"
                                onClick={() =>
                                  handleInsertPlaceholder(placeholder.token)
                                }
                                className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-50"
                                title={placeholder.description}
                              >
                                {placeholder.token}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <textarea
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    required
                    rows={6}
                    maxLength={1600}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Skriv ditt meddelande här..."
                  />
                  <div className="mt-2 flex justify-between text-xs text-gray-500">
                    <span>{formData.message.length} / 1600 tecken</span>
                    <span>
                      {estimatedSegments} SMS-del
                      {estimatedSegments !== 1 ? "ar" : ""} • ~
                      {estimatedCost.toFixed(2)} SEK
                    </span>
                  </div>
                  {unmatchedPlaceholders.length > 0 && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-amber-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span>
                        Okända placeholders: {unmatchedPlaceholders.join(", ")}.
                        Ta bort eller ersätt innan du skickar.
                      </span>
                    </div>
                  )}
                </div>

                {formData.message && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">
                          Förhandsvisning
                        </h4>
                        <p className="text-xs text-gray-500">
                          {sampleContact
                            ? `Visas för ${sampleContact.name || sampleContact.phone}`
                            : "Välj minst en mottagare för att se personalisering"}
                        </p>
                      </div>
                      {sampleContact && unmatchedPlaceholders.length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-amber-600">
                          <AlertTriangle className="h-4 w-4" />
                          <span>
                            Okänd placeholder kvar:{" "}
                            {unmatchedPlaceholders.join(", ")}.
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                      <p className="whitespace-pre-wrap text-sm text-gray-900">
                        {sampleContact ? previewMessage : formData.message}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tags Selection */}
                {allTags.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Välj efter taggar (valfritt)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {allTags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleTagSelection(tag)}
                          className={`px-3 py-1 rounded-full text-sm ${
                            formData.targetTags.includes(tag)
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contacts Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mottagare * ({formData.targetContactIds.length} valda)
                  </label>
                  <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto p-3">
                    {contacts.length > 0 ? (
                      contacts.map((contact) => (
                        <label
                          key={contact.id}
                          className="flex items-center gap-3 py-2 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.targetContactIds.includes(
                              contact.id,
                            )}
                            onChange={(e) => {
                              const newIds = e.target.checked
                                ? [...formData.targetContactIds, contact.id]
                                : formData.targetContactIds.filter(
                                    (id) => id !== contact.id,
                                  );
                              setFormData({
                                ...formData,
                                targetContactIds: newIds,
                              });
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {contact.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {contact.phone}
                            </p>
                          </div>
                          {contact.tags && contact.tags.length > 0 && (
                            <div className="flex gap-1">
                              {contact.tags.map((tag: string) => (
                                <span
                                  key={tag}
                                  className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </label>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Inga kontakter med marknadsföringsgodkännande hittades
                      </p>
                    )}
                  </div>
                </div>

                {/* Cost Preview */}
                {formData.targetContactIds.length > 0 && formData.message && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Kostnadsuppskattning
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Mottagare:</p>
                        <p className="font-medium text-gray-900">
                          {formData.targetContactIds.length}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total kostnad:</p>
                        <p className="font-medium text-gray-900">
                          {totalEstimatedCost.toFixed(2)} SEK
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-blue-700">
                      Baserat på nuvarande text{" "}
                      {sampleContact
                        ? `för ${sampleContact.name || sampleContact.phone}`
                        : ""}
                      . Slutlig kostnad kan variera per mottagare beroende på
                      placeholders.
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowModal(false);
                      setFormData({
                        name: "",
                        message: "",
                        targetTags: [],
                        targetContactIds: [],
                      });
                    }}
                    className="flex-1"
                  >
                    Avbryt
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      loading ||
                      formData.targetContactIds.length === 0 ||
                      unmatchedPlaceholders.length > 0 ||
                      !formData.name.trim() ||
                      !formData.message.trim()
                    }
                    className="flex-1"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {loading ? "Skickar..." : "Skicka kampanj"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
