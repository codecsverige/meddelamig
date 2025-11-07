export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
        contact_notes: {
          Row: {
            id: string
            organization_id: string
            contact_id: string
            author_id: string | null
            note_type: 'note' | 'task' | 'alert'
            body: string
            created_at: string
          }
          Insert: {
            id?: string
            organization_id: string
            contact_id: string
            author_id?: string | null
            note_type?: 'note' | 'task' | 'alert'
            body: string
            created_at?: string
          }
          Update: {
            id?: string
            organization_id?: string
            contact_id?: string
            author_id?: string | null
            note_type?: 'note' | 'task' | 'alert'
            body?: string
            created_at?: string
          }
          Relationships: []
        }
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          industry: 'restaurant' | 'salon' | 'workshop' | 'b2b'
          phone: string | null
          email: string | null
          address: Json | null
          plan: 'starter' | 'professional' | 'business'
          sms_credits: number
          subscription_status: 'trial' | 'active' | 'cancelled' | 'past_due'
          settings: Json
          sms_sender_name: string
          gdpr_consent_date: string | null
          data_processing_agreement: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          industry: 'restaurant' | 'salon' | 'workshop' | 'b2b'
          phone?: string | null
          email?: string | null
          address?: Json | null
          plan?: 'starter' | 'professional' | 'business'
          sms_credits?: number
          subscription_status?: 'trial' | 'active' | 'cancelled' | 'past_due'
          settings?: Json
          sms_sender_name?: string
          gdpr_consent_date?: string | null
          data_processing_agreement?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          industry?: 'restaurant' | 'salon' | 'workshop' | 'b2b'
          phone?: string | null
          email?: string | null
          address?: Json | null
          plan?: 'starter' | 'professional' | 'business'
          sms_credits?: number
          subscription_status?: 'trial' | 'active' | 'cancelled' | 'past_due'
          settings?: Json
          sms_sender_name?: string
          gdpr_consent_date?: string | null
          data_processing_agreement?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          organization_id: string | null
          email: string
          full_name: string
          avatar_url: string | null
          role: 'owner' | 'admin' | 'member'
          permissions: Json
          language: string
          timezone: string
          created_at: string
          last_login_at: string | null
        }
        Insert: {
          id: string
          organization_id?: string | null
          email: string
          full_name: string
          avatar_url?: string | null
          role?: 'owner' | 'admin' | 'member'
          permissions?: Json
          language?: string
          timezone?: string
          created_at?: string
          last_login_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string | null
          email?: string
          full_name?: string
          avatar_url?: string | null
          role?: 'owner' | 'admin' | 'member'
          permissions?: Json
          language?: string
          timezone?: string
          created_at?: string
          last_login_at?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          id: string
          organization_id: string
          phone: string
          name: string | null
          email: string | null
          tags: string[]
          custom_fields: Json
          sms_consent: boolean
          marketing_consent: boolean
          consent_date: string | null
          consent_source: string | null
          total_bookings: number
          total_sms_sent: number
          last_visit_date: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          phone: string
          name?: string | null
          email?: string | null
          tags?: string[]
          custom_fields?: Json
          sms_consent?: boolean
          marketing_consent?: boolean
          consent_date?: string | null
          consent_source?: string | null
          total_bookings?: number
          total_sms_sent?: number
          last_visit_date?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          phone?: string
          name?: string | null
          email?: string | null
          tags?: string[]
          custom_fields?: Json
          sms_consent?: boolean
          marketing_consent?: boolean
          consent_date?: string | null
          consent_source?: string | null
          total_bookings?: number
          total_sms_sent?: number
          last_visit_date?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
        sms_messages: {
          Row: {
            id: string
            organization_id: string
            contact_id: string | null
            user_id: string | null
            to_phone: string
            from_phone: string | null
            message: string
            sender_name: string
            type: 'reminder' | 'confirmation' | 'marketing' | 'manual'
            direction: 'outbound' | 'inbound'
            template_id: string | null
            status: 'pending' | 'sent' | 'delivered' | 'failed' | 'received'
            sent_at: string | null
            delivered_at: string | null
            external_id: string | null
            cost: number | null
            error_message: string | null
            scheduled_for: string | null
            created_at: string
          }
          Insert: {
            id?: string
            organization_id: string
            contact_id?: string | null
            user_id?: string | null
            to_phone: string
            from_phone?: string | null
            message: string
            sender_name?: string
            type: 'reminder' | 'confirmation' | 'marketing' | 'manual'
            direction?: 'outbound' | 'inbound'
            template_id?: string | null
            status?: 'pending' | 'sent' | 'delivered' | 'failed' | 'received'
            sent_at?: string | null
            delivered_at?: string | null
            external_id?: string | null
            cost?: number | null
            error_message?: string | null
            scheduled_for?: string | null
            created_at?: string
          }
          Update: {
            id?: string
            organization_id?: string
            contact_id?: string | null
            user_id?: string | null
            to_phone?: string
            from_phone?: string | null
            message?: string
            sender_name?: string
            type?: 'reminder' | 'confirmation' | 'marketing' | 'manual'
            direction?: 'outbound' | 'inbound'
            template_id?: string | null
            status?: 'pending' | 'sent' | 'delivered' | 'failed' | 'received'
            sent_at?: string | null
            delivered_at?: string | null
            external_id?: string | null
            cost?: number | null
            error_message?: string | null
            scheduled_for?: string | null
            created_at?: string
          }
          Relationships: []
        }
      sms_templates: {
        Row: {
          id: string
          organization_id: string | null
          name: string
          message: string
          category: 'reminder' | 'confirmation' | 'marketing' | 'thank_you'
          is_global: boolean
          industry: string | null
          usage_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id?: string | null
          name: string
          message: string
          category: 'reminder' | 'confirmation' | 'marketing' | 'thank_you'
          is_global?: boolean
          industry?: string | null
          usage_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          name?: string
          message?: string
          category?: 'reminder' | 'confirmation' | 'marketing' | 'thank_you'
          is_global?: boolean
          industry?: string | null
          usage_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          id: string
          organization_id: string
          user_id: string | null
          name: string
          message: string
          target_tags: string[] | null
          target_contact_ids: string[] | null
          scheduled_for: string | null
          status: 'draft' | 'scheduled' | 'sending' | 'completed'
          total_recipients: number
          sent_count: number
          delivered_count: number
          failed_count: number
          total_cost: number | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          user_id?: string | null
          name: string
          message: string
          target_tags?: string[] | null
          target_contact_ids?: string[] | null
          scheduled_for?: string | null
          status?: 'draft' | 'scheduled' | 'sending' | 'completed'
          total_recipients?: number
          sent_count?: number
          delivered_count?: number
          failed_count?: number
          total_cost?: number | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string | null
          name?: string
          message?: string
          target_tags?: string[] | null
          target_contact_ids?: string[] | null
          scheduled_for?: string | null
          status?: 'draft' | 'scheduled' | 'sending' | 'completed'
          total_recipients?: number
          sent_count?: number
          delivered_count?: number
          failed_count?: number
          total_cost?: number | null
          created_at?: string
          completed_at?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          organization_id: string | null
          user_id: string | null
          action: string
          resource_type: string
          resource_id: string | null
          details: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id?: string | null
          user_id?: string | null
          action: string
          resource_type: string
          resource_id?: string | null
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          user_id?: string | null
          action?: string
          resource_type?: string
          resource_id?: string | null
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
