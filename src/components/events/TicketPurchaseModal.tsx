import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Music, Ticket, X } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ticketService } from '@/lib/ticket-service';
import { toast } from 'sonner';
import type { Event } from '@/types/event.types';

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

  if (!event) return null;

  const totalPrice = (event.price || 0) * quantity;

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to purchase tickets');
      navigate('/login');
      return;
    }

    try {
      setIsPurchasing(true);
      await ticketService.purchaseTicket({
        event_id: event.id,
        ticket_type: 'general',
        quantity: quantity,
        payment_method: 'mpesa', // Default to M-Pesa
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
      <DialogContent className="max-w-2xl bg-kenya-dark border-white/10 text-white max-h-[90vh] overflow-y-auto">
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
          {/* Event Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-white/90">
              <Calendar className="h-5 w-5 text-kenya-orange" />
              <span>
                {format(new Date(event.date), 'EEEE, MMMM d, yyyy')}
              </span>
            </div>

            {event.time && (
              <div className="flex items-center gap-3 text-white/90">
                <Clock className="h-5 w-5 text-kenya-orange" />
                <span>{event.time.slice(0, 5)}</span>
              </div>
            )}

            <div className="flex items-center gap-3 text-white/90">
              <MapPin className="h-5 w-5 text-kenya-orange" />
              <span>{event.location}</span>
            </div>

            {event.performing_artists && event.performing_artists.length > 0 && (
              <div className="flex items-start gap-3 text-white/90">
                <Music className="h-5 w-5 text-kenya-orange mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium mb-1">Performing Artists:</p>
                  <div className="flex flex-wrap gap-2">
                    {event.performing_artists.map((artist, index) => (
                      <Badge
                        key={index}
                        className="bg-kenya-orange/20 text-kenya-orange border-kenya-orange/30"
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
                <p className="text-sm text-white/70">{event.description}</p>
              </div>
            )}
          </div>

          {/* Ticket Selection */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-white">General Admission</p>
                <p className="text-sm text-white/70">
                  {event.price ? `KSh ${event.price.toLocaleString()}` : 'Free'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-semibold">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={event.capacity ? quantity >= event.capacity : false}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  +
                </Button>
              </div>
            </div>

            {event.capacity && (
              <p className="text-xs text-white/60">
                {event.capacity - quantity} tickets remaining
              </p>
            )}
          </div>

          {/* Total */}
          {event.price && (
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-lg font-semibold text-white">Total</p>
              <p className="text-2xl font-bold text-kenya-orange">
                KSh {totalPrice.toLocaleString()}
              </p>
            </div>
          )}

          {/* Actions */}
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
              className="flex-1 bg-gradient-to-r from-kenya-orange via-amber-400 to-kenya-orange text-black hover:opacity-90"
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

