import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Music, Ticket, Minus, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ticketService } from '@/lib/ticket-service';
import {
  fetchEventTicketTypes,
  type EventTicketTypeRow,
} from '@/lib/event-ticket-types';
import { toast } from 'sonner';
import type { Event } from '@/types/event.types';
import { ParagraphizedDescription } from '@/components/common/ParagraphizedDescription';
import { cn } from '@/lib/utils';

interface TicketPurchaseModalProps {
  open: boolean;
  onClose: () => void;
  event: Event | null;
}

const TicketPurchaseModal: React.FC<TicketPurchaseModalProps> = ({
  open,
  onClose,
  event,
}) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [selectedTierId, setSelectedTierId] = useState<number | null>(null);

  const { data: ticketTypes = [] } = useQuery({
    queryKey: ['event-ticket-types', event?.id],
    queryFn: () => fetchEventTicketTypes(event!.id),
    enabled: open && !!event?.id,
  });

  const fallbackTier: EventTicketTypeRow[] = useMemo(() => {
    if (!event) return [];
    return [
      {
        id: 0,
        event_id: event.id,
        name: 'General Admission',
        description: null,
        price: event.price || 0,
        capacity: event.capacity ?? null,
        sort_order: 0,
        is_active: true,
        sale_starts_at: null,
        sale_ends_at: null,
      },
    ];
  }, [event]);

  const tiers = ticketTypes.length > 0 ? ticketTypes : fallbackTier;

  useEffect(() => {
    if (!open) {
      setQuantity(1);
      setSelectedTierId(null);
      return;
    }
    if (tiers.length > 0) {
      setSelectedTierId((prev) =>
        prev != null && tiers.some((t) => t.id === prev) ? prev : tiers[0].id,
      );
    }
  }, [open, tiers]);

  if (!event) return null;

  const selectedTier =
    tiers.find((t) => t.id === selectedTierId) || tiers[0] || null;
  const unitPrice = selectedTier?.price ?? event.price ?? 0;
  const totalPrice = unitPrice * quantity;

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to purchase tickets');
      navigate('/login');
      return;
    }
    if (!selectedTier) {
      toast.error('Select a ticket type');
      return;
    }

    try {
      setIsPurchasing(true);
      await ticketService.purchaseTicket({
        event_id: event.id,
        ticket_type: selectedTier.name,
        ticket_type_id: selectedTier.id > 0 ? selectedTier.id : undefined,
        unit_price: unitPrice,
        quantity,
        payment_method: 'mpesa',
      });
      toast.success('Ticket purchase initiated! Check your phone to complete payment.');
      onClose();
    } catch (error) {
      console.error('Error purchasing ticket:', error);
      toast.error('Failed to purchase ticket');
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gradient-promo border-white/10 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">{event.title}</DialogTitle>
          <DialogDescription className="text-white/70">
            Get your tickets for this amazing event
          </DialogDescription>
        </DialogHeader>

        {event.image_url && (
          <div className="relative h-48 w-full overflow-hidden rounded-lg">
            <img
              src={event.image_url}
              alt={event.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-white/90">
              <Calendar className="h-5 w-5 text-gradient-orange-accent" />
              <span>{format(new Date(event.date), 'EEEE, MMMM d, yyyy')}</span>
            </div>

            {event.time && (
              <div className="flex items-center gap-3 text-white/90">
                <Clock className="h-5 w-5 text-gradient-orange-accent" />
                <span>{event.time.slice(0, 5)}</span>
              </div>
            )}

            <div className="flex items-center gap-3 text-white/90">
              <MapPin className="h-5 w-5 text-gradient-orange-accent" />
              <span>{event.location}</span>
            </div>

            {event.performing_artists && event.performing_artists.length > 0 && (
              <div className="flex items-start gap-3 text-white/90">
                <Music className="h-5 w-5 text-gradient-orange-accent mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium mb-1">Performing Artists:</p>
                  <div className="flex flex-wrap gap-2">
                    {event.performing_artists.map((artist, index) => (
                      <Badge
                        key={index}
                        className="bg-gradient-accent/20 text-gradient-orange-accent border-kenya-orange/30"
                      >
                        {artist}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {event.description && (
              <div className="pt-2">
                <ParagraphizedDescription
                  text={event.description}
                  paragraphClassName="text-sm text-white/70 leading-relaxed"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-white/90">Choose ticket type</p>
            {tiers.map((tier) => {
              const active = selectedTier?.id === tier.id;
              return (
                <button
                  key={tier.id || tier.name}
                  type="button"
                  onClick={() => {
                    setSelectedTierId(tier.id);
                    setQuantity(1);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors',
                    active
                      ? 'border-kenya-orange/60 bg-gradient-accent/15'
                      : 'border-white/10 bg-white/5 hover:border-white/25',
                  )}
                >
                  <div>
                    <p className="font-semibold text-white">{tier.name}</p>
                    {tier.description ? (
                      <p className="text-xs text-white/60">{tier.description}</p>
                    ) : null}
                  </div>
                  <p className="text-sm font-semibold text-gradient-orange-accent">
                    {tier.price > 0 ? `KSh ${Number(tier.price).toLocaleString()}` : 'Free'}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-white">Quantity</p>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-semibold">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={
                    selectedTier?.capacity
                      ? quantity >= selectedTier.capacity
                      : event.capacity
                        ? quantity >= event.capacity
                        : false
                  }
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {unitPrice > 0 && (
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-lg font-semibold text-white">Total</p>
              <p className="text-2xl font-bold text-gradient-orange-accent">
                KSh {totalPrice.toLocaleString()}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isPurchasing}
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={isPurchasing}
              className="flex-1 bg-gradient-to-r bg-gradient-accent text-black hover:opacity-90"
            >
              <Ticket className="mr-2 h-4 w-4" />
              {isPurchasing ? 'Processing...' : 'Get Tickets'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TicketPurchaseModal;
