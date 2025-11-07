import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * 46elks Webhook Handler
 * 
 * Receives delivery status updates from 46elks
 * Documentation: https://46elks.com/docs/receive-sms-delivery-status
 * 
 * Webhook URL: https://your-domain.com/api/webhooks/46elks
 */

export async function POST(request: Request) {
  try {
    // Parse form data (46elks sends as application/x-www-form-urlencoded)
    const formData = await request.formData();
    
    const webhookData = {
      id: formData.get('id') as string,
      status: formData.get('status') as string,
      delivered: formData.get('delivered') as string,
      direction: formData.get('direction') as string,
      from: formData.get('from') as string,
      to: formData.get('to') as string,
      message: formData.get('message') as string,
      created: formData.get('created') as string,
    };

    console.log('📨 46elks webhook received:', webhookData);

    // Validate webhook data
    if (!webhookData.id || !webhookData.status) {
      console.error('❌ Invalid webhook data:', webhookData);
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create Supabase admin client (no user session needed for webhooks)
    const supabase = createRouteHandlerClient({ cookies });

    // Find the SMS message by external_id
    const { data: message, error: findError } = await supabase
      .from('sms_messages')
      .select('*')
      .eq('external_id', webhookData.id)
      .single();

    if (findError || !message) {
      console.warn('⚠️ SMS message not found for external_id:', webhookData.id);
      // Return 200 anyway to prevent 46elks from retrying
      return NextResponse.json({ received: true });
    }

    // Determine new status
    let newStatus: 'delivered' | 'failed' | 'sent' = 'sent';
    let deliveredAt: string | null = null;

    if (webhookData.status === 'delivered' || webhookData.delivered === 'yes') {
      newStatus = 'delivered';
      deliveredAt = new Date().toISOString();
    } else if (webhookData.status === 'failed') {
      newStatus = 'failed';
    }

    // Update SMS message status
    const { error: updateError } = await supabase
      .from('sms_messages')
      .update({
        status: newStatus,
        delivered_at: deliveredAt,
      })
      .eq('id', message.id);

    if (updateError) {
      console.error('❌ Failed to update SMS status:', updateError);
      throw updateError;
    }

    console.log(`✅ SMS ${message.id} status updated to: ${newStatus}`);

    // Return 200 to acknowledge receipt
    return NextResponse.json({ 
      received: true,
      message_id: message.id,
      status: newStatus,
    });

  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    
    // Return 200 even on error to prevent 46elks from retrying indefinitely
    // We log the error for debugging
    return NextResponse.json(
      { error: error.message, received: true },
      { status: 200 }
    );
  }
}

/**
 * GET endpoint for testing webhook is reachable
 */
export async function GET() {
  return NextResponse.json({
    service: '46elks Webhook Handler',
    status: 'active',
    endpoint: '/api/webhooks/46elks',
    method: 'POST',
    documentation: 'https://46elks.com/docs/receive-sms-delivery-status',
  });
}
