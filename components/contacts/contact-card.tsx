"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { displayPhoneNumber } from "@/lib/utils/phone";
import { Mail, Phone, Tag, MessageSquare, CheckCircle } from "lucide-react";
import Link from "next/link";

interface ContactCardProps {
  contact: {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
    tags?: string[] | null;
    sms_consent: boolean;
    total_sms_sent?: number;
  };
}

export function ContactCard({ contact }: ContactCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
              {(contact.name || "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">
                {contact.name || "Unnamed"}
              </h3>
              {contact.sms_consent && (
                <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>SMS-godkännande</span>
                </div>
              )}
            </div>
          </div>
          <Link href={`/contacts/${contact.id}`}>
            <Button variant="outline" size="sm">
              Visa
            </Button>
          </Link>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="h-4 w-4" />
            <span>{displayPhoneNumber(contact.phone)}</span>
          </div>

          {contact.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="h-4 w-4" />
              <span className="truncate">{contact.email}</span>
            </div>
          )}

          {contact.tags && contact.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mt-3">
              <Tag className="h-4 w-4 text-gray-400" />
              {contact.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="default">
                  {tag}
                </Badge>
              ))}
              {contact.tags.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{contact.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <MessageSquare className="h-4 w-4" />
            <span>{contact.total_sms_sent || 0} SMS</span>
          </div>
          <Link href={`/messages/send?contactId=${contact.id}`}>
            <Button size="sm" variant="outline">
              <MessageSquare className="h-4 w-4 mr-2" />
              Skicka SMS
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
