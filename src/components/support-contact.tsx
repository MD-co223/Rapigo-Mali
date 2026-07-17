'use client';

import { Phone, Mail, MessageCircle, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SupportContact({ variant = 'full' }: { variant?: 'full' | 'compact' | 'minimal' }) {
  const phone = '+223 77 16 38 62';
  const whatsapp = '22377163862';
  const email = 'diarramoussaka7@gmail.com';

  if (variant === 'minimal') {
    return (
      <p className="text-sm text-muted-foreground text-center">
        Support : <a href={`tel:${phone.replace(/\s/g, '')}`} className="text-primary font-medium hover:underline">{phone}</a>
      </p>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
        <a href={`tel:${phone.replace(/\s/g, '')}`} className="flex items-center gap-1 hover:text-primary transition-colors">
          <Phone className="h-3.5 w-3.5" /> {phone}
        </a>
        <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-green-600 transition-colors">
          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
        </a>
        <a href={`mailto:${email}`} className="flex items-center gap-1 hover:text-primary transition-colors">
          <Mail className="h-3.5 w-3.5" /> {email}
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h3 className="text-lg font-semibold">Besoin d&apos;aide ?</h3>
        <p className="text-sm text-muted-foreground">Notre équipe est disponible pour vous accompagner.</p>
        <p className="text-sm font-medium text-primary">Mr. Diarra Moussa</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild variant="outline" className="gap-2">
          <a href={`tel:${phone.replace(/\s/g, '')}`}>
            <Phone className="h-4 w-4" /> Appeler
          </a>
        </Button>
        <Button asChild className="gap-2 bg-green-600 hover:bg-green-700 text-white">
          <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('Bonjour, je souhaite avoir des informations sur Rapigo Mali.')}`} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        </Button>
        <Button asChild variant="outline" className="gap-2">
          <a href={`mailto:${email}`}>
            <Mail className="h-4 w-4" /> Envoyer un email
          </a>
        </Button>
      </div>
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-3.5 w-3.5" /> Bamako, Mali
      </div>
    </div>
  );
}