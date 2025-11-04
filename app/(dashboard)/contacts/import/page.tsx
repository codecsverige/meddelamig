'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Upload, Download, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { formatPhoneNumber } from '@/lib/utils/phone';

export default function ImportContactsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file type
      const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.xlsx')) {
        alert('Endast CSV och Excel filer tillåtna');
        return;
      }
      setFile(selectedFile);
      setResults(null);
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(/[,;|\t]/).map(h => h.trim().toLowerCase());
    const contacts = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(/[,;|\t]/).map(v => v.trim());
      const contact: any = {};

      headers.forEach((header, index) => {
        if (header.includes('name') || header.includes('namn')) {
          contact.name = values[index];
        } else if (header.includes('phone') || header.includes('telefon') || header.includes('mobil')) {
          contact.phone = values[index];
        } else if (header.includes('email') || header.includes('epost')) {
          contact.email = values[index];
        } else if (header.includes('tag') || header.includes('tags')) {
          contact.tags = values[index] ? values[index].split(',').map((t: string) => t.trim()) : [];
        }
      });

      if (contact.phone) {
        contacts.push(contact);
      }
    }

    return contacts;
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    const errors: string[] = [];
    let successCount = 0;
    let failedCount = 0;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data: user } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', session.user.id)
        .single();

      if (!user?.organization_id) throw new Error('No organization');

      // Read file
      const text = await file.text();
      const contacts = parseCSV(text);

      if (contacts.length === 0) {
        throw new Error('Inga kontakter hittades i filen. Kontrollera formatet.');
      }

      // Process each contact
      for (const contact of contacts) {
        try {
          // Format phone number
          const formattedPhone = formatPhoneNumber(contact.phone);
          if (!formattedPhone) {
            errors.push(`Ogiltigt telefonnummer: ${contact.phone}`);
            failedCount++;
            continue;
          }

          // Insert contact
          const { error } = await supabase.from('contacts').insert({
            organization_id: user.organization_id,
            name: contact.name || null,
            phone: formattedPhone,
            email: contact.email || null,
            tags: contact.tags || [],
            sms_consent: true,
            marketing_consent: false,
            consent_date: new Date().toISOString(),
            consent_source: 'import',
          });

          if (error) {
            if (error.code === '23505') {
              errors.push(`Kontakt finns redan: ${contact.phone}`);
            } else {
              errors.push(`${contact.phone}: ${error.message}`);
            }
            failedCount++;
          } else {
            successCount++;
          }
        } catch (err: any) {
          errors.push(`${contact.phone}: ${err.message}`);
          failedCount++;
        }
      }

      setResults({
        success: successCount,
        failed: failedCount,
        errors: errors.slice(0, 10), // Show first 10 errors
      });

    } catch (error: any) {
      alert(error.message || 'Ett fel uppstod');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csv = `namn,telefon,email,tags
Anna Andersson,0701234567,anna@example.com,vip
Erik Svensson,0709876543,erik@example.com,regular
Maria Johansson,0707654321,maria@example.com,new`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'meddela-kontakter-mall.csv';
    a.click();
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <Link
        href="/contacts"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Tillbaka till kontakter
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Importera kontakter</CardTitle>
          <CardDescription>
            Ladda upp en CSV eller Excel-fil med dina kontakter
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">📋 Instruktioner:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Filen måste innehålla kolumner: <strong>namn, telefon</strong></li>
              <li>• Valfria kolumner: <strong>email, tags</strong></li>
              <li>• Telefonnummer i svenskt format (070...)</li>
              <li>• CSV eller Excel format (.csv, .xlsx)</li>
              <li>• Max 1000 kontakter per import</li>
            </ul>
          </div>

          {/* Download Template */}
          <div>
            <Button variant="outline" onClick={downloadTemplate} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Ladda ner exempelfil
            </Button>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Välj fil *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="h-12 w-12 text-gray-400 mb-3" />
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {file ? file.name : 'Klicka för att välja fil'}
                </p>
                <p className="text-xs text-gray-500">
                  CSV eller Excel (max 5MB)
                </p>
              </label>
            </div>
          </div>

          {/* Import Button */}
          <Button
            onClick={handleImport}
            disabled={!file || loading}
            className="w-full"
          >
            {loading ? 'Importerar...' : 'Importera kontakter'}
          </Button>

          {/* Results */}
          {results && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-900">Lyckades</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">{results.success}</p>
                  <p className="text-sm text-green-700">kontakter importerade</p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="font-semibold text-red-900">Misslyckades</span>
                  </div>
                  <p className="text-2xl font-bold text-red-900">{results.failed}</p>
                  <p className="text-sm text-red-700">kontakter</p>
                </div>
              </div>

              {results.errors.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <span className="font-semibold text-yellow-900">
                      Fel (visar {results.errors.length} av {results.failed})
                    </span>
                  </div>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    {results.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <Button
                onClick={() => router.push('/contacts')}
                variant="outline"
                className="w-full"
              >
                Gå till kontakter
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
