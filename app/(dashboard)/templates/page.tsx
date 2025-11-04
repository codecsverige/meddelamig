'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, MessageSquare, Trash2, Edit2 } from 'lucide-react';

export default function TemplatesPage() {
  const supabase = createClient();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    message: '',
    category: 'reminder' as 'reminder' | 'confirmation' | 'marketing' | 'thank_you',
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: user } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', session.user.id)
        .single();

      if (!user?.organization_id) return;

      // Load user templates + global templates
      const { data } = await supabase
        .from('sms_templates')
        .select('*')
        .or(`organization_id.eq.${user.organization_id},is_global.eq.true`)
        .order('created_at', { ascending: false });

      setTemplates(data || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data: user } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', session.user.id)
        .single();

      if (!user?.organization_id) throw new Error('No organization');

      if (editingTemplate) {
        // Update existing template
        await supabase
          .from('sms_templates')
          .update({
            name: formData.name,
            message: formData.message,
            category: formData.category,
          })
          .eq('id', editingTemplate.id);
      } else {
        // Create new template
        await supabase.from('sms_templates').insert({
          organization_id: user.organization_id,
          name: formData.name,
          message: formData.message,
          category: formData.category,
          is_global: false,
        });
      }

      setShowModal(false);
      setEditingTemplate(null);
      setFormData({ name: '', message: '', category: 'reminder' });
      loadTemplates();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Är du säker på att du vill radera denna mall?')) return;

    try {
      await supabase.from('sms_templates').delete().eq('id', id);
      loadTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const handleEdit = (template: any) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      message: template.message,
      category: template.category,
    });
    setShowModal(true);
  };

  const categoryLabels = {
    reminder: 'Påminnelse',
    confirmation: 'Bekräftelse',
    marketing: 'Marknadsföring',
    thank_you: 'Tack',
  };

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SMS-mallar</h1>
          <p className="text-gray-600">
            Skapa och hantera dina meddelandemallar
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

      {/* Templates Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Laddar mallar...</p>
        </div>
      ) : templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {categoryLabels[template.category as keyof typeof categoryLabels]}
                      {template.is_global && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          Färdig mall
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-3 mb-4 max-h-32 overflow-y-auto">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {template.message}
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Använd {template.usage_count || 0} gånger</span>
                  {!template.is_global && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(template)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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
              <p className="mb-6">Skapa din första SMS-mall</p>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingTemplate ? 'Redigera mall' : 'Skapa ny mall'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mallnamn *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="T.ex. Bokningspåminnelse"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategori *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="reminder">Påminnelse</option>
                    <option value="confirmation">Bekräftelse</option>
                    <option value="marketing">Marknadsföring</option>
                    <option value="thank_you">Tack</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meddelande *
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={8}
                    maxLength={1600}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Skriv ditt meddelande här..."
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {formData.message.length} / 1600 tecken
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowModal(false);
                      setEditingTemplate(null);
                      setFormData({ name: '', message: '', category: 'reminder' });
                    }}
                    className="flex-1"
                  >
                    Avbryt
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
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
