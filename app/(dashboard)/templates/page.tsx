'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Copy, MessageSquare, X, Sparkles, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';
import {
  getPlaybooksForIndustry,
  industryOptions,
  type IndustryKey,
  type PlaybookDefinition,
} from '@/lib/setup/playbooks';

type Template = {
  id: string;
  name: string;
  message: string;
  category: 'reminder' | 'confirmation' | 'marketing' | 'thank_you';
  is_global: boolean;
  industry: string | null;
  usage_count: number;
  organization_id: string | null;
  created_at: string;
};

const CATEGORIES = [
  { value: 'reminder', label: 'Påminnelse', icon: '⏰' },
  { value: 'confirmation', label: 'Bekräftelse', icon: '✅' },
  { value: 'marketing', label: 'Marknadsföring', icon: '📢' },
  { value: 'thank_you', label: 'Tack', icon: '🙏' },
];

export default function TemplatesPage() {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [organizationIndustry, setOrganizationIndustry] = useState<IndustryKey | null>(null);
  const [applyingPlaybookId, setApplyingPlaybookId] = useState<string | null>(null);

  const recommendedPlaybooks = useMemo<PlaybookDefinition[]>(() => {
    if (!organizationIndustry) return [];
    return getPlaybooksForIndustry(organizationIndustry);
  }, [organizationIndustry]);

  const industryLabel = useMemo(() => {
    if (!organizationIndustry) return null;
    return industryOptions.find((option) => option.value === organizationIndustry)?.label ?? null;
  }, [organizationIndustry]);

  const [formData, setFormData] = useState({
    name: '',
    message: '',
    category: 'reminder' as Template['category'],
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      type UserWithOrg = {
        organization_id: string | null;
        organizations: { industry: IndustryKey | null } | null;
      };

      const { data: userData } = await supabase
        .from('users')
        .select('organization_id, organizations(industry)')
        .eq('id', session.user.id)
        .single();

      const user = (userData as UserWithOrg | null);

      if (!user?.organization_id) {
        router.push('/onboarding');
        return;
      }

      setOrganizationIndustry(user.organizations?.industry ?? null);

      // Get both global templates and organization templates
      const { data, error } = await supabase
        .from('sms_templates')
        .select('*')
        .or(`organization_id.eq.${user.organization_id},is_global.eq.true`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTemplates(data || []);
    } catch (error: any) {
      showToast(error.message || 'Kunde inte ladda mallar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyPlaybook = async (playbookId: string) => {
    try {
      setApplyingPlaybookId(playbookId);
      const response = await fetch('/api/setup/playbooks/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playbookId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Kunde inte aktivera playbook.');
      }

      showToast(
        `Playbook "${data.playbook?.title ?? 'Okänd'}" aktiverad – ${data.templatesInserted ?? 0} mallar redo.`,
        'success',
      );

      await loadTemplates();
    } catch (error: any) {
      showToast(error.message || 'Något gick fel när playbook aktiverades', 'error');
    } finally {
      setApplyingPlaybookId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Inte inloggad');

      const { data: user } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', session.user.id)
        .single();

      if (!user?.organization_id) throw new Error('Ingen organisation');

      if (editingTemplate) {
        // Update existing template
        const { error } = await supabase
          .from('sms_templates')
          .update({
            name: formData.name,
            message: formData.message,
            category: formData.category,
          })
          .eq('id', editingTemplate.id)
          .eq('organization_id', user.organization_id); // Ensure user owns it

        if (error) throw error;
        showToast('Mall uppdaterad!', 'success');
      } else {
        // Create new template
        const { error } = await supabase
          .from('sms_templates')
          .insert({
            organization_id: user.organization_id,
            name: formData.name,
            message: formData.message,
            category: formData.category,
            is_global: false,
          });

        if (error) throw error;
        showToast('Mall skapad!', 'success');
      }

      setShowModal(false);
      setEditingTemplate(null);
      setFormData({ name: '', message: '', category: 'reminder' });
      loadTemplates();
    } catch (error: any) {
      showToast(error.message || 'Något gick fel', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: Template) => {
    if (template.is_global) {
      showToast('Globala mallar kan inte redigeras', 'error');
      return;
    }

    setEditingTemplate(template);
    setFormData({
      name: template.name,
      message: template.message,
      category: template.category,
    });
    setShowModal(true);
  };

  const handleDelete = async (templateId: string, isGlobal: boolean) => {
    if (isGlobal) {
      showToast('Globala mallar kan inte tas bort', 'error');
      return;
    }

    if (!confirm('Är du säker på att du vill ta bort denna mall?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Inte inloggad');

      const { data: user } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', session.user.id)
        .single();

      const { error } = await supabase
        .from('sms_templates')
        .delete()
        .eq('id', templateId)
        .eq('organization_id', user?.organization_id); // Ensure user owns it

      if (error) throw error;

      showToast('Mall borttagen', 'success');
      loadTemplates();
    } catch (error: any) {
      showToast(error.message || 'Kunde inte ta bort mall', 'error');
    }
  };

  const handleDuplicate = async (template: Template) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Inte inloggad');

      const { data: user } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', session.user.id)
        .single();

      if (!user?.organization_id) throw new Error('Ingen organisation');

      const { error } = await supabase
        .from('sms_templates')
        .insert({
          organization_id: user.organization_id,
          name: `${template.name} (Kopia)`,
          message: template.message,
          category: template.category,
          is_global: false,
        });

      if (error) throw error;

      showToast('Mall duplicerad!', 'success');
      loadTemplates();
    } catch (error: any) {
      showToast(error.message || 'Kunde inte duplicera mall', 'error');
    }
  };

  const filteredTemplates = selectedCategory === 'all'
    ? templates
    : templates.filter(t => t.category === selectedCategory);

  const categoryBadgeColors = {
    reminder: 'bg-blue-100 text-blue-800',
    confirmation: 'bg-green-100 text-green-800',
    marketing: 'bg-purple-100 text-purple-800',
    thank_you: 'bg-pink-100 text-pink-800',
  };

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SMS-mallar</h1>
          <p className="text-gray-600">
            Skapa och hantera återanvändbara SMS-mallar
          </p>
        </div>
        <Button onClick={() => {
          setEditingTemplate(null);
          setFormData({ name: '', message: '', category: 'reminder' });
          setShowModal(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Ny mall
        </Button>
      </div>

        {recommendedPlaybooks.length > 0 && (
          <Card className="mb-8 border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-100/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Playbooks{industryLabel ? ` för ${industryLabel}` : ''}
              </CardTitle>
              <CardDescription>
                Startklara sekvenser med mallar, kampanjer och automations-förslag anpassade efter din verksamhet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {recommendedPlaybooks.map((playbook) => {
                  const extraTemplatesCount = playbook.extraTemplates?.length ?? 0;
                  const extraCampaignsCount = playbook.extraCampaigns?.length ?? 0;
                  const isApplying = applyingPlaybookId === playbook.id;

                  return (
                    <div
                      key={playbook.id}
                      className="flex flex-col justify-between h-full border border-blue-100 bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{playbook.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{playbook.headline}</p>
                          </div>
                          <span className="text-xs font-semibold uppercase text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                            {playbook.goal === 'increase_bookings'
                              ? 'Fyll tider'
                              : playbook.goal === 'reactivate_customers'
                              ? 'Återaktivera'
                              : 'Event & demo'}
                          </span>
                        </div>

                        <ul className="mt-4 space-y-2">
                          {playbook.outcomes.map((outcome) => (
                            <li key={outcome} className="flex items-start gap-2 text-sm text-gray-700">
                              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                              <span>{outcome}</span>
                            </li>
                          ))}
                        </ul>

                        {(extraTemplatesCount > 0 || extraCampaignsCount > 0) && (
                          <div className="mt-4 text-xs text-gray-500 flex items-center gap-3">
                            {extraTemplatesCount > 0 && <span>+{extraTemplatesCount} extra mallar</span>}
                            <span>+{extraCampaignsCount + 1} kampanjer totalt</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-6 flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          Aktiverar även förinställda automationsförslag.
                        </div>
                        <Button
                          onClick={() => applyPlaybook(playbook.id)}
                          disabled={isApplying}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {isApplying ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Aktiverar...
                            </>
                          ) : (
                            <>
                              Aktivera playbook
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
        >
          Alla ({templates.length})
        </Button>
        {CATEGORIES.map(cat => {
          const count = templates.filter(t => t.category === cat.value).length;
          return (
            <Button
              key={cat.value}
              variant={selectedCategory === cat.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat.value)}
            >
              {cat.icon} {cat.label} ({count})
            </Button>
          );
        })}
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Laddar mallar...</p>
        </div>
      ) : filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  {template.is_global && (
                    <Badge variant="outline" className="text-xs">
                      Global
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${categoryBadgeColors[template.category]}`}>
                    {CATEGORIES.find(c => c.value === template.category)?.label}
                  </span>
                  {template.usage_count > 0 && (
                    <span className="text-xs text-gray-500">
                      Använd {template.usage_count}x
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-3 mb-4 min-h-[100px]">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-4">
                    {template.message}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicate(template)}
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Kopiera
                  </Button>
                  {!template.is_global && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(template.id, template.is_global)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Inga mallar ännu
              </h3>
              <p className="mb-6">
                Skapa din första SMS-mall för att spara tid
              </p>
              <Button onClick={() => setShowModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Skapa mall
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingTemplate ? 'Redigera mall' : 'Skapa ny mall'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingTemplate(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mallnamn *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="T.ex. Bokningspåminnelse"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategori *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat.value as Template['category'] })}
                        className={`p-4 border-2 rounded-lg text-left transition-colors ${
                          formData.category === cat.value
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{cat.icon}</div>
                        <div className="font-medium text-gray-900">{cat.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meddelande *
                  </label>
                  <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-800 mb-2">
                      <strong>Användbara placeholders:</strong>
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <code className="px-2 py-1 bg-white rounded">{'{{name}}'}</code>
                      <code className="px-2 py-1 bg-white rounded">{'{{phone}}'}</code>
                      <code className="px-2 py-1 bg-white rounded">{'{{organization}}'}</code>
                      <code className="px-2 py-1 bg-white rounded">{'{{date}}'}</code>
                      <code className="px-2 py-1 bg-white rounded">{'{{time}}'}</code>
                    </div>
                  </div>
                  <textarea
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={6}
                    maxLength={1600}
                    placeholder="Hej {{name}}! Detta är en påminnelse om din bokning hos {{organization}} kl {{time}}."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <div className="mt-2 flex justify-between text-xs text-gray-500">
                    <span>{formData.message.length} / 1600 tecken</span>
                    <span>{Math.ceil(formData.message.length / 160)} SMS-del{Math.ceil(formData.message.length / 160) !== 1 ? 'ar' : ''}</span>
                  </div>
                </div>

                {/* Preview */}
                {formData.message && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Förhandsvisning
                    </h4>
                    <div className="rounded-lg bg-white border border-gray-200 p-3 shadow-sm">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">
                        {formData.message
                          .replace(/\{\{name\}\}/g, 'Anna Andersson')
                          .replace(/\{\{phone\}\}/g, '+46701234567')
                          .replace(/\{\{organization\}\}/g, 'Min Restaurang')
                          .replace(/\{\{date\}\}/g, '2024-01-15')
                          .replace(/\{\{time\}\}/g, '18:00')
                        }
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowModal(false);
                      setEditingTemplate(null);
                    }}
                    className="flex-1"
                  >
                    Avbryt
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !formData.name || !formData.message}
                    className="flex-1"
                  >
                    {loading ? 'Sparar...' : editingTemplate ? 'Uppdatera' : 'Skapa mall'}
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
