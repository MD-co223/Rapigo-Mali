'use client';

import { User, Phone, Mail, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ============================================
// INFORMATIONS DE SUPPORT OFFICIELLES
// Développeur : Mr. Diarra Moussa
// Ces informations sont utilisées partout dans la plateforme
// ============================================

export const SUPPORT_INFO = {
  developer: 'Mr. Diarra Moussa',
  phone: '+223 77 16 38 62',
  phoneRaw: '+22377163862',
  email: 'diarramoussaka7@gmail.com',
  whatsapp: '22377163862',
} as const;

export function SupportContactCard({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      <p className="text-sm font-semibold text-center">Support &amp; Contact</p>
      <div className="flex items-center gap-2 text-sm">
        <User className="h-4 w-4 text-emerald-600 shrink-0" />
        <span>
          <strong>Développeur :</strong> {SUPPORT_INFO.developer}
        </span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <Phone className="h-4 w-4 text-emerald-600 shrink-0" />
        <span>
          <strong>Téléphone :</strong> {SUPPORT_INFO.phone}
        </span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <Mail className="h-4 w-4 text-emerald-600 shrink-0" />
        <span>
          <strong>Email :</strong> {SUPPORT_INFO.email}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-2">
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-xs"
          onClick={() => window.open(`tel:${SUPPORT_INFO.phoneRaw}`)}
        >
          <Phone className="h-3.5 w-3.5 mr-1" />
          Appeler
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-green-500 text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950 text-xs"
          onClick={() =>
            window.open(
              `https://wa.me/${SUPPORT_INFO.whatsapp}?text=${encodeURIComponent('Bonjour Mr. Diarra Moussa, je vous contacte depuis Rapigo Mali.')}`,
              '_blank'
            )
          }
        >
          <MessageCircle className="h-3.5 w-3.5 mr-1" />
          WhatsApp
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-xs"
          onClick={() =>
            window.open(`mailto:${SUPPORT_INFO.email}?subject=${encodeURIComponent('Assistance Rapigo Mali')}`)
          }
        >
          <Mail className="h-3.5 w-3.5 mr-1" />
          E-mail
        </Button>
      </div>
    </div>
  );
}