
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, CheckCircle, XCircle, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ticketService, Ticket } from '@/lib/ticket-service';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const MyTickets = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('upcoming');
  
  const { data: tickets, isLoading, refetch } = useQuery({
    queryKey: ['userTickets'],
    queryFn: ticketService.getUserTickets,
  });
  
  const handleCancelTicket = async (ticketId: number) => {
    if (window.confirm('Are you sure you want to cancel this ticket?')) {
      try {
        await ticketService.cancelTicket(ticketId);
        refetch();
      } catch (error) {
        toast.error('Failed to cancel ticket');
      }
    }
  };
  
  if (isLoading) {
    return (
      <div className="container py-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kenya-orange"></div>
      </div>
    );
  }
  
  // Filter tickets by date (upcoming vs past)
  const now = new Date();
  const upcomingTickets = tickets?.filter(ticket => new Date(ticket.event_date) >= now) || [];
  const pastTickets = tickets?.filter(ticket => new Date(ticket.event_date) < now) || [];
  
  const getBadgeColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return '';
    }
  };
  
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold text-white mb-6">My Tickets</h1>
      
      <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Upcoming Events ({upcomingTickets.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Past Events ({pastTickets.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="mt-6">
          {upcomingTickets.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center p-8">
                  <Info className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No upcoming tickets</h3>
                  <p className="text-muted-foreground mb-4">You don't have any tickets for upcoming events</p>
                  <Link to="/events">
                    <Button>Browse Events</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {upcomingTickets.map(ticket => (
                <TicketCard 
                  key={ticket.id} 
                  ticket={ticket} 
                  onCancel={() => handleCancelTicket(ticket.id)}
                  getBadgeColor={getBadgeColor}
                  isPast={false}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="past" className="mt-6">
          {pastTickets.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center p-8">
                  <Info className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No past tickets</h3>
                  <p className="text-muted-foreground">You haven't attended any events yet</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {pastTickets.map(ticket => (
                <TicketCard 
                  key={ticket.id} 
                  ticket={ticket}
                  getBadgeColor={getBadgeColor}
                  isPast={true}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface TicketCardProps {
  ticket: Ticket;
  onCancel?: () => void;
  getBadgeColor: (status: string) => string;
  isPast: boolean;
}

const TicketCard: React.FC<TicketCardProps> = ({ ticket, onCancel, getBadgeColor, isPast }) => {
  const eventDate = new Date(ticket.event_date);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const formattedTime = eventDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  
  return (
    <Card className="overflow-hidden flex flex-col md:flex-row">
      <div className="md:w-1/3 bg-kenya-brown p-6 flex flex-col justify-between">
        <div>
          <Badge className={`${getBadgeColor(ticket.status)} capitalize`}>
            {ticket.status}
          </Badge>
          <h3 className="mt-4 text-xl font-bold text-white">{ticket.event_title}</h3>
          <div className="mt-2 flex items-center text-kenya-brown-light gap-2">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">{formattedDate}</span>
          </div>
          <div className="mt-1 flex items-center text-kenya-brown-light gap-2">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">Location Info</span>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="text-white font-medium">{ticket.ticket_type}</div>
          <div className="text-lg font-bold text-white">
            {ticket.price > 0 ? `KSH ${ticket.price.toFixed(2)}` : 'Free'}
          </div>
        </div>
      </div>
      
      <div className="md:w-2/3 p-6">
        <div className="mb-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium">Ticket Details</h4>
              <p className="text-muted-foreground text-sm mt-1">Reference: {ticket.reference_code}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Time</div>
              <div>{formattedTime}</div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Purchased</span>
            <span>{new Date(ticket.purchase_date).toLocaleDateString()}</span>
          </div>
          
          <div className="border-t pt-4 mt-4">
            {isPast ? (
              <div className="flex justify-between">
                <Link to={`/events/${ticket.event_id}`} className="flex-1 mr-2">
                  <Button variant="outline" className="w-full">Event Details</Button>
                </Link>
                <Link to={`/events/${ticket.event_id}/feedback`} className="flex-1 ml-2">
                  <Button className="w-full">Leave Feedback</Button>
                </Link>
              </div>
            ) : (
              <div className="flex justify-between">
                <Link to={`/tickets/${ticket.id}`} className="flex-1 mr-2">
                  <Button className="w-full">View Ticket</Button>
                </Link>
                {ticket.status !== 'cancelled' && onCancel && (
                  <Button 
                    variant="outline" 
                    className="flex-1 ml-2" 
                    onClick={onCancel}
                  >
                    Cancel Ticket
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MyTickets;
