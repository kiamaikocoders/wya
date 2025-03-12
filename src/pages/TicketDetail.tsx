
import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Share2, Download, ArrowLeft } from 'lucide-react';
import { ticketService } from '@/lib/ticket-service';
import { toast } from 'sonner';
import QRCode from 'qrcode.react';

const TicketDetail = () => {
  const { ticketId } = useParams();
  const ticketRef = useRef<HTMLDivElement>(null);
  
  const { data: ticket, isLoading, error } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => ticketId ? ticketService.getTicketById(Number(ticketId)) : Promise.reject('No ticket ID'),
    enabled: !!ticketId,
  });
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${ticket?.event_title} Ticket`,
          text: `Check out my ticket for ${ticket?.event_title}!`,
          url: window.location.href,
        });
      } catch (error) {
        toast.error('Error sharing the ticket');
      }
    } else {
      toast.error('Web Share API not supported in your browser');
    }
  };
  
  const handleDownload = () => {
    // This is a placeholder for ticket download functionality
    toast.success('Ticket download functionality would be implemented here');
  };
  
  if (isLoading) {
    return (
      <div className="container py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kenya-orange"></div>
      </div>
    );
  }
  
  if (error || !ticket) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center p-8">
              <h2 className="text-xl mb-4">Ticket Not Found</h2>
              <p className="mb-6">The ticket you're looking for doesn't exist or you don't have permission to view it.</p>
              <Link to="/tickets">
                <Button>Back to My Tickets</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const eventDate = new Date(ticket.event_date);
  
  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center gap-2">
        <Link to="/tickets">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-white">Ticket Details</h1>
      </div>
      
      <div className="max-w-2xl mx-auto">
        <Card className="overflow-hidden" ref={ticketRef}>
          <div className="bg-kenya-orange p-6">
            <Badge className={ticket.status === 'confirmed' ? 'bg-green-500' : ticket.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'}>
              {ticket.status.toUpperCase()}
            </Badge>
            <h2 className="text-2xl font-bold mt-4 text-white">{ticket.event_title}</h2>
            
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-white">
                <Calendar className="h-5 w-5" />
                <div>
                  <div>{eventDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                  <div className="text-sm opacity-80">{eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-white">
                <MapPin className="h-5 w-5" />
                <div>
                  <div>Venue Name</div>
                  <div className="text-sm opacity-80">Location Address</div>
                </div>
              </div>
            </div>
          </div>
          
          <CardContent className="p-6 flex flex-col items-center">
            <div className="border-dashed border-t-2 border-muted w-full mb-6"></div>
            
            <div className="mb-6 p-3 bg-white rounded-lg">
              <QRCode 
                value={`TICKET:${ticket.id}:${ticket.reference_code}`}
                size={180}
                level="H"
                includeMargin={true}
              />
            </div>
            
            <div className="w-full space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ticket Type</span>
                <span className="font-medium">{ticket.ticket_type}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference Code</span>
                <span className="font-mono text-sm">{ticket.reference_code}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price</span>
                <span className="font-medium">{ticket.price > 0 ? `KSH ${ticket.price.toFixed(2)}` : 'Free'}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Purchase Date</span>
                <span>{new Date(ticket.purchase_date).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between p-6 pt-0 gap-2">
            <Button variant="outline" className="flex-1 gap-2" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button className="flex-1 gap-2" onClick={handleDownload}>
              <Download className="h-4 w-4" />
              Download
            </Button>
          </CardFooter>
        </Card>
        
        <div className="mt-8">
          <Link to={`/events/${ticket.event_id}`}>
            <Button variant="outline" className="w-full">View Event Details</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
