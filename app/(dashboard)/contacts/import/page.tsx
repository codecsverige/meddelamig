'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Upload, Download, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast';

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string; data: any }>;
}

export default function ImportContactsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const downloadTemplate = () => {
    const csvContent = 'name,phone,email,tags,notes,sms_consent,marketing_consent\n' +
      'Anna Andersson,0701234567,anna@example.com,vip;stamkund,Älskar italiensk mat,true,false\n' +
      'Erik Johansson,0709876543,erik@example.com,restaurant,Besöker ofta på fredagar,true,true\n';
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'kontakter_mall.csv';
    link.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      rows.push(row);
    }

    return rows;
  };

  const formatPhone = (phone: string): string => {
    let cleaned = phone.replace(/\s+/g, '');
    
    if (cleaned.startsWith('07') && cleaned.length === 10) {
      return '+46' + cleaned.substring(1);
    }
    
    if (cleaned.startsWith('46') && !cleaned.startsWith('+')) {
      return '+' + cleaned;
    }
    
    if (!cleaned.startsWith('+')) {
      return '+46' + cleaned;
    }
    
    return cleaned;
  };

  const validateContact = (contact: any, rowNumber: number): { valid: boolean; error?: string } => {
    if (!contact.name || contact.name.length < 2) {
      return { valid: false, error: `Rad ${rowNumber}: Ogiltigt namn` };
    }

    if (!contact.phone) {
      return { valid: false, error: `Rad ${rowNumber}: Telefonnummer saknas` };
    }

    const phoneRegex = /^(\+46|0)[1-9]\d{7,9}$/;
    const formattedPhone = formatPhone(contact.phone);
    if (!phoneRegex.test(formattedPhone)) {
      return { valid: false, error: `Rad ${rowNumber}: Ogiltigt telefonnummer (${contact.phone})` };
    }

    return { valid: true };
  };

  const handleImport = async () => {
    if (!file) {
      showToast('Välj en fil först', 'error');
      return;
    }

    setImporting(true);
    const importResult: ImportResult = { success: 0, failed: 0, errors: [] };

    try {
      // Get user's organization
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Inte inloggad');

      const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!userData?.organization_id) {
        throw new Error('Organisation saknas');
      }

      // Read file
      const text = await file.text();
      const contacts = parseCSV(text);

      if (contacts.length === 0) {
        showToast('Inga kontakter hittades i filen', 'error');
        setImporting(false);
        return;
      }

      // Process contacts
      for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];
        const rowNumber = i + 2; // +2 because row 1 is headers and we start at row 2

        // Validate
        const validation = validateContact(contact, rowNumber);
        if (!validation.valid) {
          importResult.failed++;
          importResult.errors.push({
            row: rowNumber,
            error: validation.error!,
            data: contact,
          });
          continue;
        }

        // Prepare data
        const contactData = {
          organization_id: userData.organization_id,
          name: contact.name,
          phone: formatPhone(contact.phone),
          email: contact.email || null,
          tags: contact.tags ? contact.tags.split(';').map((t: string) => t.trim()) : null,
          notes: contact.notes || null,
          sms_consent: contact.sms_consent === 'true' || contact.sms_consent === '1',
          marketing_consent: contact.marketing_consent === 'true' || contact.marketing_consent === '1',
        };

        // Insert
        const { error } = await supabase
          .from('contacts')
          .insert(contactData);

        if (error) {
          importResult.failed++;
          importResult.errors.push({
            row: rowNumber,
            error: error.message,
            data: contact,
          });
        } else {
          importResult.success++;
        }
      }

      setResult(importResult);
      
      if (importResult.success > 0) {
        showToast(
          `${importResult.success} kontakter importerade! ✅`,
          'success'
        );
      }

      if (importResult.failed > 0) {
        showToast(
          `${importResult.failed} kontakter misslyckades`,
          'error'
        );
      }
    } catch (error: any) {
      console.error('Import error:', error);
      showToast(error.message || 'Import misslyckades', 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/contacts"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Tillbaka till kontakter
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Importera kontakter
        </h1>
        <p className="text-gray-600">
          Importera kontakter från CSV eller Excel-fil
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instruktioner</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Ladda ner vår CSV-mall nedan</li>
              <li>Fyll i dina kontakter i filen</li>
              <li>Spara filen som CSV</li>
              <li>Ladda upp filen här</li>
            </ol>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Fältbeskrivning:</h3>
              <ul className="space-y-1 text-sm text-blue-800">
                <li><strong>name</strong>: För- och efternamn (obligatorisk)</li>
                <li><strong>phone</strong>: Telefonnummer i format 070XXXXXXX eller +46XXXXXXXXX (obligatorisk)</li>
                <li><strong>email</strong>: E-postadress (valfri)</li>
                <li><strong>tags</strong>: Taggar separerade med semikolon (t.ex. vip;stamkund) (valfri)</li>
                <li><strong>notes</strong>: Anteckningar (valfri)</li>
                <li><strong>sms_consent</strong>: true eller false (obligatorisk)</li>
                <li><strong>marketing_consent</strong>: true eller false (valfri)</li>
              </ul>
            </div>

            <Button
              onClick={downloadTemplate}
              className="mt-4"
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Ladda ner CSV-mall
            </Button>
          </CardContent>
        </Card>

        {/* Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Ladda upp fil</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <FileSpreadsheet className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Välj fil
                </label>

                {file && (
                  <p className="mt-4 text-sm text-gray-600">
                    Vald fil: <strong>{file.name}</strong>
                  </p>
                )}
              </div>

              <Button
                onClick={handleImport}
                disabled={!file || importing}
                className="w-full"
                size="lg"
              >
                {importing ? 'Importerar...' : 'Importera kontakter'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Importresultat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-900">Lyckades</span>
                    </div>
                    <p className="text-3xl font-bold text-green-600">
                      {result.success}
                    </p>
                    <p className="text-sm text-green-700">kontakter importerade</p>
                  </div>

                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <span className="font-semibold text-red-900">Misslyckades</span>
                    </div>
                    <p className="text-3xl font-bold text-red-600">
                      {result.failed}
                    </p>
                    <p className="text-sm text-red-700">fel upptäcktes</p>
                  </div>
                </div>

                {result.errors.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Fel ({result.errors.length})
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {result.errors.map((error, index) => (
                        <div
                          key={index}
                          className="p-3 bg-red-50 border border-red-200 rounded text-sm"
                        >
                          <p className="text-red-900 font-medium">{error.error}</p>
                          <p className="text-red-700 text-xs mt-1">
                            Data: {JSON.stringify(error.data)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.success > 0 && (
                  <div className="pt-4">
                    <Link href="/contacts">
                      <Button className="w-full">
                        Visa importerade kontakter
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Tips för framgångsrik import</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Kontrollera att telefonnummer är i svenskt format (07XXXXXXXX)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Dubbelkolla att alla har SMS-samtycke innan import</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Använd semikolon (;) för att separera flera taggar</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Spara filen som CSV (kommaseparerad) för bästa resultat</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Testa med ett fåtal kontakter först innan stor import</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
