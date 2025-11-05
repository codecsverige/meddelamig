'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Plus, Edit, Trash2, Copy, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface Template {
  id: string;
  name: string;
  message: string;
  category: string;
  organization_id: string | null;
  usage_count: number;
}

export default function TemplatesPage() {
  const supabase = createClient();
  const { showToast } = useToast();
  
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    message: '',
    category: 'general',
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!userData?.organization_id) return;

      // Fetch both global and organization templates
      const { data, error } = await supabase
        .from('sms_templates')
        .select('*')
        .or(`organization_id.is.null,organization_id.eq.${userData.organization_id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      showToast('Kunde inte ladda mallar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Inte inloggad');

      const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!userData?.organization_id) throw new Error('Organisation saknas');

      if (editingTemplate) {
        // Update existing template
        const { error } = await supabase
          .from('sms_templates')
          .update({
            name: formData.name,
            message: formData.message,
            category: formData.category,
          })
          .eq('id', editingTemplate.id);

        if (error) throw error;
        showToast('Mall uppdaterad! ✅', 'success');
      } else {
        // Create new template
        const { error } = await supabase
          .from('sms_templates')
          .insert({
            name: formData.name,
            message: formData.message,
            category: formData.category,
            organization_id: userData.organization_id,
            usage_count: 0,
          });

        if (error) throw error;
        showToast('Mall skapad! ✅', 'success');
      }

      setFormData({ name: '', message: '', category: 'general' });
      setShowForm(false);
      setEditingTemplate(null);
      fetchTemplates();
    } catch (error: any) {
      console.error('Error saving template:', error);
      showToast(error.message || 'Kunde inte spara mall', 'error');
    }
  };

  const handleEdit = (template: Template) => {
    if (template.organization_id === null) {
      showToast('Globala mallar kan inte redigeras', 'warning');
      return;
    }
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      message: template.message,
      category: template.category,
    });
    setShowForm(true);
  };

  const handleDelete = async (templateId: string, isGlobal: boolean) => {
    if (isGlobal) {
      showToast('Globala mallar kan inte tas bort', 'warning');
      return;
    }

    if (!confirm('Är du säker på att du vill ta bort denna mall?')) return;

    try {
      const { error } = await supabase
        .from('sms_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      showToast('Mall borttagen', 'success');
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      showToast('Kunde inte ta bort mall', 'error');
    }
  };

  const handleCopy = (message: string) => {
    navigator.clipboard.writeText(message);
    showToast('Meddelande kopierat! 📋', 'success');
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'restaurant': return 'bg-orange-100 text-orange-800';
      case 'salon': return 'bg-pink-100 text-pink-800';
      case 'workshop': return 'bg-blue-100 text-blue-800';
      case 'b2b': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'restaurant': return 'Restaurant';
      case 'salon': return 'Salong';
      case 'workshop': return 'Verkstad';
      case 'b2b': return 'B2B';
      default: return 'Allmän';
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-600">Laddar mallar...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SMS-mallar</h1>
          <p className="text-gray-600">
            Skapa och hantera återanvändbara SMS-mallar för ditt företag
          </p>
        </div>
        <Button
          onClick={() => {
            setShowForm(true);
            setEditingTemplate(null);
            setFormData({ name: '', message: '', category: 'general' });
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Ny mall
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>
              {editingTemplate ? 'Redigera mall' : 'Skapa ny mall'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mallnamn
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="T.ex. Bokningspåminnelse"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="general">Allmän</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="salon">Salong</option>
                  <option value="workshop">Verkstad</option>
                  <option value="b2b">B2B</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meddelande
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Skriv ditt SMS-meddelande här..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.message.length} / 1600 tecken
                </p>
              </div>

              <div className="flex gap-3">
                <Button type="submit">
                  {editingTemplate ? 'Uppdatera' : 'Skapa mall'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingTemplate(null);
                    setFormData({ name: '', message: '', category: 'general' });
                  }}
                >
                  Avbryt
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Templates Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => {
          const isGlobal = template.organization_id === null;
          return (
            <Card key={template.id} className={isGlobal ? 'border-blue-200 bg-blue-50/50' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(template.category)}`}>
                        {getCategoryName(template.category)}
                      </span>
                      {isGlobal && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Global
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopy(template.message)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Kopiera"
                    >
                      <Copy className="h-4 w-4 text-gray-600" />
                    </button>
                    {!isGlobal && (
                      <>
                        <button
                          onClick={() => handleEdit(template)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Redigera"
                        >
                          <Edit className="h-4 w-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(template.id, isGlobal)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                          title="Ta bort"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 mb-4 whitespace-pre-wrap">
                  {template.message}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <FileText className="h-3 w-3" />
                  <span>Använd {template.usage_count} gånger</span>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {templates.length === 0 && (
          <div className="col-span-full text-center py-12">
            <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Inga mallar ännu
            </h3>
            <p className="text-gray-600 mb-4">
              Skapa din första SMS-mall för att komma igång
            </p>
            <Button
              onClick={() => {
                setShowForm(true);
                setEditingTemplate(null);
                setFormData({ name: '', message: '', category: 'general' });
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Skapa första mall
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
