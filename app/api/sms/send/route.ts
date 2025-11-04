import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { elksClient } from '@/lib/46elks/client';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: user } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', session.user.id)
      .single();

    if (!user?.organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Get request body
    const { contactId, message, templateId } = await request.json();

    if (!contactId || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get contact
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .eq('organization_id', user.organization_id)
      .eq('sms_consent', true)
      .single();

    if (contactError || !contact) {
      return NextResponse.json({ error: 'Contact not found or no SMS consent' }, { status: 404 });
    }

    // Get organization settings
    const { data: org } = await supabase
      .from('organizations')
      .select('sms_sender_name, sms_credits')
      .eq('id', user.organization_id)
      .single();

    // Check SMS credits
    if ((org?.sms_credits || 0) <= 0) {
      return NextResponse.json({ error: 'Insufficient SMS credits' }, { status: 402 });
    }

    // Send SMS via 46elks
    const smsResult = await elksClient.sendSMS({
      to: contact.phone,
      message,
      from: org?.sms_sender_name || 'MEDDELA',
    });

    // Check if SMS failed
    if ('code' in smsResult) {
      throw new Error(smsResult.message);
    }

    // Save SMS to database
    const { error: insertError } = await supabase.from('sms_messages').insert({
      organization_id: user.organization_id,
      contact_id: contactId,
      user_id: session.user.id,
      to_phone: contact.phone,
      message,
      sender_name: org?.sms_sender_name || 'MEDDELA',
      type: 'manual',
      template_id: templateId || null,
      status: 'sent',
      sent_at: new Date().toISOString(),
      external_id: smsResult.id,
      cost: smsResult.cost,
    });

    if (insertError) {
      console.error('Failed to save SMS to database:', insertError);
    }

    // Update contact stats
    await supabase
      .from('contacts')
      .update({
        total_sms_sent: (contact.total_sms_sent || 0) + 1,
      })
      .eq('id', contactId);

    // Deduct SMS credits
    await supabase
      .from('organizations')
      .update({
        sms_credits: (org?.sms_credits || 0) - 1,
      })
      .eq('id', user.organization_id);

    return NextResponse.json({
      success: true,
      smsId: smsResult.id,
      cost: smsResult.cost,
    });
  } catch (error: any) {
    console.error('SMS send error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send SMS' },
      { status: 500 }
    );
  }
}
